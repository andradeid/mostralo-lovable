// "Novo pedido" do painel da loja: regras puras (sem dependências) usadas pela função
// admin-create-order e pelo navegador (tela do pedido e testes com node).
// Preço sempre do catálogo: variação escolhida, senão preço de oferta (quando em oferta), senão o preço;
// adicionais pelo preço do cadastro. A conta é a mesma que a tela mostra:
//   subtotal do item = (preço base + Σ adicional × qtd do adicional) × quantidade
// A taxa de entrega é a que o lojista informa na tela (padrão: a da loja).

export type AdminDeliveryType = "delivery" | "pickup";
export type AdminPaymentMethod = "pix" | "card" | "cash";
export type AdminPaymentStatus = "pending" | "paid";
export type AdminOrderSource = "manual" | "whatsapp_chat";

export const ADMIN_ORDER_SOURCES: AdminOrderSource[] = ["manual", "whatsapp_chat"];
export const ADMIN_PAYMENT_METHODS: AdminPaymentMethod[] = ["pix", "card", "cash"];

export interface AdminOrderItemInput {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  notes?: string | null;
  addons?: { id: string; quantity: number }[];
}

export interface AdminOrderRequest {
  store_id: string;
  source: AdminOrderSource;
  customer: { id: string; name: string; phone: string; email?: string | null; address?: string | null };
  delivery_type: AdminDeliveryType;
  delivery_fee: number;
  payment_method: AdminPaymentMethod;
  payment_details: { card_type: "credit" | "debit" } | null;
  payment_status: AdminPaymentStatus;
  notes: string;
  driver_id: string | null;
  items: AdminOrderItemInput[];
}

export interface AdminOrderCreated {
  order_id: string;
  order_number: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
}

export interface CatalogProduct {
  id: string;
  store_id: string;
  name: string;
  price: number | string | null;
  offer_price?: number | string | null;
  is_on_offer?: boolean | null;
  is_available?: boolean | null;
}
export interface CatalogVariant {
  id: string;
  product_id: string;
  name: string;
  price: number | string | null;
  is_available?: boolean | null;
}
export interface CatalogAddon {
  id: string;
  store_id: string;
  name: string;
  price: number | string | null;
  is_available?: boolean | null;
}
export interface Catalog {
  products: CatalogProduct[];
  variants: CatalogVariant[];
  addons: CatalogAddon[];
  /** vínculos produto ↔ adicional (product_addons) */
  productAddons: { product_id: string; addon_id: string }[];
}

export interface PricedAddon {
  addon_id: string;
  addon_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
export interface PricedItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number; // preço base (variação/oferta/preço), sem adicionais — como o painel sempre gravou
  subtotal: number;   // (base + adicionais) × quantidade
  notes: string | null;
  addons: PricedAddon[];
}

export type Fail = { ok: false; status: number; error: string; code: string };
export type PricedOrder = { ok: true; items: PricedItem[]; subtotal: number } | Fail;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);
export const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fail = (status: number, error: string, code: string): Fail => ({ ok: false, status, error, code });

export const MAX_ITEMS = 100;
export const MAX_ITEM_QTY = 999;
export const MAX_ADDON_QTY = 99;
export const MAX_DELIVERY_FEE = 10000;

/** Preço base de catálogo: variação escolhida; sem variação, oferta (se em oferta) ou preço. */
export function catalogBasePrice(
  product: Pick<CatalogProduct, "price" | "offer_price" | "is_on_offer">,
  variant?: Pick<CatalogVariant, "price"> | null,
): number {
  if (variant) return round2(num(variant.price));
  if (product.is_on_offer && num(product.offer_price) > 0) return round2(num(product.offer_price));
  return round2(num(product.price));
}

/** Subtotal do item como a tela mostra: (base + Σ adicional × qtd) × quantidade. */
export function lineSubtotal(unitPrice: number, addons: { price: number; quantity: number }[], quantity: number): number {
  const addonsTotal = addons.reduce((s, a) => s + num(a.price) * num(a.quantity), 0);
  return round2((num(unitPrice) + addonsTotal) * num(quantity));
}

/** Totais do pedido: taxa só no delivery. */
export function adminOrderTotals(subtotal: number, deliveryType: AdminDeliveryType, deliveryFee: number) {
  const fee = deliveryType === "delivery" ? round2(Math.max(0, num(deliveryFee))) : 0;
  const sub = round2(subtotal);
  return { subtotal: sub, delivery_fee: fee, total: round2(sub + fee) };
}

/** Etiquetas de canal do cliente: WhatsApp (pedido vindo do chat) ou Balcão, e Delivery quando entrega. */
export function adminOrderLabels(source: AdminOrderSource, deliveryType: AdminDeliveryType): string[] {
  const labels = [source === "whatsapp_chat" ? "WhatsApp" : "Balcão"];
  if (deliveryType === "delivery") labels.push("Delivery");
  return labels;
}

export const CHANNEL_LABEL_COLORS: Record<string, string> = {
  "Balcão": "#f97316",
  "Delivery": "#ef4444",
  "WhatsApp": "#25d366",
};

const str = (v: unknown, max: number): string | null => {
  if (v === undefined || v === null) return null;
  return String(v).slice(0, max);
};

/**
 * Confere e normaliza o corpo recebido (sem banco). Erros com mensagem em português e code.
 */
// deno-lint-ignore no-explicit-any
export function parseAdminOrderRequest(body: any): { ok: true; req: AdminOrderRequest } | Fail {
  if (!body || typeof body !== "object") return fail(400, "Pedido inválido.", "invalid_body");
  if (!isUuid(body.store_id)) return fail(400, "Loja inválida.", "invalid_store");

  const source: AdminOrderSource = body.source === undefined || body.source === null ? "manual" : body.source;
  if (!ADMIN_ORDER_SOURCES.includes(source)) return fail(400, "Origem do pedido inválida.", "invalid_source");

  const c = body.customer;
  if (!c || !isUuid(c.id)) return fail(400, "Selecione um cliente cadastrado.", "customer_required");
  const customerName = String(c.name ?? "").trim();
  const customerPhone = String(c.phone ?? "").trim();
  if (!customerName || !customerPhone) return fail(400, "Cliente sem nome ou telefone.", "customer_required");

  const deliveryType = body.delivery_type;
  if (deliveryType !== "delivery" && deliveryType !== "pickup") {
    return fail(400, "Tipo de entrega inválido.", "invalid_delivery_type");
  }
  const address = str(c.address, 500);
  if (deliveryType === "delivery" && !(address ?? "").trim()) {
    return fail(400, "Cliente precisa de endereço cadastrado para delivery", "address_required");
  }

  const fee = Number(body.delivery_fee ?? 0);
  if (!Number.isFinite(fee) || fee < 0 || fee > MAX_DELIVERY_FEE) {
    return fail(400, "Taxa de entrega inválida.", "invalid_delivery_fee");
  }

  const method = body.payment_method;
  if (!ADMIN_PAYMENT_METHODS.includes(method)) return fail(400, "Forma de pagamento inválida.", "invalid_payment_method");
  const status = body.payment_status;
  if (status !== "pending" && status !== "paid") return fail(400, "Status do pagamento inválido.", "invalid_payment_status");
  const cardType = body.payment_details?.card_type;
  const paymentDetails = method === "card" && (cardType === "credit" || cardType === "debit") ? { card_type: cardType } : null;

  const driverId = body.driver_id ?? null;
  if (driverId !== null && !isUuid(driverId)) return fail(400, "Entregador inválido.", "invalid_driver");

  const rawItems = body.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return fail(400, "Adicione pelo menos um produto ao pedido", "empty_order");
  }
  if (rawItems.length > MAX_ITEMS) return fail(400, "Pedido com itens demais.", "too_many_items");

  const items: AdminOrderItemInput[] = [];
  for (const it of rawItems) {
    if (!it || !isUuid(it.product_id)) return fail(400, "Item inválido no pedido.", "invalid_item");
    if (it.variant_id !== undefined && it.variant_id !== null && !isUuid(it.variant_id)) {
      return fail(400, "Item inválido no pedido.", "invalid_item");
    }
    const q = Number(it.quantity);
    if (!Number.isInteger(q) || q < 1 || q > MAX_ITEM_QTY) return fail(400, "Quantidade inválida.", "invalid_quantity");
    const addons = new Map<string, number>();
    for (const a of Array.isArray(it.addons) ? it.addons : []) {
      if (!a || !isUuid(a.id)) return fail(400, "Adicional inválido no pedido.", "invalid_item");
      const aq = Number(a.quantity);
      if (!Number.isInteger(aq) || aq < 1 || aq > MAX_ADDON_QTY) return fail(400, "Quantidade de adicional inválida.", "invalid_quantity");
      addons.set(a.id, (addons.get(a.id) ?? 0) + aq);
    }
    if (addons.size > 50) return fail(400, "Item com adicionais demais.", "invalid_item");
    items.push({
      product_id: it.product_id,
      variant_id: it.variant_id ?? null,
      quantity: q,
      notes: str(it.notes, 500),
      addons: [...addons].map(([id, quantity]) => ({ id, quantity })),
    });
  }

  return {
    ok: true,
    req: {
      store_id: body.store_id,
      source,
      customer: {
        id: c.id,
        name: customerName.slice(0, 200),
        phone: customerPhone.slice(0, 40),
        email: str(c.email, 200),
        address,
      },
      delivery_type: deliveryType,
      delivery_fee: round2(fee),
      payment_method: method,
      payment_details: paymentDetails,
      payment_status: status,
      notes: str(body.notes, 2000) ?? "",
      driver_id: deliveryType === "delivery" ? driverId : null,
      items,
    },
  };
}

/** Ids que a função precisa buscar no catálogo. */
export function catalogIds(items: AdminOrderItemInput[]) {
  return {
    productIds: [...new Set(items.map((i) => i.product_id))],
    variantIds: [...new Set(items.map((i) => i.variant_id).filter((v): v is string => !!v))],
    addonIds: [...new Set(items.flatMap((i) => (i.addons ?? []).map((a) => a.id)))],
  };
}

/** Preço de cada item pelo catálogo da loja. */
export function priceAdminOrder(items: AdminOrderItemInput[], storeId: string, catalog: Catalog): PricedOrder {
  const products = new Map(catalog.products.map((p) => [p.id, p]));
  const variants = new Map(catalog.variants.map((v) => [v.id, v]));
  const addons = new Map(catalog.addons.map((a) => [a.id, a]));
  const links = new Set(catalog.productAddons.map((l) => `${l.product_id}:${l.addon_id}`));

  const priced: PricedItem[] = [];
  for (const it of items) {
    const p = products.get(it.product_id);
    if (!p || p.store_id !== storeId || p.is_available === false) {
      return fail(409, "Um produto do pedido não está mais disponível. Remova e adicione de novo.", "product_unavailable");
    }
    let variant: CatalogVariant | null = null;
    if (it.variant_id) {
      variant = variants.get(it.variant_id) ?? null;
      if (!variant || variant.product_id !== p.id || variant.is_available === false) {
        return fail(409, `A opção escolhida de "${p.name}" não está mais disponível.`, "variant_unavailable");
      }
    }
    const lineAddons: PricedAddon[] = [];
    for (const sel of it.addons ?? []) {
      const a = addons.get(sel.id);
      if (!a || a.store_id !== storeId || a.is_available === false || !links.has(`${p.id}:${a.id}`)) {
        return fail(409, `Um adicional de "${p.name}" não está mais disponível.`, "addon_unavailable");
      }
      const unit = round2(num(a.price));
      lineAddons.push({ addon_id: a.id, addon_name: a.name, quantity: sel.quantity, unit_price: unit, subtotal: round2(unit * sel.quantity) });
    }
    const base = catalogBasePrice(p, variant);
    priced.push({
      product_id: p.id,
      // Com variação, o nome leva o tamanho/opção (ex.: "Pizza Calabresa (Grande)")
      product_name: variant?.name ? `${p.name} (${variant.name})` : p.name,
      quantity: it.quantity,
      unit_price: base,
      subtotal: lineSubtotal(base, lineAddons.map((a) => ({ price: a.unit_price, quantity: a.quantity })), it.quantity),
      notes: it.notes ?? null,
      addons: lineAddons,
    });
  }
  return { ok: true, items: priced, subtotal: round2(priced.reduce((s, i) => s + i.subtotal, 0)) };
}
