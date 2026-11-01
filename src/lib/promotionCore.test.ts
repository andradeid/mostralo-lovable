/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  evaluatePromotion, bestOrderPromotion, pricedInUnitPrice, promotionActiveAt, isPricedInPromotion,
  type CorePromotion, type CoreOrder,
} from '../../supabase/functions/_shared/promotion-core.ts';

// Sexta, 27/11/2026 15:00 em São Paulo (18:00 UTC)
const now = new Date('2026-11-27T18:00:00Z');
const ctx = { now, timeZone: 'America/Sao_Paulo' };
const promo = (o: Partial<CorePromotion> = {}): CorePromotion => ({
  id: 'p', type: 'percentage', scope: 'all_products', status: 'active', code: null,
  discount_percentage: 10, applies_to_delivery: true, applies_to_pickup: true,
  start_date: '2026-11-01T03:00:00Z', end_date: null, ...o,
});
const order = (o: Partial<CoreOrder> = {}): CoreOrder => ({
  deliveryType: 'delivery', deliveryFee: 7,
  items: [
    { productId: 'burger', categoryId: 'lanches', unitPrice: 30, quantity: 2 },
    { productId: 'refri', categoryId: 'bebidas', unitPrice: 6, quantity: 3 },
  ], ...o,
});

test('percentual sobre o pedido todo', () => {
  assert.equal(evaluatePromotion(promo(), order(), ctx).discount, 7.8);
});

test('percentual por categoria usa só os itens da categoria (bug: category_id não chegava)', () => {
  const r = evaluatePromotion(promo({ scope: 'category', category_ids: ['bebidas'] }), order(), ctx);
  assert.equal(r.valid, true);
  assert.equal(r.discount, 1.8);
});

test('leve 3 pague 2 em bebidas: a terceira sai grátis', () => {
  const p = promo({ type: 'bogo', scope: 'category', category_ids: ['bebidas'], discount_percentage: null, bogo_buy_quantity: 3, bogo_get_quantity: 1, bogo_discount_percentage: 100 });
  assert.equal(evaluatePromotion(p, order(), ctx).discount, 6);
});

test('leve x pague y no pedido todo dá o desconto nos mais baratos', () => {
  const p = promo({ type: 'bogo', discount_percentage: null, bogo_buy_quantity: 2, bogo_get_quantity: 1, bogo_discount_percentage: 50 });
  // 5 itens → 2 grupos → 2 mais baratos (6 e 6) com 50%
  assert.equal(evaluatePromotion(p, order(), ctx).discount, 6);
});

test('frete grátis acima de R$ 60: dá o valor do frete; abaixo do mínimo não vale', () => {
  const p = promo({ type: 'free_delivery', discount_percentage: null, minimum_order_value: 60 });
  assert.equal(evaluatePromotion(p, order(), ctx).discount, 7);
  assert.equal(evaluatePromotion(p, order({ items: [{ productId: 'refri', unitPrice: 6, quantity: 1 }] }), ctx).valid, false);
  assert.equal(evaluatePromotion(p, order({ deliveryType: 'pickup' }), ctx).valid, false);
});

test('só retirada não vale na entrega', () => {
  const p = promo({ applies_to_delivery: false });
  assert.equal(evaluatePromotion(p, order(), ctx).valid, false);
  assert.equal(evaluatePromotion(p, order({ deliveryType: 'pickup' }), ctx).valid, true);
});

test('dias e horário no fuso da loja (servidor em UTC não muda o dia)', () => {
  assert.equal(promotionActiveAt(promo({ allowed_days: ['friday'] }), ctx).ok, true);
  assert.equal(promotionActiveAt(promo({ allowed_days: ['saturday'] }), ctx).ok, false);
  assert.equal(promotionActiveAt(promo({ start_time: '14:00', end_time: '16:00' }), ctx).ok, true);
  assert.equal(promotionActiveAt(promo({ start_time: '18:00', end_time: '23:00' }), ctx).ok, false); // 18h UTC = 15h SP
  // 23:30 SP de sexta = 02:30 UTC de sábado: ainda é sexta para a loja
  assert.equal(promotionActiveAt(promo({ allowed_days: ['friday'] }), { now: new Date('2026-11-28T02:30:00Z'), timeZone: 'America/Sao_Paulo' }).ok, true);
});

test('faixa de horário que vira a noite', () => {
  const late = { now: new Date('2026-11-28T03:30:00Z'), timeZone: 'America/Sao_Paulo' }; // 00:30 SP
  assert.equal(promotionActiveAt(promo({ start_time: '22:00', end_time: '02:00' }), late).ok, true);
});

test('término no fim do dia: vale até 23:59 do último dia', () => {
  const p = promo({ end_date: '2026-11-28T02:59:59.999Z' }); // 27/11 23:59:59 SP
  assert.equal(promotionActiveAt(p, ctx).ok, true);
  assert.equal(promotionActiveAt(p, { now: new Date('2026-11-28T03:00:01Z'), timeZone: 'America/Sao_Paulo' }).ok, false);
});

test('produto específico para entrega e retirada entra no preço; só retirada fica no pedido', () => {
  const both = promo({ scope: 'specific_products', product_ids: ['burger'], discount_percentage: 50 });
  assert.equal(isPricedInPromotion(both), true);
  assert.equal(pricedInUnitPrice(30, 'burger', [both], ctx), 15);
  assert.equal(pricedInUnitPrice(30, 'refri', [both], ctx), 30);
  const pickup = promo({ scope: 'specific_products', product_ids: ['burger'], discount_percentage: 8.35, applies_to_delivery: false });
  assert.equal(isPricedInPromotion(pickup), false);
  assert.equal(evaluatePromotion(pickup, order({ deliveryType: 'pickup' }), ctx).discount, 5.01);
});

test('valor fixo não passa do subtotal dos itens elegíveis', () => {
  const p = promo({ type: 'fixed_amount', discount_percentage: null, discount_amount: 100 });
  assert.equal(evaluatePromotion(p, order(), ctx).discount, 78);
});

test('primeira compra: bloqueia quem já comprou', () => {
  const p = promo({ type: 'first_order', first_order_only: true });
  assert.equal(evaluatePromotion(p, order(), { ...ctx, isFirstOrder: false }).valid, false);
  assert.equal(evaluatePromotion(p, order(), { ...ctx, isFirstOrder: true }).discount, 7.8);
});

test('melhor promoção do pedido: a de maior desconto', () => {
  const a = promo({ id: 'a', discount_percentage: 5 });
  const b = promo({ id: 'b', type: 'free_delivery', discount_percentage: null });
  assert.equal(bestOrderPromotion([a, b], order(), ctx)?.promotion.id, 'b');
});

test('brinde sem produto escolhido não vale (não aplica desconto escondido)', () => {
  assert.equal(evaluatePromotion(promo({ type: 'free_gift', discount_percentage: null }), order(), ctx).valid, false);
});

test('brinde: vale com pedido mínimo e devolve os produtos de brinde, sem desconto', () => {
  const p = promo({ type: 'free_gift', discount_percentage: null, minimum_order_value: 50, free_gift_products: ['sobremesa', 'sobremesa'] });
  const r = evaluatePromotion(p, order(), ctx);
  assert.equal(r.valid, true);
  assert.equal(r.discount, 0);
  assert.deepEqual(r.giftProductIds, ['sobremesa']);
  assert.equal(evaluatePromotion(p, order({ items: [{ productId: 'refri', unitPrice: 6, quantity: 1 }] }), ctx).valid, false);
});

test('brinde junto de desconto: desconto e brinde; e não vira promoção "no preço"', () => {
  const p = promo({ scope: 'specific_products', product_ids: ['burger'], include_free_gift: true, free_gift_products: ['batata'] });
  assert.equal(isPricedInPromotion(p), false);
  const r = evaluatePromotion(p, order(), ctx);
  assert.equal(r.discount, 6);
  assert.deepEqual(r.giftProductIds, ['batata']);
});

test('melhor promoção: brinde só ganha quando não há desconto maior', () => {
  const gift = promo({ id: 'g', type: 'free_gift', discount_percentage: null, free_gift_products: ['batata'] });
  const pct = promo({ id: 'pct', discount_percentage: 5 });
  assert.equal(bestOrderPromotion([gift, pct], order(), ctx)?.promotion.id, 'pct');
  assert.equal(bestOrderPromotion([gift], order(), ctx)?.promotion.id, 'g');
});
