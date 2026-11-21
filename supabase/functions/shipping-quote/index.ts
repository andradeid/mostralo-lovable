// Cotação de frete por CEP (Melhor Envio) para a vitrine, o checkout e o teste do painel.
// Recebe: { store_id, postal_code, items: [{ product_id, variant_id?, quantity }] }
//   ou   { store_id, postal_code, test: true } (painel; exige admin da loja e funciona com o envio desligado).
// Devolve: { options: [{ service_id, name, company, price, carrier_price, delivery_days, free }] }
// Erros: { error, code } — o token da loja nunca sai do servidor.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { quoteForStore, type QuoteLine } from "../_shared/shipping-quote.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const err = (status: number, error: string, code: string) => json({ error, code }, status);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return err(405, "Método não permitido.", "method_not_allowed");
  try {
    const body = await req.json().catch(() => null);
    if (!body || !UUID_RE.test(String(body.store_id ?? ""))) return err(400, "Loja inválida.", "invalid_store");
    const storeId = String(body.store_id);
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let lines: QuoteLine[] = [];
    let allowDisabled = false;
    if (body.test === true) {
      const auth = req.headers.get("Authorization") || "";
      const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: auth } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: isAdmin } = await userClient.rpc("is_store_admin_of", { _store_id: storeId });
      if (isAdmin !== true) return err(403, "Só o administrador da loja pode testar a cotação.", "forbidden");
      allowDisabled = true;
    } else {
      const raw = Array.isArray(body.items) ? body.items : [];
      if (!raw.length || raw.length > 60) return err(400, "Carrinho vazio ou grande demais para cotar.", "invalid_items");
      for (const it of raw) {
        if (!it || !UUID_RE.test(String(it.product_id ?? ""))) return err(400, "Item inválido.", "invalid_items");
        if (it.variant_id && !UUID_RE.test(String(it.variant_id))) return err(400, "Item inválido.", "invalid_items");
        lines.push({ product_id: it.product_id, variant_id: it.variant_id ?? null, quantity: Number(it.quantity) || 1 });
      }
    }

    const r = await quoteForStore(admin, storeId, body.postal_code, lines, { allowDisabled });
    if (!r.ok) return err(r.status, r.error, r.code);
    return json({ options: r.options });
  } catch (e) {
    console.error("[shipping-quote]", e);
    return err(500, "Erro ao calcular o frete.", "internal_error");
  }
});
