// Emite NFC-e (cupom do PDV) ou NF-e (pedido ou venda para CNPJ) pela Focus NFe.
// - verify_jwt: quem chama precisa operar a loja (_can_operate_store com o token do usuário).
// - Sem FOCUS_NFE_TOKEN: 503 "Módulo fiscal ainda não configurado".
// - Idempotente: uma nota viva por venda/tipo/ambiente. Autorizada ou processando → devolve a mesma;
//   rejeitada (erro) → reenvia com a MESMA ref depois de corrigir; cancelada → nova ref (attempt+1).
// Recebe: { store_id, tipo: 'nfce'|'nfe', comanda_id | order_id, cpf_cnpj?, nome?, destinatario? }
// Devolve: { document, already? } ou { error, code, errors? }.
import { corsHeaders } from "../_shared/cors.ts";
import {
  adminClient, applyFocusDocument, DOC_COLUMNS, err, fiscalNotConfigured, focusCall, json, loadFiscalStore,
  missingToken, requireStoreUser, setDocumentError, type Any,
} from "../_shared/fiscal-server.ts";
import { loadComandaSale, loadOrderSale } from "../_shared/fiscal-source.ts";
import {
  buildNfcePayload, buildNfePayload, buildRef, focusPath, interpretFocusResponse, parseEmitRequest, presenceForOrder,
  type FiscalEnvironment,
} from "../_shared/focus-nfe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return err(405, "Método não permitido.", "method_not_allowed");
  const off = fiscalNotConfigured();
  if (off) return off;

  try {
    const parsed = parseEmitRequest(await req.json().catch(() => null));
    if (!parsed.ok) return err(400, parsed.error, "invalid_request");
    const input = parsed.req;

    const user = await requireStoreUser(req, input.store_id, "operate");
    if (user instanceof Response) return user;
    const admin = adminClient();

    const store = await loadFiscalStore(admin, input.store_id);
    if (store instanceof Response) return store;
    const env = store.settings.environment as FiscalEnvironment;
    if (!store.token) return missingToken(env);

    // ── Nota viva desta venda (idempotência) ──
    const sourceCol = input.comanda_id ? "comanda_id" : "order_id";
    const sourceId = (input.comanda_id ?? input.order_id)!;
    const { data: docs, error: docsError } = await admin.from("fiscal_documents")
      .select(DOC_COLUMNS).eq(sourceCol, sourceId).eq("doc_type", input.tipo).eq("environment", env)
      .order("attempt", { ascending: false });
    if (docsError) {
      console.error("[fiscal-emit] erro ao ler documentos", docsError);
      return err(500, "Erro ao conferir notas desta venda.", "lookup_failed");
    }
    const live = (docs ?? []).find((d: Any) => !["cancelado", "denegado"].includes(d.status));
    if (live && (live.status === "autorizado" || live.status === "processando")) {
      return json({ document: live, already: true });
    }

    // ── Venda e montagem da nota ──
    const loaded = input.comanda_id
      ? await loadComandaSale(admin, input.store_id, input.comanda_id, store.settings.include_service_fee !== false)
      : await loadOrderSale(admin, input.store_id, input.order_id!);
    if (loaded instanceof Response) return loaded;

    const now = new Date();
    const built = input.tipo === "nfce"
      ? buildNfcePayload(loaded.sale, store.settings, { document: input.cpf_cnpj, name: input.nome ?? loaded.customerName }, { now, timeZone: store.timeZone })
      : buildNfePayload(loaded.sale, store.settings, input.destinatario!, {
        now, timeZone: store.timeZone,
        presence: loaded.order ? presenceForOrder(loaded.order.source, loaded.order.delivery_type) : "1",
      });
    if (!built.ok) return err(422, built.errors[0], "validation", { errors: built.errors });

    // ── Registro antes de chamar a Focus (o índice único barra o 2º clique) ──
    const row = {
      status: "processando", request_payload: built.payload, total: built.total,
      recipient_document: built.recipientDocument, recipient_name: built.recipientName,
      error_message: null, focus_status: null, status_sefaz: null, mensagem_sefaz: null,
    };
    let doc: Any;
    if (live) {
      const { data, error } = await admin.from("fiscal_documents").update(row).eq("id", live.id).eq("status", "erro")
        .select(DOC_COLUMNS).maybeSingle();
      if (error || !data) return json({ document: live, already: true });
      doc = data;
    } else {
      const attempt = (docs?.[0]?.attempt ?? 0) + 1;
      const { data, error } = await admin.from("fiscal_documents").insert({
        ...row, store_id: input.store_id, doc_type: input.tipo, environment: env,
        [sourceCol]: sourceId, ref: buildRef(input.tipo, env, sourceId, attempt), attempt, created_by: user.id,
      }).select(DOC_COLUMNS).single();
      if (error) {
        if ((error as Any).code === "23505") {
          const { data: other } = await admin.from("fiscal_documents").select(DOC_COLUMNS).eq(sourceCol, sourceId)
            .eq("doc_type", input.tipo).eq("environment", env).not("status", "in", "(cancelado,denegado)").maybeSingle();
          if (other) return json({ document: other, already: true });
        }
        console.error("[fiscal-emit] erro ao registrar documento", error);
        return err(500, "Não foi possível registrar a nota. Tente novamente.", "insert_failed");
      }
      doc = data;
    }

    // ── Envio ──
    const sent = await focusCall(env, store.token, "POST", `${focusPath(input.tipo)}?ref=${encodeURIComponent(doc.ref)}`, built.payload);
    let outcome = interpretFocusResponse(sent.status, sent.body, input.tipo, env);
    let raw: unknown = sent.body;
    if (outcome.kind === "already_used") {
      const check = await focusCall(env, store.token, "GET", focusPath(input.tipo, doc.ref));
      outcome = interpretFocusResponse(check.status, check.body, input.tipo, env);
      raw = check.body;
    }
    if (outcome.kind === "document") {
      const updated = await applyFocusDocument(admin, doc, outcome.doc, raw);
      console.info("[fiscal-emit]", JSON.stringify({ store_id: input.store_id, ref: doc.ref, status: updated.status }));
      return json({ document: updated });
    }
    if (outcome.kind === "error" && sent.status === 0) {
      // Sem resposta: a Focus pode ter recebido. Fica "processando" para consultar depois.
      const { data } = await admin.from("fiscal_documents")
        .update({ error_message: outcome.message }).eq("id", doc.id).select(DOC_COLUMNS).single();
      return json({ document: data ?? doc, warning: outcome.message });
    }
    const message = outcome.kind === "error" ? outcome.message : "A Focus não confirmou a nota.";
    const failed = await setDocumentError(admin, doc.id, message, raw);
    return json({ document: failed ?? { ...doc, status: "erro", error_message: message } });
  } catch (e) {
    console.error("[fiscal-emit]", e);
    return err(500, "Erro interno ao emitir a nota. Tente novamente.", "internal_error");
  }
});
