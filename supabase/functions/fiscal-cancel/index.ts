// Cancela uma nota autorizada na Focus (DELETE /v2/{nfce|nfe}/{ref} com justificativa).
// verify_jwt; só dono/admin da loja (is_store_admin_of). Sem FOCUS_NFE_TOKEN: 503.
// Prazo da Focus: NFC-e 30 min, NF-e 24 h; justificativa de 15 a 255 caracteres (cancelCheck).
// Recebe: { document_id, justificativa }. Devolve: { document } ou { error, code }.
import { corsHeaders } from "../_shared/cors.ts";
import {
  adminClient, DOC_COLUMNS, err, fiscalNotConfigured, focusCall, isUuid, json, loadFiscalStore, missingToken,
  requireStoreUser,
} from "../_shared/fiscal-server.ts";
import {
  cancelCheck, focusPath, interpretFocusResponse, parseFocusDocument, type FiscalEnvironment,
} from "../_shared/focus-nfe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return err(405, "Método não permitido.", "method_not_allowed");
  const off = fiscalNotConfigured();
  if (off) return off;

  try {
    const body = await req.json().catch(() => null);
    if (!isUuid(body?.document_id)) return err(400, "Nota inválida.", "invalid_request");
    const admin = adminClient();
    const { data: doc, error } = await admin.from("fiscal_documents").select(DOC_COLUMNS).eq("id", body.document_id).maybeSingle();
    if (error) return err(500, "Erro ao ler a nota.", "lookup_failed");
    if (!doc) return err(404, "Nota não encontrada.", "not_found");

    const user = await requireStoreUser(req, doc.store_id, "admin");
    if (user instanceof Response) return user;

    const check = cancelCheck(doc, String(body?.justificativa ?? ""), new Date());
    if (!check.ok) return err(422, check.error, "cannot_cancel");

    const env = doc.environment as FiscalEnvironment;
    const store = await loadFiscalStore(admin, doc.store_id, env);
    if (store instanceof Response) return store;
    if (!store.token) return missingToken(env);

    const res = await focusCall(env, store.token, "DELETE", focusPath(doc.doc_type, doc.ref), { justificativa: check.justificativa });
    // CONFERIR NA FOCUS: resposta do cancelamento (status "cancelado" ou "erro_cancelamento" + mensagem_sefaz).
    if (res.status >= 200 && res.status < 300 && res.body?.status === "cancelado") {
      const parsed = parseFocusDocument(res.body, doc.doc_type, env);
      const { data: updated } = await admin.from("fiscal_documents").update({
        status: "cancelado",
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancel_justificativa: check.justificativa,
        status_sefaz: parsed.status_sefaz ?? doc.status_sefaz,
        mensagem_sefaz: parsed.mensagem_sefaz ?? doc.mensagem_sefaz,
        focus_status: "cancelado",
      }).eq("id", doc.id).select(DOC_COLUMNS).single();
      console.info("[fiscal-cancel]", JSON.stringify({ store_id: doc.store_id, ref: doc.ref, user_id: user.id }));
      return json({ document: updated ?? { ...doc, status: "cancelado" } });
    }
    if (res.status >= 200 && res.status < 300) {
      const msg = res.body?.mensagem_sefaz || res.body?.mensagem || "A SEFAZ não aceitou o cancelamento.";
      return err(422, `Cancelamento recusado: ${msg}`, "cancel_rejected");
    }
    const outcome = interpretFocusResponse(res.status, res.body, doc.doc_type, env);
    const message = outcome.kind === "error" ? outcome.message : "Não foi possível cancelar a nota.";
    return err(res.status === 0 ? 502 : 422, message, outcome.kind === "error" ? outcome.code : "cancel_failed");
  } catch (e) {
    console.error("[fiscal-cancel]", e);
    return err(500, "Erro interno ao cancelar a nota.", "internal_error");
  }
});
