import { useState, useEffect } from 'react';
import { findApplicablePromotions, findBestPromotion, calculatePromotionDiscount } from '@/utils/promotionCalculator';
import type { Promotion, CartItem, OrderData } from '@/types/promotions';

interface UseCartPromotionProps {
  items: CartItem[];
  storeId?: string;
  deliveryType?: 'delivery' | 'pickup';
  deliveryFee?: number;
}

export const useCartPromotion = ({
  items,
  storeId,
  deliveryType = 'delivery',
  deliveryFee = 0
}: UseCartPromotionProps) => {
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [discount, setDiscount] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId || items.length === 0) {
      setAppliedPromotion(null);
      setDiscount(0);
      setTotalSavings(0);
      return;
    }

    const calculatePromotion = async () => {
      setLoading(true);
      try {
        const orderData: OrderData = {
          items: items.map(item => ({
            id: item.id.includes('_') ? item.id.split('_')[0] : item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category_id: (item as any).category_id
          })),
          subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          deliveryType,
          deliveryFee,
          storeId
        };

        const applicablePromotions = await findApplicablePromotions(storeId, orderData);
        
        if (applicablePromotions.length > 0) {
          const best = await findBestPromotion(applicablePromotions, orderData);
          if (best) {
            const result = await calculatePromotionDiscount(best, orderData);
            if (result.isValid) {
              setAppliedPromotion(best);
              setDiscount(result.discount);
              setTotalSavings(result.totalSavings);
            } else {
              setAppliedPromotion(null);
              setDiscount(0);
              setTotalSavings(0);
            }
          }
        } else {
          setAppliedPromotion(null);
          setDiscount(0);
          setTotalSavings(0);
        }
      } catch (error) {
        console.error('Erro ao calcular promoção do carrinho:', error);
      } finally {
        setLoading(false);
      }
    };

    calculatePromotion();
  }, [items, storeId, deliveryType, deliveryFee]);

  return { appliedPromotion, discount, totalSavings, loading };
};
