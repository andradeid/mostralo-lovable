// Frete por CEP (Melhor Envio): regras puras, sem dependências.
// Usadas pela função shipping-quote, pelo create-guest-order-v3 (refaz a cotação) e pelos testes com node.
// - Produto sem peso/medidas usa a embalagem padrão da loja.
// - Preço e prazo: custom_price / custom_delivery_time (já com descontos e taxas da conta do lojista).
// - Prazo mostrado ao cliente = prazo da transportadora + dias para postar.
// - Frete grátis acima de um valor: só a opção mais barata fica grátis.

export type ShippingEnvironment = "sandbox" | "production";

export const ME_BASE_URL: Record<ShippingEnvironment, string> = {
  sandbox: "https://sandbox.melhorenvio.com.br",
  production: "https://www.melhorenvio.com.br",
};
export const ME_USER_AGENT = "Mostralo (suporte@mostralo.com.br)";

/** Serviços oferecidos na tela (id do Melhor Envio). */
export const SHIPPING_SERVICES: { id: string; label: string }[] = [
  { id: "1", label: "Correios PAC" },
  { id: "2", label: "Correios SEDEX" },
  { id: "17", label: "Correios Mini Envios" },
  { id: "3", label: "Jadlog .Package" },
  { id: "4", label: "Jadlog .Com" },
];

export interface ShippingSettings {
  enabled: boolean;
  environment: ShippingEnvironment;
  origin_postal_code: string | null;
  services: string[];
  default_weight_kg: number | string;
  default_height_cm: number | string;
  default_width_cm: number | string;
  default_length_cm: number | string;
  handling_days: number;
  free_shipping_min: number | string | null;
}

export interface ShippingItem {
  product_id: string;
  quantity: number;
  /** Preço unitário (valor segurado). */
  unit_price: number;
  weight_kg?: number | string | null;
  height_cm?: number | string | null;
  width_cm?: number | string | null;
  length_cm?: number | string | null;
}

export interface ShippingOption {
  service_id: string;
  name: string;
  company: string;
  /** Preço cobrado do cliente (0 quando grátis). */
  price: number;
  /** Preço da transportadora (antes do grátis). */
  carrier_price: number;
  delivery_days: number | null;
  free: boolean;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const pos = (v: unknown, fallback: number) => (num(v) > 0 ? num(v) : fallback);

/** CEP só com dígitos (8) ou null. */
export function normalizeCep(v: unknown): string | null {
  const d = String(v ?? "").replace(/\D/g, "");
  return d.length === 8 && !/^0{8}$/.test(d) ? d : null;
}

export function formatCep(cep: string): string {
  return cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

/** Corpo da cotação por produtos. */
export function buildQuoteBody(settings: ShippingSettings, toCep: string, items: ShippingItem[]) {
  return {
    from: { postal_code: settings.origin_postal_code },
    to: { postal_code: toCep },
    products: items.map((it) => ({
      id: it.product_id,
      width: pos(it.width_cm, num(settings.default_width_cm)),
      height: pos(it.height_cm, num(settings.default_height_cm)),
      length: pos(it.length_cm, num(settings.default_length_cm)),
      weight: pos(it.weight_kg, num(settings.default_weight_kg)),
      insurance_value: round2(num(it.unit_price)),
      quantity: Math.max(1, Math.floor(num(it.quantity))),
    })),
    options: { receipt: false, own_hand: false },
    ...(settings.services?.length ? { services: settings.services.join(",") } : {}),
  };
}

/**
 * Opções a partir da resposta do Melhor Envio (lista de serviços).
 * Ignora serviços com erro, sem preço ou fora da lista da loja. Ordena do mais barato.
 */
export function parseQuoteResponse(
  raw: unknown,
  settings: Pick<ShippingSettings, "services" | "handling_days" | "free_shipping_min">,
  subtotal: number,
): ShippingOption[] {
  const list = Array.isArray(raw) ? raw : [];
  const allowed = new Set((settings.services ?? []).map(String));
  const opts: ShippingOption[] = [];
  for (const s of list) {
    if (!s || typeof s !== "object" || s.error) continue;
    const id = String(s.id ?? "");
    if (!id || (allowed.size && !allowed.has(id))) continue;
    const price = round2(num(s.custom_price ?? s.price));
    if (!(price > 0)) continue;
    const days = num(s.custom_delivery_time ?? s.delivery_time);
    opts.push({
      service_id: id,
      name: String(s.name ?? "Envio"),
      company: String(s.company?.name ?? ""),
      price,
      carrier_price: price,
      delivery_days: days > 0 ? days + Math.max(0, Math.floor(num(settings.handling_days))) : null,
      free: false,
    });
  }
  opts.sort((a, b) => a.price - b.price || (a.delivery_days ?? 99) - (b.delivery_days ?? 99));
  const min = num(settings.free_shipping_min);
  if (min > 0 && round2(subtotal) + 0.001 >= min && opts.length) {
    opts[0] = { ...opts[0], price: 0, free: true };
  }
  return opts;
}

/** Rótulo curto: "Correios PAC" / "Jadlog .Package". */
export function optionLabel(o: Pick<ShippingOption, "name" | "company">): string {
  if (!o.company) return o.name;
  return o.name.toLowerCase().startsWith(o.company.toLowerCase()) ? o.name : `${o.company} ${o.name}`;
}

/** Endereço de entrega do envio (vai no pedido). */
export interface ShippingAddress {
  postal_code: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
}

export function parseShippingAddress(v: unknown): ShippingAddress | null {
  if (!v || typeof v !== "object") return null;
  const a = v as Record<string, unknown>;
  const s = (k: string, max = 120) => String(a[k] ?? "").trim().slice(0, max);
  const cep = normalizeCep(a.postal_code);
  const out: ShippingAddress = {
    postal_code: cep ?? "",
    street: s("street", 200),
    number: s("number", 20),
    complement: s("complement", 120) || null,
    district: s("district"),
    city: s("city"),
    state: s("state", 2).toUpperCase(),
  };
  if (!cep || !out.street || !out.number || !out.city || !/^[A-Z]{2}$/.test(out.state)) return null;
  return out;
}

export function addressLine(a: ShippingAddress): string {
  const comp = a.complement ? `, ${a.complement}` : "";
  const district = a.district ? ` · ${a.district}` : "";
  return `${a.street}, ${a.number}${comp}${district} · ${a.city} - ${a.state} · ${formatCep(a.postal_code)}`;
}
