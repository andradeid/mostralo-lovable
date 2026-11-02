// Consulta uma nota na Focus e atualiza fiscal_documents (para quando fica "processando").
// verify_jwt; quem chama precisa operar a loja da nota. Sem FOCUS_NFE_TOKEN: 503.
// Recebe: { document_id }. Devolve: { document } ou { error, code }.
import { corsHeaders } from "../_shared/cors.ts";
import {
  adminClient, applyFocusDocument, DOC_COLUMNS, err, fiscalNotConfigured, focusCall, isUuid, json, loadFiscalStore,
  missingToken, requireStoreUser, setDocumentError,
} from "../_shared/fiscal-server.ts";
import { focusPath, interpretFocusResponse, type FiscalDocType, type FiscalEnvironment } from "../_shared/focus-nfe.ts";

// Sem registro na Focus depois deste tempo = o envio não chegou; libera reenviar com a mesma ref.
const LOST_AFTER_MS = 3 * 60_000;

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

    const user = await requireStoreUser(req, doc.store_id, "operate");
    if (user instanceof Response) return user;

    // A nota é consultada no ambiente em que foi emitida (mesmo se a loja trocou depois)
    const env = doc.environment as FiscalEnvironment;
    const store = await loadFiscalStore(admin, doc.store_id, env);
    if (store instanceof Response) return store;
    const token = store.token;
    if (!token) return missingToken(env);

    const res = await focusCall(env, token, "GET", focusPath(doc.doc_type as FiscalDocType, doc.ref));
    const outcome = interpretFocusResponse(res.status, res.body, doc.doc_type, env);
    if (outcome.kind === "document") return json({ document: await applyFocusDocument(admin, doc, outcome.doc, res.body) });

    if (res.status === 404 && doc.status === "processando" && Date.now() - Date.parse(doc.updated_at) > LOST_AFTER_MS) {
      const lost = await setDocumentError(admin, doc.id, "A nota não chegou na Focus. Emita de novo.", res.body);
      return json({ document: lost ?? doc });
    }
    const message = outcome.kind === "error" ? outcome.message : "A Focus ainda não tem a nota.";
    return json({ document: doc, warning: message });
  } catch (e) {
    console.error("[fiscal-status]", e);
    return err(500, "Erro interno ao consultar a nota.", "internal_error");
  }
});
