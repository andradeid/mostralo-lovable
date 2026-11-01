/**
 * Núcleo ÚNICO das regras de promoção do Mostralo — usado pela loja (carrinho, checkout,
 * página do produto) e pelo servidor (create-guest-order-v3). Puro e sem dependências:
 * o navegador importa este arquivo pelo caminho relativo; os testes rodam com Deno e Node.
 *
 * Dois tipos de promoção:
 *  - "no preço" (priced-in): desconto (percentual ou valor) em produto específico, vale para
 *    entrega E retirada, sem cupom, sem pedido mínimo e sem 1ª compra → já entra no preço do item.
 *  - "no pedido": todas as outras → o desconto aparece no carrinho/checkout como uma linha.
 */

export type DeliveryKind = 'delivery' | 'pickup';

export interface CorePromotion {
  id: string;
  type: string;
  scope: string;
  status?: string | null;
  code?: string | null;
  discount_percentage?: number | string | null;
  discount_amount?: number | string | null;
  bogo_buy_quantity?: number | null;
  bogo_get_quantity?: number | null;
  bogo_discount_percentage?: number | string | null;
  applies_to_delivery?: boolean | null;
  applies_to_pickup?: boolean | null;
  first_order_only?: boolean | null;
  minimum_order_value?: number | string | null;
  max_uses?: number | null;
  current_uses?: number | null;
  max_uses_per_customer?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  allowed_days?: string[] | null;
  start_time?: string | null;
  end_time?: string | null;
  product_ids?: string[];
  category_ids?: string[];
  /** Brinde: produto(s) que o cliente ganha (escolhe 1 quando houver mais de um). */
  include_free_gift?: boolean | null;
  free_gift_products?: string[] | null;
}

export interface CoreItem {
  productId: string;
  categoryId?: string | null;
  /** Preço unitário do item no carrinho (já com variação, adicionais e desconto "no preço"). */
  unitPrice: number;
  quantity: number;
}

export interface CoreOrder {
  items: CoreItem[];
  deliveryType: DeliveryKind;
  deliveryFee: number;
}

export interface CoreContext {
  now: Date;
  /** Fuso da loja (ex.: America/Sao_Paulo). Dias e horários da promoção seguem este fuso. */
  timeZone?: string | null;
  /** true = cliente sem pedido anterior; false = já comprou; null/undefined = não verificado. */
  isFirstOrder?: boolean | null;
  /** Quantas vezes este cliente já usou a promoção (null = não verificado). */
  customerUses?: number | null;
}

export interface CoreResult {
  valid: boolean;
  reason: string;
  /** Desconto que entra no pedido (linha de desconto). */
  discount: number;
  /** Economia para mostrar ao cliente (pedido + o que já está no preço). */
  savings: number;
  /** Produtos que podem ir de brinde (o cliente leva 1). Vazio = sem brinde. */
  giftProductIds: string[];
}

const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
export const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const fail = (reason: string): CoreResult => ({ valid: false, reason, discount: 0, savings: 0, giftProductIds: [] });

/** Produtos de brinde da promoção (tipo "free_gift" ou brinde marcado junto de outro benefício). */
export function promotionGiftIds(p: CorePromotion): string[] {
  if (p.type !== 'free_gift' && !p.include_free_gift) return [];
  return [...new Set((p.free_gift_products ?? []).filter(Boolean))];
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Dia da semana (em inglês, minúsculo) e HH:MM no fuso informado. */
export function zonedDayAndTime(now: Date, timeZone?: string | null): { day: string; time: string } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'America/Sao_Paulo', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now);
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? '';
    return { day: get('weekday').toLowerCase(), time: `${get('hour').padStart(2, '0')}:${get('minute').padStart(2, '0')}` };
  } catch {
    return { day: WEEKDAYS[now.getDay()], time: now.toTimeString().slice(0, 5) };
  }
}

/** Promoção ativa agora: status, período, dias da semana e horário (no fuso da loja). */
export function promotionActiveAt(p: CorePromotion, ctx: Pick<CoreContext, 'now' | 'timeZone'>): { ok: boolean; reason: string } {
  if (p.status && p.status !== 'active') return { ok: false, reason: 'Promoção não está ativa' };
  const t = ctx.now.getTime();
  if (p.start_date && new Date(p.start_date).getTime() > t) return { ok: false, reason: 'Promoção ainda não começou' };
  if (p.end_date && new Date(p.end_date).getTime() < t) return { ok: false, reason: 'Promoção encerrada' };
  const { day, time } = zonedDayAndTime(ctx.now, ctx.timeZone);
  if (p.allowed_days && p.allowed_days.length > 0 && !p.allowed_days.includes(day)) {
    return { ok: false, reason: 'Promoção não vale hoje' };
  }
  if (p.start_time && p.end_time) {
    const s = p.start_time.slice(0, 5), e = p.end_time.slice(0, 5);
    const inside = s <= e ? time >= s && time <= e : time >= s || time <= e; // faixa que vira a noite
    if (!inside) return { ok: false, reason: 'Promoção fora do horário' };
  }
  return { ok: true, reason: '' };
}

export function isPricedInPromotion(p: CorePromotion): boolean {
  return promotionGiftIds(p).length === 0 && p.scope === 'specific_products' && !!p.applies_to_delivery && !!p.applies_to_pickup && !p.code
    && !p.first_order_only && !(n(p.minimum_order_value) > 0)
    && (p.type === 'percentage' || p.type === 'fixed_amount');
}

export function itemIsEligible(p: CorePromotion, item: Pick<CoreItem, 'productId' | 'categoryId'>): boolean {
  if (p.scope === 'specific_products') return (p.product_ids ?? []).includes(item.productId);
  if (p.scope === 'category') return !!item.categoryId && (p.category_ids ?? []).includes(item.categoryId);
  return true;
}

/** Preço unitário com o desconto "no preço" (promoções de produto específico). */
export function pricedInUnitPrice(basePrice: number, productId: string, promotions: CorePromotion[], ctx: CoreContext): number {
  let best = basePrice;
  for (const p of promotions) {
    if (!isPricedInPromotion(p) || !itemIsEligible(p, { productId }) || !promotionActiveAt(p, ctx).ok) continue;
    const pct = n(p.discount_percentage), amt = n(p.discount_amount);
    if (pct > 0) best = Math.min(best, basePrice * (1 - pct / 100));
    else if (amt > 0) best = Math.min(best, Math.max(0, basePrice - amt));
  }
  return round2(best);
}

function productDiscount(p: CorePromotion, eligibleSubtotal: number): number {
  const pct = n(p.discount_percentage), amt = n(p.discount_amount);
  if (pct > 0) return (eligibleSubtotal * pct) / 100;
  if (amt > 0) return Math.min(amt, eligibleSubtotal);
  return 0;
}

function bogoDiscount(p: CorePromotion, items: CoreItem[]): number {
  const buy = n(p.bogo_buy_quantity) || 2;
  const get = Math.min(n(p.bogo_get_quantity) || 1, buy);
  const pct = p.bogo_discount_percentage == null || p.bogo_discount_percentage === '' ? 100 : n(p.bogo_discount_percentage);
  const flat: number[] = [];
  for (const it of items) for (let i = 0; i < it.quantity; i++) flat.push(it.unitPrice);
  flat.sort((a, b) => b - a);
  const freeCount = Math.floor(flat.length / buy) * get;
  if (freeCount <= 0) return 0;
  return flat.slice(-freeCount).reduce((s, price) => s + price * (pct / 100), 0);
}

/**
 * Calcula a promoção para o pedido. Regras conferidas: status/período/dia/horário, tipo de
 * entrega, 1ª compra e limite por cliente (quando informados), pedido mínimo, limite total,
 * itens elegíveis e o desconto de cada tipo. Não arredonda o pedido para menos de zero.
 */
export function evaluatePromotion(p: CorePromotion, order: CoreOrder, ctx: CoreContext): CoreResult {
  const active = promotionActiveAt(p, ctx);
  if (!active.ok) return fail(active.reason);
  if (order.deliveryType === 'delivery' && p.applies_to_delivery === false) return fail('Promoção não vale para entrega');
  if (order.deliveryType === 'pickup' && p.applies_to_pickup === false) return fail('Promoção não vale para retirada');
  if (p.first_order_only && ctx.isFirstOrder === false) return fail('Promoção válida apenas para a primeira compra');
  if (p.max_uses_per_customer && ctx.customerUses != null && ctx.customerUses >= p.max_uses_per_customer) {
    return fail('Você já usou esta promoção o máximo de vezes permitido');
  }
  if (p.max_uses && n(p.current_uses) >= p.max_uses) return fail('Limite de usos da promoção atingido');

  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const minimum = n(p.minimum_order_value);
  if (minimum > 0 && subtotal + 0.001 < minimum) return fail(`Pedido mínimo de R$ ${minimum.toFixed(2).replace('.', ',')}`);

  const eligible = order.items.filter(i => itemIsEligible(p, i));
  if (eligible.length === 0 && p.scope !== 'all_products' && p.scope !== 'delivery_type') {
    return fail('Nenhum produto elegível para esta promoção');
  }
  const eligibleSubtotal = eligible.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const fee = order.deliveryType === 'delivery' ? Math.max(0, n(order.deliveryFee)) : 0;
  const pricedIn = isPricedInPromotion(p);

  let discount = 0;
  let extraSavings = 0;
  switch (p.type) {
    case 'percentage':
    case 'fixed_amount':
    case 'first_order':
    case 'minimum_order':
      if (pricedIn) { discount = 0; extraSavings = 0; break; } // já está no preço do item
      discount = productDiscount(p, eligibleSubtotal);
      if (p.type === 'first_order' && discount <= 0 && promotionGiftIds(p).length === 0) return fail('Promoção configurada sem valor de desconto');
      break;
    case 'free_delivery':
      discount = fee + productDiscount(p, eligibleSubtotal);
      break;
    case 'bogo':
      discount = bogoDiscount(p, eligible);
      break;
    case 'free_gift': // brinde; registros antigos podem ter desconto junto
      discount = productDiscount(p, eligibleSubtotal);
      break;
    default:
      return fail('Este tipo de promoção ainda não é calculado automaticamente');
  }
  const giftProductIds = promotionGiftIds(p);

  const cap = subtotal + (p.type === 'free_delivery' ? fee : 0);
  discount = round2(Math.min(Math.max(0, discount), cap));
  const savings = round2(discount + extraSavings);
  if (discount <= 0 && !pricedIn && giftProductIds.length === 0) return fail('A promoção não dá desconto neste pedido');
  return { valid: true, reason: '', discount, savings, giftProductIds };
}

/** Melhor promoção "no pedido" entre as candidatas (uma por pedido; a de maior desconto; empate → a que tem brinde). */
export function bestOrderPromotion<T extends CorePromotion>(promotions: T[], order: CoreOrder, ctx: CoreContext): { promotion: T; result: CoreResult } | null {
  let best: { promotion: T; result: CoreResult } | null = null;
  for (const p of promotions) {
    if (isPricedInPromotion(p)) continue;
    const result = evaluatePromotion(p, order, ctx);
    if (!result.valid || (result.discount <= 0 && result.giftProductIds.length === 0)) continue;
    if (!best || promotionScore(result) > promotionScore(best.result)) best = { promotion: p, result };
  }
  return best;
}

/** Ordem de preferência entre promoções: desconto; com o mesmo desconto, a que dá brinde. */
export function promotionScore(r: Pick<CoreResult, 'discount' | 'giftProductIds'>): number {
  return round2(r.discount) + (r.giftProductIds.length > 0 ? 0.001 : 0);
}
