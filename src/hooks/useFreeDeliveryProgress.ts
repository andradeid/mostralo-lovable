import { useMemo } from 'react';
import { useStorePromotions } from '@/hooks/useStorePromotions';
import { DEFAULT_STORE_TIMEZONE } from '@/utils/promotionCalculator';
import { freeDeliveryMessage, freeDeliveryProgress, type FreeDeliveryProgress } from '@/lib/freeDeliveryProgress';
import type { CorePromotion } from '../../supabase/functions/_shared/promotion-core';

interface Item {
  id: string;
  price: number;
  quantity: number;
  category_id?: string | null;
}

interface Params {
  storeId?: string;
  items: Item[];
  deliveryType: string;
  appliedPromotionType?: string | null;
}

/** Faixa "faltam R$ X para frete grátis" (usa o cache de promoções da loja; não mexe em preço). */
export function useFreeDeliveryProgress({ storeId, items, deliveryType, appliedPromotionType }: Params): {
  progress: FreeDeliveryProgress;
  message: string | null;
} {
  const { data: promotions } = useStorePromotions(storeId);
  return useMemo(() => {
    const progress = freeDeliveryProgress(
      (promotions ?? []) as CorePromotion[],
      {
        deliveryType,
        appliedPromotionType,
        items: items.map(i => ({
          productId: i.id.includes('_') ? i.id.split('_')[0] : i.id,
          categoryId: i.category_id ?? null,
          unitPrice: Number(i.price) || 0,
          quantity: Number(i.quantity) || 0,
        })),
      },
      { now: new Date(), timeZone: DEFAULT_STORE_TIMEZONE },
    );
    return { progress, message: freeDeliveryMessage(progress) };
  }, [promotions, items, deliveryType, appliedPromotionType]);
}
