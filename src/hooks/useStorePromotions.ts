// Cache compartilhado das promoções ativas da loja (com vínculos de
// produtos/categorias). Uma única busca serve todos os cards, detalhe do
// produto, carrinho, checkout, banner e página de promoções.
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { publicSupabase } from '@/integrations/supabase/publicClient';
import type { StorePromotion } from '@/types/promotions';

export const STORE_PROMOTIONS_STALE_TIME = 5 * 60 * 1000;
export const storePromotionsKey = (storeId: string) => ['store-promotions', storeId] as const;

/** Busca promoções ativas + vínculos (3 consultas no total, independente do nº de promoções). */
export async function fetchStorePromotions(storeId: string): Promise<StorePromotion[]> {
  const { data: promotions, error } = await publicSupabase
    .from('promotions')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .order('display_order');
  if (error) throw error;
  if (!promotions || promotions.length === 0) return [];

  const ids = promotions.map((p) => p.id);
  const [prodRes, catRes] = await Promise.all([
    publicSupabase.from('promotion_products').select('promotion_id, product_id').in('promotion_id', ids),
    publicSupabase.from('promotion_categories').select('promotion_id, category_id').in('promotion_id', ids),
  ]);
  if (prodRes.error) throw prodRes.error;
  if (catRes.error) throw catRes.error;

  return promotions.map((p) => ({
    ...p,
    product_ids: (prodRes.data ?? []).filter((r) => r.promotion_id === p.id).map((r) => r.product_id),
    category_ids: (catRes.data ?? []).filter((r) => r.promotion_id === p.id).map((r) => r.category_id),
  }));
}

export const storePromotionsQueryOptions = (storeId: string) => ({
  queryKey: storePromotionsKey(storeId),
  queryFn: () => fetchStorePromotions(storeId),
  staleTime: STORE_PROMOTIONS_STALE_TIME,
  refetchOnWindowFocus: false,
});

/** Lê do cache (ou busca uma vez) fora de componentes. */
export const getStorePromotions = (qc: QueryClient, storeId: string) =>
  qc.fetchQuery(storePromotionsQueryOptions(storeId));

/** Promoção dentro do período de validade agora (start/end). */
export function isPromotionInPeriod(p: StorePromotion, now = new Date()): boolean {
  if (new Date(p.start_date) > now) return false;
  if (p.end_date && new Date(p.end_date) < now) return false;
  return true;
}

export function useStorePromotions(storeId?: string) {
  return useQuery({
    ...storePromotionsQueryOptions(storeId ?? ''),
    enabled: !!storeId,
  });
}
