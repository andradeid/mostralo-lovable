// Consultas do estoque (produtos, custos e entradas). barcode, product_costs e stock_entries
// não estão nos tipos gerados do Supabase, por isso o `(supabase as any)` com tipos locais.
import { supabase } from '@/integrations/supabase/client';
import { nameOrBarcodeFilter, normalizeBarcode } from '@/lib/pdv/barcode';

export interface StockProduct {
  id: string;
  name: string;
  barcode: string | null;
  price: number;
  is_on_offer: boolean | null;
  offer_price: number | null;
  image_url: string | null;
  track_stock: boolean | null;
  stock_quantity: number | null;
  stock_alert_threshold: number | null;
  is_available: boolean;
}

export interface StockEntryRow {
  id: string;
  created_at: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  supplier: string | null;
  invoice_number: string | null;
  notes: string | null;
  stock_before: number | null;
  stock_after: number | null;
  products?: { name: string } | null;
}

export const STOCK_PRODUCT_COLUMNS =
  'id, name, barcode, price, is_on_offer, offer_price, image_url, track_stock, stock_quantity, stock_alert_threshold, is_available';

const db = () => supabase as any;

/** Busca para escolher produto: nome (contém) ou código de barras (igual). */
export async function searchStockProducts(storeId: string, term: string, limit = 8): Promise<StockProduct[]> {
  const t = term.trim();
  let query = db().from('products').select(STOCK_PRODUCT_COLUMNS).eq('store_id', storeId);
  if (t) {
    const filter = nameOrBarcodeFilter(t);
    query = filter ? query.or(filter) : query.ilike('name', `%${t}%`);
  }
  const { data, error } = await query.order('name').limit(limit);
  if (error) throw error;
  return (data ?? []) as StockProduct[];
}

/** Produto da loja com este código exato (ou null). */
export async function findStockProductByBarcode(storeId: string, code: string): Promise<StockProduct | null> {
  const c = normalizeBarcode(code);
  if (!c) return null;
  const { data, error } = await db()
    .from('products')
    .select(STOCK_PRODUCT_COLUMNS)
    .eq('store_id', storeId)
    .eq('barcode', c)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as StockProduct | null;
}

/** Custo de um produto (equipe da loja). */
export async function fetchProductCost(productId: string): Promise<number | null> {
  const { data, error } = await db().from('product_costs').select('cost_price').eq('product_id', productId).maybeSingle();
  if (error) throw error;
  return data ? Number(data.cost_price) : null;
}

/** Produtos com estoque controlado da loja. */
export async function fetchTrackedProducts(storeId: string): Promise<StockProduct[]> {
  const { data, error } = await db()
    .from('products')
    .select(STOCK_PRODUCT_COLUMNS)
    .eq('store_id', storeId)
    .eq('track_stock', true)
    .order('name')
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as StockProduct[];
}

/** Custos da loja: product_id → custo. */
export async function fetchStoreCosts(storeId: string): Promise<Record<string, number>> {
  const { data, error } = await db().from('product_costs').select('product_id, cost_price').eq('store_id', storeId);
  if (error) throw error;
  const map: Record<string, number> = {};
  for (const row of (data ?? []) as { product_id: string; cost_price: number | string }[]) {
    map[row.product_id] = Number(row.cost_price);
  }
  return map;
}

/** Últimas entradas de mercadoria da loja. */
export async function fetchStockEntries(storeId: string, limit = 200): Promise<StockEntryRow[]> {
  const { data, error } = await db()
    .from('stock_entries')
    .select('id, created_at, product_id, quantity, unit_cost, supplier, invoice_number, notes, stock_before, stock_after, products(name)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as StockEntryRow[];
}

/** Registra a entrada (função do banco: soma no estoque, liga o controle e atualiza o custo). */
export async function addStockEntry(args: Record<string, unknown>): Promise<StockEntryRow> {
  const { data, error } = await db().rpc('stock_add_entry', args);
  if (error) throw error;
  return data as StockEntryRow;
}
