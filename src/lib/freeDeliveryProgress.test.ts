/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { formatBRL, freeDeliveryMessage, freeDeliveryProgress, type FreeDeliveryInput } from './freeDeliveryProgress.ts';
import type { CorePromotion } from '../../supabase/functions/_shared/promotion-core.ts';

// Sexta, 27/11/2026 15:00 em São Paulo (18:00 UTC)
const ctx = { now: new Date('2026-11-27T18:00:00Z'), timeZone: 'America/Sao_Paulo' };
const frete = (o: Partial<CorePromotion> = {}): CorePromotion => ({
  id: 'frete', type: 'free_delivery', scope: 'all_products', status: 'active', code: null,
  applies_to_delivery: true, applies_to_pickup: true, minimum_order_value: 50,
  start_date: '2026-11-01T03:00:00Z', end_date: null, ...o,
});
const input = (subtotal: number, o: Partial<FreeDeliveryInput> = {}): FreeDeliveryInput => ({
  deliveryType: 'delivery',
  items: [{ productId: 'burger', categoryId: 'lanches', unitPrice: subtotal, quantity: 1 }],
  ...o,
});

test('abaixo do mínimo: faltam R$ 12,40', () => {
  const p = freeDeliveryProgress([frete()], input(37.6), ctx);
  assert.deepEqual(p, { state: 'missing', missing: 12.4, minimum: 50, promotionId: 'frete' });
  assert.equal(freeDeliveryMessage(p), 'Faltam R$ 12,40 para frete grátis');
});

test('atingiu o mínimo: você ganhou frete grátis', () => {
  const p = freeDeliveryProgress([frete()], input(50), ctx);
  assert.equal(p.state, 'reached');
  assert.equal(freeDeliveryMessage(p), 'Você ganhou frete grátis');
});

test('sem promoção de frete grátis: nada', () => {
  const p = freeDeliveryProgress([frete({ type: 'percentage', discount_percentage: 10 })], input(10), ctx);
  assert.equal(freeDeliveryMessage(p), null);
});

test('respeita dia da semana, horário e validade (núcleo)', () => {
  assert.equal(freeDeliveryProgress([frete({ allowed_days: ['monday'] })], input(10), ctx).state, 'none');
  assert.equal(freeDeliveryProgress([frete({ start_time: '18:00', end_time: '23:00' })], input(10), ctx).state, 'none');
  assert.equal(freeDeliveryProgress([frete({ end_date: '2026-11-20T03:00:00Z' })], input(10), ctx).state, 'none');
  assert.equal(freeDeliveryProgress([frete({ status: 'paused' })], input(10), ctx).state, 'none');
});

test('retirada, mesa ou promoção só de retirada: nada', () => {
  assert.equal(freeDeliveryProgress([frete()], input(10, { deliveryType: 'pickup' }), ctx).state, 'none');
  assert.equal(freeDeliveryProgress([frete()], input(10, { deliveryType: 'table' }), ctx).state, 'none');
  assert.equal(freeDeliveryProgress([frete({ applies_to_delivery: false })], input(10), ctx).state, 'none');
});

test('cupom, 1ª compra não confirmada e limite de usos esgotado não são anunciados', () => {
  assert.equal(freeDeliveryProgress([frete({ code: 'FRETE' })], input(10), ctx).state, 'none');
  assert.equal(freeDeliveryProgress([frete({ first_order_only: true })], input(10), ctx).state, 'none');
  assert.equal(freeDeliveryProgress([frete({ first_order_only: true })], input(10), { ...ctx, isFirstOrder: true }).state, 'missing');
  assert.equal(freeDeliveryProgress([frete({ max_uses: 5, current_uses: 5 })], input(10), ctx).state, 'none');
});

test('promoção por categoria só conta se houver item da categoria', () => {
  const cat = frete({ scope: 'category', category_ids: ['bebidas'] });
  assert.equal(freeDeliveryProgress([cat], input(10), ctx).state, 'none');
  const withDrink = input(10, { items: [{ productId: 'refri', categoryId: 'bebidas', unitPrice: 6, quantity: 2 }] });
  assert.equal(freeDeliveryProgress([cat], withDrink, ctx).state, 'missing');
});

test('várias promoções: mostra a de menor valor que falta', () => {
  const p = freeDeliveryProgress([frete({ id: 'a', minimum_order_value: 100 }), frete({ id: 'b', minimum_order_value: 60 })], input(40), ctx);
  assert.deepEqual(p, { state: 'missing', missing: 20, minimum: 60, promotionId: 'b' });
});

test('outra promoção já aplicada: não promete frete grátis ao atingir', () => {
  assert.equal(freeDeliveryProgress([frete()], input(80, { appliedPromotionType: 'percentage' }), ctx).state, 'none');
  assert.equal(freeDeliveryProgress([frete()], input(80, { appliedPromotionType: 'free_delivery' }), ctx).state, 'reached');
});

test('carrinho vazio: nada', () => {
  assert.equal(freeDeliveryProgress([frete()], { deliveryType: 'delivery', items: [] }, ctx).state, 'none');
});

test('formatBRL', () => {
  assert.equal(formatBRL(12.4), 'R$ 12,40');
  assert.equal(formatBRL(1234.5), 'R$ 1.234,50');
  assert.equal(formatBRL(0.1 + 0.2), 'R$ 0,30');
});
