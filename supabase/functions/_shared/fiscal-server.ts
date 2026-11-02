// Módulo fiscal: peças de servidor compartilhadas pelas funções fiscal-* (acesso, configuração,
// chamada HTTP à Focus e gravação do documento). As regras puras ficam em focus-nfe.ts.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";
import {
  documentPatch, focusAuthHeader, focusBaseUrl, resolveFocusToken,
  type FiscalEnvironment, type FiscalSettings, type ParsedFocusDocument,
} from "./focus-nfe.ts";

// deno-lint-ignore no-explicit-any
export type Any = any;

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
export const err = (status: number, error: string, code: string, extra: Record<string, unknown> = {}) =>
  json({ error, code, ...extra }, status);

/** Colunas devolvidas ao painel (sem payload enviado/resposta crua). */
export const DOC_COLUMNS =
  "id, store_id, doc_type, environment, comanda_id, order_id, ref, attempt, status, focus_status, status_sefaz, " +
  "mensagem_sefaz, numero, serie, chave, protocolo, danfe_url, xml_url, qrcode_url, contingencia, error_message, " +
  "total, recipient_document, recipient_name, cancel_justificativa, created_at, updated_at, authorized_at, cancelled_at";

/** Sem FOCUS_NFE_TOKEN o módulo está desligado: 503 sem quebrar nada. */
export function fiscalNotConfigured(): Response | null {
  if (Deno.env.get("FOCUS_NFE_TOKEN")?.trim()) return null;
  return err(503, "Módulo fiscal ainda não configurado", "fiscal_not_configured");
}

export const adminClient = (): Any => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

/**
 * Usuário do JWT com acesso à loja, conferido com o token dele:
 * 'operate' = _can_operate_store (dono, admin, atendente, master); 'admin' = is_store_admin_of.
 */
export async function requireStoreUser(req: Request, storeId: string, level: "operate" | "admin"): Promise<{ id: string } | Response> {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return err(401, "Faça login para usar a nota fiscal.", "unauthorized");
  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData } = await userClient.auth.getUser();
  const user = userData?.user;
  if (!user) return err(401, "Sessão expirada. Entre de novo.", "unauthorized");
  const { data: allowed, error } = level === "admin"
    ? await userClient.rpc("is_store_admin_of", { _store_id: storeId })
    : await userClient.rpc("_can_operate_store", { p_store_id: storeId });
  if (error) {
    console.error("[fiscal] erro ao conferir acesso", error);
    return err(500, "Não foi possível conferir seu acesso à loja. Tente novamente.", "access_check_failed");
  }
  if (allowed !== true) {
    return err(403, level === "admin" ? "Só o dono ou administrador da loja pode fazer isso." : "Você não tem acesso a esta loja.", "forbidden");
  }
  return { id: user.id };
}

export interface FiscalStore {
  settings: FiscalSettings & Record<string, Any>;
  token: string | null;
  timeZone: string;
}

/** Configuração fiscal, token da Focus do ambiente (o da loja ou `env`, ex.: nota antiga) e fuso. */
export async function loadFiscalStore(admin: Any, storeId: string, env?: FiscalEnvironment): Promise<FiscalStore | Response> {
  const [settingsRes, secretsRes, storeRes] = await Promise.all([
    admin.from("store_fiscal_settings").select("*").eq("store_id", storeId).maybeSingle(),
    admin.from("store_fiscal_secrets").select("focus_token_homologacao, focus_token_producao").eq("store_id", storeId).maybeSingle(),
    admin.from("stores").select("id, timezone").eq("id", storeId).maybeSingle(),
  ]);
  for (const r of [settingsRes, secretsRes, storeRes]) {
    if (r.error) {
      console.error("[fiscal] erro ao ler configuração", r.error);
      return err(500, "Erro ao ler a configuração fiscal. Tente novamente.", "lookup_failed");
    }
  }
  if (!storeRes.data) return err(404, "Loja não encontrada.", "store_not_found");
  if (!settingsRes.data) {
    return err(409, "Configure a nota fiscal da loja primeiro (menu Configurações › Nota fiscal).", "fiscal_settings_missing");
  }
  const token = resolveFocusToken(env ?? (settingsRes.data.environment as FiscalEnvironment), secretsRes.data, {
    global: Deno.env.get("FOCUS_NFE_TOKEN"),
    homologacao: Deno.env.get("FOCUS_NFE_TOKEN_HOMOLOGACAO"),
  });
  return { settings: settingsRes.data, token, timeZone: storeRes.data.timezone || "America/Sao_Paulo" };
}

export const missingToken = (env: FiscalEnvironment) =>
  err(503, `Token da Focus NFe não configurado para ${env === "producao" ? "produção" : "homologação"}.`, "focus_token_missing");

/** Chamada à API da Focus. status 0 = sem resposta (rede/timeout). */
export async function focusCall(
  env: FiscalEnvironment, token: string, method: "GET" | "POST" | "DELETE", path: string, body?: unknown,
): Promise<{ status: number; body: Record<string, Any> | null }> {
  try {
    const res = await fetch(`${focusBaseUrl(env)}${path}`, {
      method,
      headers: { Authorization: focusAuthHeader(token), "Content-Type": "application/json", Accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(45_000),
    });
    const text = await res.text();
    let parsed: Record<string, Any> | null = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { mensagem: text.slice(0, 500) };
    }
    return { status: res.status, body: parsed };
  } catch (e) {
    console.error("[fiscal] falha ao chamar a Focus", method, path, e);
    return { status: 0, body: null };
  }
}

/** Grava a resposta da Focus no documento (respeitando a ordem dos status) e devolve a linha. */
export async function applyFocusDocument(admin: Any, doc: Any, parsed: ParsedFocusDocument, raw: unknown): Promise<Any> {
  const patch = documentPatch(doc, parsed, raw, new Date());
  if (!patch) return doc;
  const { data, error } = await admin.from("fiscal_documents").update(patch).eq("id", doc.id).select(DOC_COLUMNS).single();
  if (error) {
    console.error("[fiscal] erro ao gravar documento", error);
    return { ...doc, ...patch };
  }
  return data;
}

export async function setDocumentError(admin: Any, docId: string, message: string, raw: unknown): Promise<Any> {
  const { data } = await admin.from("fiscal_documents")
    .update({ status: "erro", error_message: message, response_payload: raw ?? null })
    .eq("id", docId).select(DOC_COLUMNS).single();
  return data;
}

export const isUuid = (v: unknown) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
