// Módulo fiscal: lê a venda (comanda do PDV ou pedido) com itens, código de barras e dados fiscais
// dos produtos, e devolve a FiscalSale pronta para montar a nota.
import { err, type Any } from "./fiscal-server.ts";
import { saleFromComanda, saleFromOrder, type FiscalSale, type ProductLookup } from "./focus-nfe.ts";

export interface LoadedSale {
  sale: FiscalSale;
  /** Dados do pedido para sugerir destinatário/presença (só NF-e de pedido). */
  order?: { customer_name: string | null; customer_email: string | null; source: string | null; delivery_type: string | null };
  customerName?: string | null;
}

async function productLookups(admin: Any, ids: string[]): Promise<Record<string, ProductLookup> | Response> {
  if (!ids.length) return {};
  const [prodRes, fiscalRes] = await Promise.all([
    admin.from("products").select("id, barcode").in("id", ids),
    admin.from("product_fiscal").select("product_id, ncm, cfop, cest, icms_origem, icms_situacao, pis_cst, cofins_cst, unidade").in("product_id", ids),
  ]);
  if (prodRes.error || fiscalRes.error) {
    console.error("[fiscal] erro ao ler produtos", prodRes.error || fiscalRes.error);
    return err(500, "Erro ao ler os produtos da venda.", "lookup_failed");
  }
  const map: Record<string, ProductLookup> = {};
  for (const p of prodRes.data ?? []) map[p.id] = { barcode: p.barcode ?? null, fiscal: null };
  for (const f of fiscalRes.data ?? []) map[f.product_id] = { ...(map[f.product_id] ?? {}), fiscal: f };
  return map;
}

const productIds = (items: { product_id: string | null }[]) =>
  [...new Set(items.map((i) => i.product_id).filter((x): x is string => !!x))];

export async function loadComandaSale(admin: Any, storeId: string, comandaId: string, includeServiceFee: boolean): Promise<LoadedSale | Response> {
  const [comandaRes, itemsRes] = await Promise.all([
    admin.from("comandas").select("id, store_id, status, discount, service_fee, total, payment_method, payment_details, customer_name").eq("id", comandaId).maybeSingle(),
    admin.from("comanda_items").select("product_id, product_name, quantity, total_price").eq("comanda_id", comandaId).order("added_at"),
  ]);
  if (comandaRes.error || itemsRes.error) {
    console.error("[fiscal] erro ao ler comanda", comandaRes.error || itemsRes.error);
    return err(500, "Erro ao ler a venda.", "lookup_failed");
  }
  const c = comandaRes.data;
  if (!c || c.store_id !== storeId) return err(404, "Venda não encontrada nesta loja.", "sale_not_found");
  if (c.status !== "closed") return err(409, "Feche a venda/comanda antes de emitir o cupom fiscal.", "sale_not_closed");
  const items = itemsRes.data ?? [];
  const products = await productLookups(admin, productIds(items));
  if (products instanceof Response) return products;
  return { sale: saleFromComanda(c, items, products, includeServiceFee), customerName: c.customer_name };
}

export async function loadOrderSale(admin: Any, storeId: string, orderId: string): Promise<LoadedSale | Response> {
  const [orderRes, itemsRes] = await Promise.all([
    admin.from("orders").select("id, store_id, status, delivery_fee, promotion_discount, total, payment_method, payment_details, customer_name, customer_email, source, delivery_type").eq("id", orderId).maybeSingle(),
    admin.from("order_items").select("product_id, product_name, quantity, subtotal").eq("order_id", orderId).order("created_at"),
  ]);
  if (orderRes.error || itemsRes.error) {
    console.error("[fiscal] erro ao ler pedido", orderRes.error || itemsRes.error);
    return err(500, "Erro ao ler o pedido.", "lookup_failed");
  }
  const o = orderRes.data;
  if (!o || o.store_id !== storeId) return err(404, "Pedido não encontrado nesta loja.", "sale_not_found");
  if (o.status === "cancelado") return err(409, "Pedido cancelado não pode ter nota fiscal.", "order_cancelled");
  const items = itemsRes.data ?? [];
  const products = await productLookups(admin, productIds(items));
  if (products instanceof Response) return products;
  return {
    sale: saleFromOrder(o, items, products),
    order: { customer_name: o.customer_name, customer_email: o.customer_email, source: o.source, delivery_type: o.delivery_type },
  };
}
