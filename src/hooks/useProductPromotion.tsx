import { useState, useEffect } from 'react';
import { 
  findApplicablePromotions, 
  calculateBestDiscount,
  findBestPromotion 
} from '@/utils/promotionCalculator';
import type { Promotion } from '@/types/promotions';

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

export const useProductPromotion = ({
  product,
  storeId,
  quantity = 1,
  selectedVariantPrice
}: UseProductPromotionProps) => {
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [discountInfo, setDiscountInfo] = useState<{
    amount: number;
    source: 'product_offer' | 'promotion' | 'none';
    message: string;
  } | null>(null);
  const [bestPromotion, setBestPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product || !storeId) return;

    const calculatePromotion = async () => {
      setLoading(true);
      
      try {
        const currentPrice = selectedVariantPrice || product.price;
        
        // Construir orderData para verificar promoções
        const orderData = {
          items: [{
            id: product.id,
            name: product.name,
            price: currentPrice,
            quantity: quantity,
            category_id: product.category_id
          }],
          subtotal: currentPrice * quantity,
          deliveryType: 'delivery' as const,
          deliveryFee: 0,
          storeId: storeId
        };
        
        // Buscar promoções aplicáveis
        const promotions = await findApplicablePromotions(storeId, orderData);
        
        // Encontrar a melhor promoção
        const best = promotions.length > 0 
          ? await findBestPromotion(promotions, orderData) 
          : null;
        setBestPromotion(best);
        
        // Calcular o melhor desconto (produto vs promoção)
        const result = await calculateBestDiscount(
          {
            id: product.id,
            price: currentPrice,
            is_on_offer: product.is_on_offer,
            offer_price: product.offer_price
          },
          best,
          orderData
        );
        
        setFinalPrice(result.finalPrice);
        setDiscountInfo({
          amount: result.discount,
          source: result.source,
          message: result.message
        });
      } catch (error) {
        console.error('Erro ao calcular promoção:', error);
        const currentPrice = selectedVariantPrice || product.price;
        setFinalPrice(currentPrice);
        setDiscountInfo(null);
      } finally {
        setLoading(false);
      }
    };

    calculatePromotion();
  }, [product, storeId, quantity, selectedVariantPrice]);

  return { finalPrice, discountInfo, bestPromotion, loading };
};
