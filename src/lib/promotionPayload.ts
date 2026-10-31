/**
 * Registro da promoção que vai para o banco — o MESMO ao criar e ao editar.
 * Antes, a criação montava outro registro (tipo fixo "percentage", sem delivery/retirada,
 * sem 1ª compra, término à meia-noite). Função pura: testada em promotionPayload.test.ts.
 */
import type { PromotionFormData } from '../types/promotions';

export type PromotionDBType = 'percentage' | 'fixed_amount' | 'free_delivery' | 'bogo' | 'first_order' | 'free_gift';

export interface PayloadProduct { id: string; price: number }

/** Tipo salvo no banco a partir dos benefícios marcados. */
export function resolvePromotionType(f: PromotionFormData): PromotionDBType {
  if (f.include_bogo) return 'bogo';
  if (f.include_free_gift) return 'free_gift';
  if (f.include_free_delivery) return 'free_delivery';
  if (f.include_first_order) return 'first_order';
  if (f.discount_mode === 'percentage') return 'percentage';
  return 'fixed_amount';
}

/** Soma do desconto dos produtos com preço promocional (modo "preço promocional"). */
export function discountFromSalePrices(f: PromotionFormData, products: PayloadProduct[]): number {
  if (f.discount_mode !== 'sale_price' || !f.product_sale_prices) return 0;
  let total = 0;
  for (const id of f.selectedProducts ?? []) {
    const p = products.find(x => x.id === id);
    const sale = f.product_sale_prices[id];
    if (p && sale !== undefined && sale < p.price) total += p.price - sale;
  }
  return Math.round(total * 100) / 100;
}

/** Início do dia escolhido (00:00:00 no fuso do navegador do lojista). */
export function startOfDayISO(d: Date): string {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x.toISOString();
}

/** Fim do dia escolhido (23:59:59.999): a promoção vale o dia de término inteiro. */
export function endOfDayISO(d: Date): string {
  const x = new Date(d); x.setHours(23, 59, 59, 999); return x.toISOString();
}

/** Algum benefício que o sistema calcula de verdade foi marcado? */
export function hasCalculableBenefit(f: PromotionFormData): boolean {
  return f.include_product_discount || f.include_free_delivery || f.include_bogo || f.include_first_order;
}

export function buildPromotionPayload(
  f: PromotionFormData,
  ctx: { storeId: string; products: PayloadProduct[]; keepStartTime?: boolean },
) {
  const type = resolvePromotionType(f);
  const productDiscount = f.include_product_discount;
  const mode = f.discount_mode;

  let discountPercentage: number | null = null;
  let discountAmount: number | null = null;
  if (productDiscount) {
    if (mode === 'percentage') discountPercentage = f.discount_percentage || null;
    else if (mode === 'fixed_amount') discountAmount = f.discount_amount || null;
    else discountAmount = discountFromSalePrices(f, ctx.products) || f.discount_amount || null;
  }

  const days = f.allowed_days && f.allowed_days.length ? f.allowed_days : null;
  return {
    store_id: ctx.storeId,
    name: f.name.trim(),
    description: f.description?.trim() || null,
    code: f.code?.trim() ? f.code.trim().toUpperCase() : null,
    type,
    scope: f.scope,
    status: 'active' as const,
    discount_percentage: discountPercentage,
    discount_amount: discountAmount,
    bogo_buy_quantity: f.include_bogo ? (f.bogo_buy_quantity || null) : null,
    bogo_get_quantity: f.include_bogo ? (f.bogo_get_quantity || null) : null,
    bogo_discount_percentage: f.include_bogo
      ? (Number.isFinite(Number(f.bogo_discount_percentage)) ? Number(f.bogo_discount_percentage) : 100)
      : null,
    include_free_gift: !!f.include_free_gift,
    free_gift_products: f.include_free_gift ? (f.free_gift_products ?? []) : [],
    applies_to_delivery: !!f.applies_to_delivery,
    applies_to_pickup: !!f.applies_to_pickup,
    first_order_only: !!(f.include_first_order || f.first_order_only),
    minimum_order_value: f.minimum_order_value || null,
    max_uses: f.max_uses || null,
    max_uses_per_customer: f.max_uses_per_customer || null,
    start_date: ctx.keepStartTime ? new Date(f.start_date).toISOString() : startOfDayISO(f.start_date),
    end_date: f.end_date ? endOfDayISO(f.end_date) : null,
    allowed_days: days,
    start_time: f.start_time || null,
    end_time: f.end_time || null,
    is_visible_on_store: !!f.is_visible_on_store,
    show_as_popup: !!f.show_as_popup,
    popup_frequency_type: f.popup_frequency_type || 'once_session',
    popup_max_displays: f.popup_max_displays || 1,
    banner_image_url: f.banner_image_url || null,
  };
}
