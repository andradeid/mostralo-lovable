// verify-domain — cadastra/verifica/remove o domínio do lojista no Cloudflare for SaaS.
// O token do Cloudflare NUNCA é retornado nem logado.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const CF_API = "https://api.cloudflare.com/client/v4";
const MOSTRALO_DOMAINS = ["mostralo.com.br", "mostralo.app", "mostralo.me", "lovable.app", "pages.dev"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** minúsculo, sem protocolo/caminho/porta; domínio raiz ganha "www." */
function normalizeDomain(raw: string): string {
  let d = raw.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].split("?")[0].split(":")[0];
  d = d.replace(/\.$/, "");
  const parts = d.split(".");
  // raiz: ex.com | ex.com.br (2º nível curto)
  const isRoot = parts.length === 2 || (parts.length === 3 && parts[1].length <= 3 && parts[2].length === 2);
  if (!d.startsWith("www.") && isRoot) d = `www.${d}`;
  return d;
}

interface CfHostname {
  id: string;
  hostname: string;
  status: string;
  ssl?: { status?: string };
}

async function cf(path: string, init: RequestInit = {}) {
  const token = Deno.env.get("CLOUDFLARE_API_TOKEN");
  const zone = Deno.env.get("CLOUDFLARE_ZONE_ID");
  if (!token || !zone) throw new Error("Integração com Cloudflare não configurada");
  const res = await fetch(`${CF_API}/zones/${zone}/custom_hostnames${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const msg = body?.errors?.[0]?.message ?? `HTTP ${res.status}`;
    console.error("Cloudflare error:", res.status, msg);
    throw new Error(`Cloudflare: ${msg}`);
  }
  return body;
}

async function findHostname(hostname: string): Promise<CfHostname | null> {
  const r = await cf(`?hostname=${encodeURIComponent(hostname)}`);
  return (r.result as CfHostname[])?.find((h) => h.hostname === hostname) ?? null;
}

function friendly(status: string, ssl: string): string {
  if (status === "active" && ssl === "active") return "Domínio ativo! Sua loja já abre nele.";
  if (status === "active") return "Gerando certificado SSL. Isso costuma levar alguns minutos.";
  if (status === "blocked" || status === "moved" || status === "deleted")
    return "O domínio foi bloqueado ou removido. Remova e cadastre novamente.";
  return "Aguardando o CNAME www → lojas.mostralo.com.br propagar.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Faça login novamente" }, 401);

    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.slice(7));
    const userId = claims?.claims?.sub;
    if (claimsErr || !userId) return json({ error: "Sessão inválida. Faça login novamente" }, 401);

    const body = await req.json().catch(() => ({}));
    const storeId = typeof body.storeId === "string" ? body.storeId : "";
    const action = body.action === "remove" ? "remove" : "verify";
    if (!/^[0-9a-f-]{36}$/i.test(storeId)) return json({ error: "Loja inválida" }, 400);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Permissão: dono da loja, admin da loja ou master admin
    const { data: store } = await admin.from("stores").select("id, owner_id, custom_domain").eq("id", storeId).maybeSingle();
    if (!store) return json({ error: "Loja não encontrada" }, 404);
    let allowed = store.owner_id === userId;
    if (!allowed) {
      const { data: isAdm } = await userClient.rpc("is_store_admin_of", { _store_id: storeId });
      allowed = isAdm === true;
    }
    if (!allowed) {
      const { data: role } = await admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "master_admin").maybeSingle();
      allowed = !!role;
    }
    if (!allowed) return json({ error: "Sem permissão para esta loja" }, 403);

    // ---------- remover ----------
    if (action === "remove") {
      if (store.custom_domain) {
        const h = await findHostname(store.custom_domain);
        if (h) await cf(`/${h.id}`, { method: "DELETE" });
      }
      await admin.from("stores").update({
        custom_domain: null, custom_domain_verified: false, custom_domain_requested_at: null,
      }).eq("id", storeId);
      return json({ removed: true, message: "Domínio removido" });
    }

    // ---------- verificar/cadastrar ----------
    if (typeof body.domain !== "string" || !body.domain.trim()) return json({ error: "Informe o domínio" }, 400);
    const domain = normalizeDomain(body.domain);
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain) || domain.length > 253)
      return json({ error: "Formato de domínio inválido" }, 400);
    if (MOSTRALO_DOMAINS.some((m) => domain === m || domain.endsWith(`.${m}`)))
      return json({ error: "Use um domínio próprio, não um endereço do Mostralo" }, 400);

    const { data: other } = await admin.from("stores").select("id").eq("custom_domain", domain).neq("id", storeId).limit(1);
    if (other && other.length) return json({ error: "Este domínio já está em uso por outra loja" }, 409);

    // Trocou de domínio? remove o antigo do Cloudflare
    if (store.custom_domain && store.custom_domain !== domain) {
      const old = await findHostname(store.custom_domain).catch(() => null);
      if (old) await cf(`/${old.id}`, { method: "DELETE" }).catch(() => null);
    }

    let host = await findHostname(domain);
    if (!host) {
      const created = await cf("", { method: "POST", body: JSON.stringify({ hostname: domain, ssl: { method: "http", type: "dv" } }) });
      host = created.result as CfHostname;
    }

    const hostnameStatus = host.status ?? "pending";
    const sslStatus = host.ssl?.status ?? "pending";
    const verified = hostnameStatus === "active" && sslStatus === "active";

    const { error: updErr } = await admin.from("stores").update({
      custom_domain: domain,
      custom_domain_verified: verified,
      custom_domain_requested_at: new Date().toISOString(),
    }).eq("id", storeId);
    if (updErr) throw new Error("Não foi possível salvar o domínio na loja");

    return json({ verified, domain, hostnameStatus, sslStatus, message: friendly(hostnameStatus, sslStatus) });
  } catch (e) {
    console.error("verify-domain:", (e as Error).message);
    return json({ verified: false, error: (e as Error).message || "Erro ao verificar domínio" }, 500);
  }
});
