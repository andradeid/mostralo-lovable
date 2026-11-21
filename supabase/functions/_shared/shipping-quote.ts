// Cotação no servidor: lê a configuração e o token da loja, monta os itens pelo catálogo e chama o Melhor Envio.
// Usado por shipping-quote (vitrine, checkout, teste do painel) e create-guest-order-v3 (confere o frete).
import {
  buildQuoteBody, ME_BASE_URL, ME_USER_AGENT, normalizeCep, parseQuoteResponse,
  type ShippingItem, type ShippingOption, type ShippingSettings,
} from "./shipping.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface QuoteLine { product_id: string; variant_id?: string | null; quantity: number }
export type QuoteResult =
  | { ok: true; options: ShippingOption[]; settings: ShippingSettings; subtotal: number }
  | { ok: false; status: number; code: string; error: string };

const fail = (status: number, code: string, error: string): QuoteResult => ({ ok: false, status, code, error });
const SETTINGS_COLUMNS =
  "enabled, environment, origin_postal_code, services, default_weight_kg, default_height_cm, default_width_cm, default_length_cm, handling_days, free_shipping_min";

export async function quoteForStore(
  admin: Any,
  storeId: string,
  postalCode: unknown,
  lines: QuoteLine[],
  opts: { allowDisabled?: boolean } = {},
): Promise<QuoteResult> {
  const cep = normalizeCep(postalCode);
  if (!cep) return fail(400, "invalid_postal_code", "CEP inválido.");

  const [{ data: settings, error: sErr }, { data: secret, error: tErr }] = await Promise.all([
    admin.from("store_shipping_settings").select(SETTINGS_COLUMNS).eq("store_id", storeId).maybeSingle(),
    admin.from("store_shipping_secrets").select("melhor_envio_token").eq("store_id", storeId).maybeSingle(),
  ]);
  if (sErr || tErr) {
    console.error("[shipping] erro ao ler configuração", sErr ?? tErr);
    return fail(500, "settings_failed", "Não foi possível calcular o frete agora.");
  }
  if (!settings || (!settings.enabled && !opts.allowDisabled)) return fail(409, "shipping_disabled", "Esta loja não faz envio por transportadora.");
  if (!settings.origin_postal_code) return fail(409, "missing_origin", "A loja ainda não informou o CEP de origem.");
  if (!secret?.melhor_envio_token) return fail(409, "missing_token", "A loja ainda não ligou a conta do Melhor Envio.");

  let items: ShippingItem[];
  let subtotal = 0;
  if (lines.length) {
    const productIds = [...new Set(lines.map((l) => l.product_id))];
    const variantIds = [...new Set(lines.map((l) => l.variant_id).filter((v): v is string => !!v))];
    const [{ data: products, error: pErr }, { data: variants, error: vErr }] = await Promise.all([
      admin.from("products")
        .select("id, store_id, price, offer_price, is_on_offer, shipping_weight_kg, shipping_height_cm, shipping_width_cm, shipping_length_cm")
        .in("id", productIds),
      variantIds.length
        ? admin.from("product_variants").select("id, product_id, price").in("id", variantIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (pErr || vErr) {
      console.error("[shipping] erro ao ler produtos", pErr ?? vErr);
      return fail(500, "lookup_failed", "Não foi possível calcular o frete agora.");
    }
    const pmap = new Map((products ?? []).map((p: Any) => [p.id, p]));
    const vmap = new Map((variants ?? []).map((v: Any) => [v.id, v]));
    items = [];
    for (const l of lines) {
      const p: Any = pmap.get(l.product_id);
      if (!p || p.store_id !== storeId) return fail(409, "product_unavailable", "Um produto do carrinho não está mais disponível.");
      const v: Any = l.variant_id ? vmap.get(l.variant_id) : null;
      const unit = v && v.product_id === p.id
        ? Number(v.price)
        : p.is_on_offer && Number(p.offer_price) > 0 ? Number(p.offer_price) : Number(p.price);
      const qty = Math.max(1, Math.min(999, Math.floor(Number(l.quantity) || 1)));
      subtotal += unit * qty;
      items.push({
        product_id: p.id, quantity: qty, unit_price: unit,
        weight_kg: p.shipping_weight_kg, height_cm: p.shipping_height_cm, width_cm: p.shipping_width_cm, length_cm: p.shipping_length_cm,
      });
    }
  } else {
    // Teste do painel: uma embalagem padrão com valor segurado de R$ 100
    items = [{ product_id: "teste", quantity: 1, unit_price: 100 }];
    subtotal = 100;
  }

  const env = settings.environment === "production" ? "production" : "sandbox";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`${ME_BASE_URL[env]}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret.melhor_envio_token}`,
        "User-Agent": ME_USER_AGENT,
      },
      body: JSON.stringify(buildQuoteBody(settings as ShippingSettings, cep, items)),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (res.status === 401 || res.status === 403) {
      console.error("[shipping] token recusado", res.status, text.slice(0, 300));
      return fail(502, "token_rejected", "O Melhor Envio recusou o token da loja. Gere um token novo no painel.");
    }
    if (!res.ok) {
      console.error("[shipping] erro do Melhor Envio", res.status, text.slice(0, 500));
      return fail(502, "carrier_error", "Não foi possível calcular o frete agora. Tente de novo em instantes.");
    }
    let json: unknown = null;
    try { json = JSON.parse(text); } catch { /* resposta inválida */ }
    const options = parseQuoteResponse(json, settings as ShippingSettings, subtotal);
    if (!options.length) return fail(422, "no_options", "Nenhuma transportadora atende este CEP.");
    return { ok: true, options, settings: settings as ShippingSettings, subtotal: Math.round(subtotal * 100) / 100 };
  } catch (e) {
    console.error("[shipping] falha na cotação", e);
    return fail(504, "carrier_timeout", "O cálculo do frete demorou demais. Tente de novo.");
  } finally {
    clearTimeout(timer);
  }
}
