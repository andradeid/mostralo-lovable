// Montagem dos registros do formulário de produto (criar e editar usam a mesma).
// Funções puras: o ProductForm só grava o que sai daqui.
import type * as z from 'zod';
import type { productSchema } from '../components/admin/product-form/schema';

export type ProductFormData = z.infer<typeof productSchema>;

export interface ProductVariant {
  id?: string;
  name: string;
  price: number;
  is_default: boolean;
}

/** Registro de `products` gravado no insert (criar) e no update (editar). */
export function buildProductPayload(data: ProductFormData, storeId: string) {
  return {
    name: data.name,
    description: data.description || null,
    price: data.price,
    category_id: data.category_id,
    is_available: data.is_available,
    is_featured: data.is_featured || false,
    display_order: data.display_order,
    image_url: data.image_url || null,
    button_text: data.button_text || 'Comprar',
    image_gallery: data.image_gallery || [],
    store_id: storeId,
    is_on_offer: data.is_on_offer || false,
    original_price: data.is_on_offer ? data.price : null,
    offer_price: data.is_on_offer ? data.offer_price : null,
    track_stock: data.track_stock || false,
    stock_quantity: data.track_stock ? data.stock_quantity : null,
    stock_alert_threshold: data.track_stock ? (data.stock_alert_threshold ?? 5) : 5
  };
}

/** Linhas de `product_variants` (a ordem da tela vira display_order). */
export function buildVariantRows(variants: ProductVariant[], productId: string) {
  return variants.map((variant, index) => ({
    product_id: productId,
    name: variant.name,
    price: variant.price,
    is_default: variant.is_default,
    display_order: index,
    is_available: true
  }));
}

/** Linhas de `product_addons`: todos os adicionais das categorias escolhidas. */
export function buildProductAddonRows(addons: { id: string }[], productId: string) {
  return addons.map(addon => ({
    product_id: productId,
    addon_id: addon.id,
    is_required: false,
    max_quantity: 1
  }));
}

/** Valores do formulário a partir do produto salvo (tela de editar). */
// deno-lint-ignore no-explicit-any
export function productFormValuesFromRow(data: any): ProductFormData {
  const desc = data.description || '';
  return {
    name: data.name,
    description: desc,
    price: Number(data.price),
    category_id: data.category_id || '',
    is_available: data.is_available,
    is_featured: data.is_featured || false,
    display_order: data.display_order,
    image_url: data.image_url || '',
    button_text: data.button_text || 'Comprar',
    image_gallery: data.image_gallery || [],
    is_on_offer: data.is_on_offer || false,
    original_price: Number(data.original_price) || 0,
    offer_price: Number(data.offer_price) || 0,
    track_stock: data.track_stock || false,
    stock_quantity: data.stock_quantity ?? null,
    stock_alert_threshold: data.stock_alert_threshold ?? 5
  };
}

/** Descrição com HTML abre no editor com formatação. */
export function descriptionHasHtml(description: string): boolean {
  return /<[a-z][\s\S]*>/i.test(description);
}

/** Variações salvas → estado da tela. */
// deno-lint-ignore no-explicit-any
export function variantsFromRows(rows: any[]): ProductVariant[] {
  return rows.map(variant => ({
    id: variant.id,
    name: variant.name,
    price: Number(variant.price),
    is_default: variant.is_default
  }));
}

/** Categorias de adicionais marcadas a partir dos adicionais já ligados ao produto. */
export function addonCategoryIdsOf(addons: { category_id: string | null }[]): string[] {
  return [...new Set(addons.map(a => a.category_id).filter(id => id))] as string[];
}
