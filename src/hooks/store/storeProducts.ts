// Produtos da vitrine: colunas lidas e o acréscimo de variações e da marca "tem adicionais".
// Mesmas 3 consultas que a página fazia em cada carregamento (inicial, busca, categoria e "carregar mais").
import { publicSupabase } from '@/integrations/supabase/publicClient';

/** Colunas de produto lidas pela vitrine. */
export const STORE_PRODUCT_COLUMNS =
  'id, name, description, price, image_url, image_gallery, category_id, display_order, button_text, slug, is_on_offer, original_price, offer_price, is_featured';

/**
 * Busca variações disponíveis e adicionais (do produto ou da categoria) e devolve os produtos com
 * `variants`, `hasAddons` e, quando há variação, o preço da variação padrão (ou da primeira).
 */
export async function withVariantsAndAddons<T extends { id: string; category_id?: string | null }>(rows: T[]) {
  const productIds = rows.map(p => p.id);
  const categoryIds = [...new Set(rows.map(p => p.category_id).filter(Boolean))];

  const [variantsRes, pAddonsRes, cAddonsRes] = await Promise.all([
    publicSupabase.from('product_variants').select('*').in('product_id', productIds).eq('is_available', true).order('display_order'),
    publicSupabase.from('product_addons').select('product_id').in('product_id', productIds),
    categoryIds.length > 0
      ? publicSupabase.from('category_addon_categories').select('category_id').in('category_id', categoryIds)
      : Promise.resolve({ data: [] })
  ]);

  const pAddonSet = new Set((pAddonsRes.data || []).map((r: any) => r.product_id));
  const cAddonSet = new Set((cAddonsRes.data || []).map((r: any) => r.category_id));

  return rows.map((product) => {
    const productVariants = variantsRes.data?.filter(v => v.product_id === product.id) || [];
    const hasAddons = pAddonSet.has(product.id) || (product.category_id && cAddonSet.has(product.category_id));
    if (productVariants.length > 0) {
      const defaultVariant = productVariants.find((v: any) => v.is_default) || productVariants[0];
      return { ...product, price: Number(defaultVariant.price), variants: productVariants, hasAddons: !!hasAddons };
    }
    return { ...product, variants: [], hasAddons: !!hasAddons };
  });
}
