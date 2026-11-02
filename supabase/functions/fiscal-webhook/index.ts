// Gatilho (webhook) da Focus NFe: eventos nfe e nfce. verify_jwt = false.
// Origem validada por FOCUS_WEBHOOK_SECRET, aceito em qualquer um destes:
//   - header configurado no cadastro do gatilho (authorization_header = "X-Webhook-Secret",
//     authorization = <segredo>), ou header Authorization com o segredo;
//   - query ?secret=<segredo> na URL cadastrada.
// O corpo tem os mesmos dados da consulta GET da nota. Respondemos 200 rápido; nota desconhecida é ignorada.
// CONFERIR NA FOCUS: o corpo traz "ref"? (a pesquisa diz "mesmos dados da consulta"; sem ref, tentamos pela chave).
import { corsHeaders } from "../_shared/cors.ts";
import { adminClient, applyFocusDocument, DOC_COLUMNS, err, json } from "../_shared/fiscal-server.ts";
import { parseFocusDocument, secretMatches, type FiscalDocType, type FiscalEnvironment } from "../_shared/focus-nfe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return err(405, "Método não permitido.", "method_not_allowed");
  const secret = Deno.env.get("FOCUS_WEBHOOK_SECRET")?.trim();
  if (!secret) return err(503, "Módulo fiscal ainda não configurado", "fiscal_not_configured");

  const url = new URL(req.url);
  const auth = (req.headers.get("authorization") || "").replace(/^(Bearer|Basic)\s+/i, "");
  const provided = [req.headers.get("x-webhook-secret"), auth, url.searchParams.get("secret")];
  if (!provided.some((p) => secretMatches(p, secret))) return err(401, "Não autorizado.", "unauthorized");

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ ok: true, ignored: "empty" });
    const admin = adminClient();

    const ref = typeof body.ref === "string" ? body.ref : null;
    const chave = typeof body.chave_nfe === "string" ? body.chave_nfe.replace(/^NFe/, "") : null;
    let query = admin.from("fiscal_documents").select(DOC_COLUMNS);
    if (ref) query = query.eq("ref", ref);
    else if (chave) query = query.eq("chave", chave);
    else return json({ ok: true, ignored: "no_ref" });
    const { data: doc, error } = await query.maybeSingle();
    if (error) {
      console.error("[fiscal-webhook] erro ao achar nota", error);
      return err(500, "Erro ao ler a nota.", "lookup_failed"); // a Focus tenta de novo
    }
    if (!doc) return json({ ok: true, ignored: "unknown_ref" });

    const parsed = parseFocusDocument(body, doc.doc_type as FiscalDocType, doc.environment as FiscalEnvironment);
    const updated = await applyFocusDocument(admin, doc, parsed, body);
    console.info("[fiscal-webhook]", JSON.stringify({ ref: doc.ref, from: doc.status, to: updated.status }));
    return json({ ok: true });
  } catch (e) {
    console.error("[fiscal-webhook]", e);
    return err(500, "Erro interno.", "internal_error");
  }
});
