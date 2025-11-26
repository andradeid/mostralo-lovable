import { supabase } from '@/integrations/supabase/client';
import { Promotion, CartItem, OrderData, PromotionCalculationResult } from '@/types/promotions';

export async function calculatePromotionDiscount(
  promotion: Promotion,
  orderData: OrderData
): Promise<PromotionCalculationResult> {
  
  // 1. Verificar se promoção está ativa
  if (promotion.status !== 'active') {
    return { isValid: false, discount: 0, message: 'Promoção não está ativa' };
  }
  
  // 2. Verificar datas
  const now = new Date();
  if (now < new Date(promotion.start_date) || 
     (promotion.end_date && now > new Date(promotion.end_date))) {
    return { isValid: false, discount: 0, message: 'Promoção fora do período de validade' };
  }
  
  // 3. Verificar dias da semana
  if (promotion.allowed_days && promotion.allowed_days.length > 0) {
    const daysMap: { [key: number]: string } = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };
    const currentDay = daysMap[now.getDay()];
    if (!promotion.allowed_days.includes(currentDay)) {
      return { isValid: false, discount: 0, message: 'Promoção não válida hoje' };
    }
  }
  
  // 4. Verificar horário
  if (promotion.start_time && promotion.end_time) {
    const currentTime = now.toTimeString().slice(0, 5);
    if (currentTime < promotion.start_time || currentTime > promotion.end_time) {
      return { isValid: false, discount: 0, message: 'Promoção fora do horário permitido' };
    }
  }
  
  // 5. Verificar tipo de entrega
  if (orderData.deliveryType === 'delivery' && !promotion.applies_to_delivery) {
    return { isValid: false, discount: 0, message: 'Promoção não válida para delivery' };
  }
  if (orderData.deliveryType === 'pickup' && !promotion.applies_to_pickup) {
    return { isValid: false, discount: 0, message: 'Promoção não válida para retirada' };
  }
  
  // 6. Verificar primeira compra
  if (promotion.first_order_only && orderData.customerId) {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', orderData.customerId)
      .eq('store_id', orderData.storeId);
    
    if (count && count > 0) {
      return { isValid: false, discount: 0, message: 'Promoção válida apenas para primeira compra' };
    }
  }
  
  // 7. Verificar valor mínimo
  if (promotion.minimum_order_value && orderData.subtotal < promotion.minimum_order_value) {
    return { 
      isValid: false, 
      discount: 0, 
      message: `Pedido mínimo de R$ ${promotion.minimum_order_value.toFixed(2)}` 
    };
  }
  
  // 8. Verificar limite de usos
  if (promotion.max_uses && promotion.current_uses >= promotion.max_uses) {
    return { isValid: false, discount: 0, message: 'Limite de usos da promoção atingido' };
  }
  
  // 9. Verificar limite por cliente
  if (promotion.max_uses_per_customer && orderData.customerId) {
    const { count } = await supabase
      .from('promotion_usage')
      .select('*', { count: 'exact', head: true })
      .eq('promotion_id', promotion.id)
      .eq('customer_id', orderData.customerId);
    
    if (count && count >= promotion.max_uses_per_customer) {
      return { isValid: false, discount: 0, message: 'Você já usou esta promoção o máximo de vezes permitido' };
    }
  }
  
  // 10. Verificar escopo (produtos/categorias)
  let applicableItems = orderData.items;
  
  if (promotion.scope === 'specific_products') {
    const { data: productIds } = await supabase
      .from('promotion_products')
      .select('product_id')
      .eq('promotion_id', promotion.id);
    
    const allowedIds = productIds?.map(p => p.product_id) || [];
    applicableItems = orderData.items.filter(item => allowedIds.includes(item.id));
  }
  
  if (promotion.scope === 'category') {
    const { data: categoryIds } = await supabase
      .from('promotion_categories')
      .select('category_id')
      .eq('promotion_id', promotion.id);
    
    const allowedCategoryIds = categoryIds?.map(c => c.category_id) || [];
    applicableItems = orderData.items.filter(item => 
      item.category_id && allowedCategoryIds.includes(item.category_id)
    );
  }
  
  if (applicableItems.length === 0 && promotion.scope !== 'all_products' && promotion.scope !== 'delivery_type') {
    return { isValid: false, discount: 0, message: 'Nenhum produto elegível para esta promoção' };
  }
  
  // 11. Calcular desconto baseado no tipo
  let discount = 0;
  
  switch (promotion.type) {
    case 'percentage':
      const applicableSubtotal = applicableItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0);
      discount = (applicableSubtotal * (promotion.discount_percentage || 0)) / 100;
      break;
      
    case 'fixed_amount':
      discount = promotion.discount_amount || 0;
      break;
      
    case 'free_delivery':
      discount = orderData.deliveryType === 'delivery' ? orderData.deliveryFee : 0;
      break;
      
    case 'minimum_order':
      if (orderData.subtotal >= (promotion.minimum_order_value || 0)) {
        discount = promotion.discount_percentage 
          ? (orderData.subtotal * promotion.discount_percentage) / 100
          : (promotion.discount_amount || 0);
      }
      break;
      
    case 'bogo':
      const buyQty = promotion.bogo_buy_quantity || 2;
      const getQty = promotion.bogo_get_quantity || 1;
      
      applicableItems.forEach(item => {
        const sets = Math.floor(item.quantity / (buyQty + getQty));
        const freeItems = sets * getQty;
        discount += freeItems * item.price;
      });
      break;

    case 'first_order':
      if (promotion.discount_percentage) {
        discount = (orderData.subtotal * promotion.discount_percentage) / 100;
      } else if (promotion.discount_amount) {
        discount = promotion.discount_amount;
      } else {
        return { 
          isValid: false, 
          discount: 0, 
          message: 'Promoção configurada incorretamente (sem valor de desconto)' 
        };
      }
      break;
  }
  
  // Garantir que desconto não ultrapasse o subtotal
  discount = Math.min(discount, orderData.subtotal);
  discount = Math.round(discount * 100) / 100;
  
  return {
    isValid: true,
    discount,
    message: `Desconto de R$ ${discount.toFixed(2)} aplicado com sucesso`,
    promotionApplied: promotion
  };
}

export async function findApplicablePromotions(
  storeId: string,
  orderData: OrderData
): Promise<Promotion[]> {
  const { data: promotions } = await supabase
    .from('promotions')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'active')
    .is('code', null)
    .lte('start_date', new Date().toISOString())
    .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
    .order('display_order');
  
  if (!promotions) return [];
  
  // Validar cada promoção
  const validPromotions: Promotion[] = [];
  for (const promo of promotions) {
    const result = await calculatePromotionDiscount(promo, orderData);
    if (result.isValid && result.discount > 0) {
      validPromotions.push(promo);
    }
  }
  
  return validPromotions;
}

export async function validatePromotionCode(
  code: string,
  storeId: string
): Promise<Promotion | null> {
  const { data } = await supabase
    .from('promotions')
    .select('*')
    .eq('store_id', storeId)
    .ilike('code', code)
    .eq('status', 'active')
    .lte('start_date', new Date().toISOString())
    .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
    .single();
  
  return data;
}

export async function findBestPromotion(
  promotions: Promotion[],
  orderData: OrderData
): Promise<Promotion | null> {
  let bestPromotion: Promotion | null = null;
  let maxDiscount = 0;
  
  for (const promo of promotions) {
    const result = await calculatePromotionDiscount(promo, orderData);
    if (result.isValid && result.discount > maxDiscount) {
      maxDiscount = result.discount;
      bestPromotion = promo;
    }
  }
  
  return bestPromotion;
}

/**
 * Calcula o melhor desconto entre promoção e oferta do produto
 * Retorna o menor preço (maior desconto) para beneficiar o cliente
 */
export async function calculateBestDiscount(
  product: {
    id: string;
    price: number;
    is_on_offer?: boolean;
    offer_price?: number;
  },
  promotion: Promotion | null,
  orderData: OrderData
): Promise<{
  finalPrice: number;
  discount: number;
  source: 'product_offer' | 'promotion' | 'none';
  message: string;
}> {
  const originalPrice = product.price;
  let bestPrice = originalPrice;
  let source: 'product_offer' | 'promotion' | 'none' = 'none';
  let message = '';

  // 1. Calcular desconto direto do produto
  let productOfferPrice = originalPrice;
  if (product.is_on_offer && product.offer_price && product.offer_price < originalPrice) {
    productOfferPrice = product.offer_price;
  }

  // 2. Calcular desconto da promoção (se houver)
  let promotionPrice = originalPrice;
  if (promotion) {
    const result = await calculatePromotionDiscount(promotion, orderData);
    if (result.isValid && result.discount > 0) {
      // Aplicar o desconto da promoção proporcionalmente
      const itemInOrder = orderData.items.find(i => i.id === product.id);
      if (itemInOrder) {
        const itemSubtotal = itemInOrder.price * itemInOrder.quantity;
        const applicableSubtotal = orderData.items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0);
        const proportionalDiscount = (result.discount * itemSubtotal) / applicableSubtotal;
        promotionPrice = originalPrice - (proportionalDiscount / itemInOrder.quantity);
      }
    }
  }

  // 3. Escolher o menor preço (maior desconto)
  if (productOfferPrice < promotionPrice && productOfferPrice < originalPrice) {
    bestPrice = productOfferPrice;
    source = 'product_offer';
    const discountPercent = ((originalPrice - productOfferPrice) / originalPrice * 100).toFixed(0);
    message = `Desconto do produto: ${discountPercent}% OFF`;
  } else if (promotionPrice < originalPrice) {
    bestPrice = promotionPrice;
    source = 'promotion';
    message = promotion?.name || 'Promoção aplicada';
  }

  return {
    finalPrice: Math.max(0, bestPrice),
    discount: originalPrice - bestPrice,
    source,
    message
  };
}
