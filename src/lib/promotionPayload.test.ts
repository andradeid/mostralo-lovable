/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { buildPromotionPayload, endOfDayISO, hasCalculableBenefit } from './promotionPayload.ts';
import type { PromotionFormData } from '../types/promotions';

const base = (o: Partial<PromotionFormData> = {}): PromotionFormData => ({
  name: ' Black ', description: '', code: 'volta10',
  include_product_discount: true, include_free_delivery: false, include_bogo: false,
  include_first_order: false, include_free_gift: false,
  discount_mode: 'percentage', discount_percentage: 10,
  scope: 'all_products', applies_to_delivery: true, applies_to_pickup: false,
  first_order_only: false, is_visible_on_store: true,
  start_date: new Date(2026, 10, 20, 15, 30), end_date: new Date(2026, 10, 30, 0, 0),
  selectedProducts: [], selectedCategories: [], product_sale_prices: {},
  ...o,
});
const ctx = { storeId: 's1', products: [{ id: 'p1', price: 50 }, { id: 'p2', price: 30 }] };

test('valor fixo é salvo como fixed_amount com o valor (bug: virava percentual ao criar)', () => {
  const r = buildPromotionPayload(base({ discount_mode: 'fixed_amount', discount_amount: 10, discount_percentage: undefined }), ctx);
  assert.equal(r.type, 'fixed_amount');
  assert.equal(r.discount_amount, 10);
  assert.equal(r.discount_percentage, null);
});

test('percentual guarda só a porcentagem', () => {
  const r = buildPromotionPayload(base(), ctx);
  assert.equal(r.type, 'percentage');
  assert.equal(r.discount_percentage, 10);
  assert.equal(r.discount_amount, null);
});

test('delivery e retirada vão para o banco como escolhidos', () => {
  const r = buildPromotionPayload(base(), ctx);
  assert.equal(r.applies_to_delivery, true);
  assert.equal(r.applies_to_pickup, false);
});

test('término vale o dia inteiro (23:59:59) e início começa no começo do dia', () => {
  const r = buildPromotionPayload(base(), ctx);
  assert.equal(r.end_date, endOfDayISO(new Date(2026, 10, 30)));
  const end = new Date(r.end_date!);
  assert.equal(end.getHours(), 23); assert.equal(end.getMinutes(), 59);
  assert.equal(new Date(r.start_date).getHours(), 0);
});

test('cupom em maiúsculas e sem espaços; vazio vira null', () => {
  assert.equal(buildPromotionPayload(base(), ctx).code, 'VOLTA10');
  assert.equal(buildPromotionPayload(base({ code: '  ' }), ctx).code, null);
});

test('primeira compra marcada vira first_order_only', () => {
  const r = buildPromotionPayload(base({ include_product_discount: false, include_first_order: true, discount_amount: 5 }), ctx);
  assert.equal(r.type, 'first_order');
  assert.equal(r.first_order_only, true);
});

test('preço promocional soma a diferença dos produtos escolhidos', () => {
  const r = buildPromotionPayload(base({
    discount_mode: 'sale_price', scope: 'specific_products', selectedProducts: ['p1', 'p2'],
    product_sale_prices: { p1: 40, p2: 30 },
  }), ctx);
  assert.equal(r.type, 'fixed_amount');
  assert.equal(r.discount_amount, 10);
});

test('frete grátis com desconto mantém os dois', () => {
  const r = buildPromotionPayload(base({ include_free_delivery: true }), ctx);
  assert.equal(r.type, 'free_delivery');
  assert.equal(r.discount_percentage, 10);
});

test('leve x pague y guarda as quantidades', () => {
  const r = buildPromotionPayload(base({ include_product_discount: false, include_bogo: true, bogo_buy_quantity: 3, bogo_get_quantity: 1, bogo_discount_percentage: 100 }), ctx);
  assert.equal(r.type, 'bogo');
  assert.deepEqual([r.bogo_buy_quantity, r.bogo_get_quantity, r.bogo_discount_percentage], [3, 1, 100]);
  assert.equal(r.discount_percentage, null);
});

test('dias vazios significam todos os dias (null)', () => {
  assert.equal(buildPromotionPayload(base({ allowed_days: [] }), ctx).allowed_days, null);
  assert.deepEqual(buildPromotionPayload(base({ allowed_days: ['friday'] }), ctx).allowed_days, ['friday']);
});

test('brinde sozinho vale quando tem produto escolhido', () => {
  assert.equal(hasCalculableBenefit(base({ include_product_discount: false, include_free_gift: true })), false);
  const gift = base({ include_product_discount: false, include_free_gift: true, free_gift_products: ['x'] });
  assert.equal(hasCalculableBenefit(gift), true);
  assert.equal(buildPromotionPayload(gift, ctx).type, 'free_gift');
});

test('brinde junto de desconto: tipo do desconto, brinde marcado', () => {
  const p = buildPromotionPayload(base({ include_free_gift: true, free_gift_products: ['x'] }), ctx);
  assert.notEqual(p.type, 'free_gift');
  assert.equal(p.include_free_gift, true);
  assert.deepEqual(p.free_gift_products, ['x']);
});
