// Dados do seletor de produto do "Novo pedido": busca (nome ou código de barras exato),
// produto por id (leitor) com variações e adicionais, e a montagem do item do pedido.
import { supabase } from '@/integrations/supabase/client';
import { nameOrBarcodeFilter } from '@/lib/pdv/barcode';
import { catalogBasePrice, lineSubtotal } from '@/lib/orders/adminOrderRequest';

export interface SelectorVariant {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  product_id?: string;
}

export interface SelectorAddon {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}

export interface SelectorProduct {
  id: string;
  name: string;
  price: number;
  category?: { name: string };
  variants?: SelectorVariant[];
  product_addons?: { addon: SelectorAddon }[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  addons: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}

const PRODUCT_COLUMNS = 'id, name, price, offer_price, is_on_offer';

type ProductRow = { id: string; name: string; price: number; offer_price: number | null; is_on_offer: boolean | null };

/** Junta variações e adicionais (em lote, só dos produtos encontrados). */
async function withVariantsAndAddons(storeId: string, products: ProductRow[]): Promise<SelectorProduct[]> {
  if (products.length === 0) return [];
  const productIds = products.map((p) => p.id);

  const [variantsRes, addonsRes, productAddonsRes] = await Promise.all([
    supabase.from('product_variants').select('*').in('product_id', productIds).eq('is_available', true),
    supabase.from('addons').select('*').eq('store_id', storeId).eq('is_available', true),
    supabase.from('product_addons').select('product_id, addon_id').in('product_id', productIds),
  ]);

  const variantsByProduct = new Map<string, SelectorVariant[]>();
  for (const v of variantsRes.data || []) {
    const list = variantsByProduct.get(v.product_id) || [];
    list.push(v);
    variantsByProduct.set(v.product_id, list);
  }

  const addonsById = new Map<string, SelectorAddon>();
  for (const a of addonsRes.data || []) addonsById.set(a.id, a);

  const addonIdsByProduct = new Map<string, string[]>();
  for (const pa of productAddonsRes.data || []) {
    const list = addonIdsByProduct.get(pa.product_id) || [];
    list.push(pa.addon_id);
    addonIdsByProduct.set(pa.product_id, list);
  }

  return products.map((product) => {
    const productAddons = (addonIdsByProduct.get(product.id) || [])
      .map((addonId) => {
        const addon = addonsById.get(addonId);
        return addon ? { addon } : null;
      })
      .filter(Boolean) as { addon: SelectorAddon }[];

    return {
      id: product.id,
      name: product.name,
      // Mesmo preço que o servidor grava: oferta quando o produto está em oferta
      price: catalogBasePrice(product),
      variants: variantsByProduct.get(product.id) || [],
      product_addons: productAddons,
    };
  });
}

/** Busca por nome (contém) ou código de barras (igual), só produtos disponíveis. */
export async function searchSelectorProducts(storeId: string, term: string, limit = 20): Promise<SelectorProduct[]> {
  const filter = nameOrBarcodeFilter(term);
  let query = supabase.from('products').select(PRODUCT_COLUMNS).eq('store_id', storeId).eq('is_available', true);
  query = filter ? query.or(filter) : query.ilike('name', `%${term}%`);
  const { data, error } = await query.order('name').limit(limit);
  if (error) throw error;
  return withVariantsAndAddons(storeId, (data || []) as ProductRow[]);
}

/** Um produto (lido pelo leitor) com variações e adicionais. */
export async function loadSelectorProduct(storeId: string, productId: string): Promise<SelectorProduct | null> {
  const { data, error } = await supabase.from('products').select(PRODUCT_COLUMNS).eq('id', productId).eq('store_id', storeId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [product] = await withVariantsAndAddons(storeId, [data as ProductRow]);
  return product ?? null;
}

/** Item do pedido a partir do que foi escolhido (o servidor confere o preço pelo catálogo). */
export function buildOrderItem(
  product: SelectorProduct,
  variantId: string | undefined,
  selectedAddons: Record<string, { quantity: number }>,
  quantity: number,
  notes: string,
): OrderItem {
  const variant = product.variants?.find((v) => v.id === variantId);
  const basePrice = variant ? variant.price : product.price;
  const addons = Object.entries(selectedAddons).map(([addonId, { quantity: addonQty }]) => {
    const addonData = product.product_addons?.find((pa) => pa.addon.id === addonId)?.addon;
    return { id: addonId, name: addonData?.name || '', price: addonData?.price || 0, quantity: addonQty };
  });
  return {
    productId: product.id,
    productName: product.name,
    variantId: variant?.id,
    variantName: variant?.name,
    quantity,
    unitPrice: basePrice,
    subtotal: lineSubtotal(basePrice, addons, quantity),
    notes,
    addons,
  };
}
