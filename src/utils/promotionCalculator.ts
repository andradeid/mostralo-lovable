/**
 * Promoções na loja (navegador). As REGRAS ficam no núcleo único
 * supabase/functions/_shared/promotion-core.ts — o mesmo que o servidor usa para
 * conferir o pedido (create-guest-order-v3). Aqui ficam só as buscas no banco
 * (vínculos, 1ª compra, usos do cliente) e a adaptação para os componentes.
 */
import { brl } from '@/lib/brl';
import { supabase } from '@/integrations/supabase/client';
import { Promotion, OrderData, PromotionCalculationResult, StorePromotion } from '@/types/promotions';
import {
  evaluatePromotion,
  isPricedInPromotion as coreIsPricedIn,
  itemIsEligible,
  pricedInUnitPrice,
  promotionActiveAt,
  promotionScore,
  type CoreOrder,
  type CorePromotion,
} from '../../supabase/functions/_shared/promotion-core';

export const DEFAULT_STORE_TIMEZONE = 'America/Sao_Paulo';

const baseProductId = (id: string) => (id.includes('_') ? id.split('_')[0] : id);

const toCoreOrder = (o: OrderData): CoreOrder => ({
  deliveryType: o.deliveryType,
  deliveryFee: o.deliveryFee || 0,
  items: o.items.map(i => ({
    productId: baseProductId(i.id),
    categoryId: i.category_id ?? null,
    unitPrice: Number(i.price) || 0,
    quantity: Number(i.quantity) || 0,
  })),
});

/** Carrega os vínculos de escopo quando a promoção veio sem eles (ex.: cupom digitado). */
async function withScope(p: StorePromotion): Promise<StorePromotion> {
  if (p.scope === 'specific_products' && !p.product_ids) {
    const { data } = await supabase.from('promotion_products').select('product_id').eq('promotion_id', p.id);
    return { ...p, product_ids: (data ?? []).map(r => r.product_id) };
  }
  if (p.scope === 'category' && !p.category_ids) {
    const { data } = await supabase.from('promotion_categories').select('category_id').eq('promotion_id', p.id);
    return { ...p, category_ids: (data ?? []).map(r => r.category_id) };
  }
  return p;
}

export function isPricedInPromotion(p: StorePromotion): boolean {
  return coreIsPricedIn(p as CorePromotion);
}

export async function calculatePromotionDiscount(
  promotion: StorePromotion,
  orderData: OrderData,
): Promise<PromotionCalculationResult> {
  const promo = await withScope(promotion);
  const now = new Date();
  const timeZone = orderData.timeZone || DEFAULT_STORE_TIMEZONE;

  // 1ª compra e limite por cliente precisam do banco (só quando o cliente é conhecido)
  let isFirstOrder: boolean | null = null;
  let customerUses: number | null = null;
  if (orderData.customerId && (promo.first_order_only || promo.max_uses_per_customer)) {
    const [{ count: orders }, { count: uses }] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true })
        .eq('customer_id', orderData.customerId).eq('store_id', orderData.storeId).neq('status', 'cancelado'),
      supabase.from('promotion_usage').select('*', { count: 'exact', head: true })
        .eq('promotion_id', promo.id).eq('customer_id', orderData.customerId),
    ]);
    isFirstOrder = (orders ?? 0) === 0;
    customerUses = uses ?? 0;
  }

  const r = evaluatePromotion(promo as CorePromotion, toCoreOrder(orderData), { now, timeZone, isFirstOrder, customerUses });
  if (!r.valid) return { isValid: false, discount: 0, totalSavings: 0, message: r.reason, giftProductIds: [] };
  const gift = r.giftProductIds.length > 0;
  return {
    isValid: true,
    discount: r.discount,
    totalSavings: r.savings,
    message: gift && r.savings <= 0
      ? 'Brinde incluído no seu pedido'
      : `Economia de ${brl(r.savings)} aplicada com sucesso${gift ? ' + brinde' : ''}`,
    promotionApplied: promo,
    giftProductIds: r.giftProductIds,
  };
}

/** Promoções automáticas (sem cupom) válidas para o pedido. */
export async function findApplicablePromotions(
  storeId: string,
  orderData: OrderData,
  preloaded?: StorePromotion[],
): Promise<StorePromotion[]> {
  const ctx = { now: new Date(), timeZone: orderData.timeZone || DEFAULT_STORE_TIMEZONE };
  const promotions: StorePromotion[] = preloaded
    ? preloaded.filter(p => !p.code && promotionActiveAt(p as CorePromotion, ctx).ok)
    : ((await supabase
        .from('promotions')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .is('code', null)
        .order('display_order')).data ?? []).filter(p => promotionActiveAt(p as CorePromotion, ctx).ok);

  const valid: StorePromotion[] = [];
  for (const promo of promotions) {
    const result = await calculatePromotionDiscount(promo, orderData);
    if (result.isValid && (result.discount > 0 || result.totalSavings > 0 || (result.giftProductIds?.length ?? 0) > 0)) valid.push(promo);
  }
  return valid;
}

/** Promoção com cupom pelo código exato (os códigos não ficam abertos ao público; função no banco). */
async function promotionByCode(storeId: string, code: string): Promise<Promotion | null> {
  const { data } = await supabase.rpc('get_promotion_by_code' as never, { p_store_id: storeId, p_code: code.trim() } as never);
  const rows = (data ?? []) as unknown as Promotion[];
  return rows[0] ?? null;
}

export async function validatePromotionCode(code: string, storeId: string): Promise<Promotion | null> {
  const data = await promotionByCode(storeId, code);
  if (!data) return null;
  const active = promotionActiveAt(data as CorePromotion, { now: new Date(), timeZone: DEFAULT_STORE_TIMEZONE });
  return active.ok ? data : null;
}

/** Busca fresca (sem cache) de uma promoção e seus vínculos — usada no fechamento do pedido. */
export async function fetchFreshPromotion(
  promotionId: string,
  coupon?: { storeId: string; code: string | null | undefined },
): Promise<StorePromotion | null> {
  const [{ data: listed }, { data: prods }, { data: cats }] = await Promise.all([
    supabase.from('promotions').select('*').eq('id', promotionId).maybeSingle(),
    supabase.from('promotion_products').select('product_id').eq('promotion_id', promotionId),
    supabase.from('promotion_categories').select('category_id').eq('promotion_id', promotionId),
  ]);
  // Cupom "secreto" não aparece na leitura pública: confere pelo código.
  let promo = listed as Promotion | null;
  if (!promo && coupon?.code) {
    const byCode = await promotionByCode(coupon.storeId, coupon.code);
    promo = byCode && byCode.id === promotionId ? byCode : null;
  }
  if (!promo) return null;
  return {
    ...promo,
    product_ids: (prods ?? []).map(p => p.product_id),
    category_ids: (cats ?? []).map(c => c.category_id),
  };
}

/** Uma promoção por pedido: a de maior desconto (empate → a que dá brinde). */
export async function findBestPromotion(
  promotions: StorePromotion[],
  orderData: OrderData,
): Promise<Promotion | null> {
  let best: Promotion | null = null;
  let max = 0;
  for (const promo of promotions) {
    const r = await calculatePromotionDiscount(promo, orderData);
    const score = r.isValid ? promotionScore({ discount: r.discount, giftProductIds: r.giftProductIds ?? [] }) : 0;
    if (score > max) { max = score; best = promo; }
  }
  return best;
}

/**
 * Preço do produto na vitrine: o menor entre a oferta do produto e o desconto "no preço"
 * (promoção de produto específico para entrega e retirada). Promoções "no pedido"
 * (leve x pague y, categoria, frete grátis, cupom...) NÃO mudam o preço do item:
 * aparecem como desconto no carrinho — igual ao que o servidor confere.
 */
export function calculateProductPrice(
  product: { id: string; price: number; is_on_offer?: boolean; offer_price?: number },
  promotions: StorePromotion[],
  timeZone = DEFAULT_STORE_TIMEZONE,
): { finalPrice: number; discount: number; source: 'product_offer' | 'promotion' | 'none'; message: string; promotion: StorePromotion | null } {
  const original = product.price;
  const offer = product.is_on_offer && product.offer_price && product.offer_price < original ? product.offer_price : original;
  const ctx = { now: new Date(), timeZone };
  const pricedIn = promotions.filter(p => coreIsPricedIn(p as CorePromotion) && itemIsEligible(p as CorePromotion, { productId: product.id }));
  const promoPrice = pricedInUnitPrice(original, product.id, pricedIn as CorePromotion[], ctx);
  if (promoPrice < original && promoPrice <= offer) {
    const p = pricedIn.find(x => pricedInUnitPrice(original, product.id, [x as CorePromotion], ctx) === promoPrice) ?? null;
    return { finalPrice: promoPrice, discount: original - promoPrice, source: 'promotion', message: p?.name || 'Promoção aplicada', promotion: p };
  }
  if (offer < original) {
    const pct = (((original - offer) / original) * 100).toFixed(0);
    return { finalPrice: offer, discount: original - offer, source: 'product_offer', message: `Desconto do produto: ${pct}% OFF`, promotion: null };
  }
  return { finalPrice: original, discount: 0, source: 'none', message: '', promotion: null };
}

/**
 * Promoções ATIVAS que cobrem o produto (por escopo), independente da quantidade no
 * carrinho — para o selo "EM PROMOÇÃO" (leve x pague y, frete grátis, valor mínimo...).
 */
export async function findEligiblePromotionsForProduct(
  storeId: string,
  productId: string,
  categoryId?: string,
  preloaded?: StorePromotion[],
): Promise<Promotion[]> {
  const ctx = { now: new Date(), timeZone: DEFAULT_STORE_TIMEZONE };
  const list: StorePromotion[] = preloaded ?? await (async () => {
    const { data } = await supabase.from('promotions').select('*')
      .eq('store_id', storeId).eq('status', 'active').eq('is_visible_on_store', true).is('code', null);
    return Promise.all((data ?? []).map(p => withScope(p)));
  })();
  return list.filter(p =>
    p.is_visible_on_store && !p.code && promotionActiveAt(p as CorePromotion, ctx).ok
    && itemIsEligible(p as CorePromotion, { productId, categoryId }),
  );
}
