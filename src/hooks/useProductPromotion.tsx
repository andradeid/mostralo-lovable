import { useMemo } from 'react';
import {
  calculateProductPrice,
  DEFAULT_STORE_TIMEZONE,
} from '@/utils/promotionCalculator';
import type { Promotion } from '@/types/promotions';
import { useStorePromotions } from '@/hooks/useStorePromotions';
import { evaluatePromotion, isPricedInPromotion, itemIsEligible, promotionActiveAt, type CorePromotion } from '../../supabase/functions/_shared/promotion-core';

interface Product {
  id: string;
  name: string;
  price: number;
  category_id?: string;
  is_on_offer?: boolean;
  offer_price?: number;
}

interface UseProductPromotionProps {
  product: Product | null;
  storeId: string;
  quantity?: number;
  selectedVariantPrice?: number;
}

/**
 * Preço do produto na vitrine e promoções que valem para ele.
 * - finalPrice: preço que vai para o carrinho (oferta do produto ou desconto "no preço").
 * - bestPromotion: promoção "no pedido" que este item já ativa (ex.: frete grátis, leve x pague y).
 * - eligiblePromotion: promoção que cobre o produto, mesmo sem a condição atingida (selo).
 * As regras vêm do núcleo único (supabase/functions/_shared/promotion-core.ts).
 */
export const useProductPromotion = ({
  product,
  storeId,
  quantity = 1,
  selectedVariantPrice,
}: UseProductPromotionProps) => {
  const { data: storePromotions, isLoading } = useStorePromotions(storeId);

  return useMemo(() => {
    const empty = { finalPrice: 0, discountInfo: null, bestPromotion: null as Promotion | null, eligiblePromotion: null as Promotion | null, loading: isLoading };
    if (!product || !storeId || !storePromotions) return empty;

    const currentPrice = selectedVariantPrice || product.price;
    const price = calculateProductPrice(
      { id: product.id, price: currentPrice, is_on_offer: selectedVariantPrice ? false : product.is_on_offer, offer_price: product.offer_price },
      storePromotions,
    );

    const ctx = { now: new Date(), timeZone: DEFAULT_STORE_TIMEZONE };
    const item = { productId: product.id, categoryId: product.category_id ?? null };
    const covering = storePromotions.filter(p =>
      !p.code && !isPricedInPromotion(p as CorePromotion)
      && promotionActiveAt(p as CorePromotion, ctx).ok && itemIsEligible(p as CorePromotion, item));

    // Promoção "no pedido" que este item sozinho já ativa (taxa simbólica de 1 real só para testar o frete grátis)
    const order = { deliveryType: 'delivery' as const, deliveryFee: 1, items: [{ ...item, unitPrice: price.finalPrice, quantity }] };
    let bestPromotion: Promotion | null = null;
    let bestValue = -1;
    for (const p of covering) {
      const r = evaluatePromotion(p as CorePromotion, order, ctx);
      if (r.valid && r.discount > bestValue) { bestValue = r.discount; bestPromotion = p; }
    }

    const eligiblePromotion = (storePromotions.find(p =>
      p.is_visible_on_store && !p.code && promotionActiveAt(p as CorePromotion, ctx).ok && itemIsEligible(p as CorePromotion, item)) ?? null) as Promotion | null;

    return {
      finalPrice: price.finalPrice,
      discountInfo: { amount: price.discount, source: price.source, message: price.message },
      bestPromotion,
      eligiblePromotion,
      loading: false,
    };
  }, [product, storeId, quantity, selectedVariantPrice, storePromotions, isLoading]);
};
