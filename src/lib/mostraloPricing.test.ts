/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { publicPlanOrder, founderAvailability, savingsForPlan, FOUNDER_PRICE } from './mostraloPricing';

test('service catalog ordering and actual current prices', () => {
  const plans = [{ name: 'Sob medida', price: 597 }, { name: 'Essencial Anual', price: 397.9 }, { name: 'Completo', price: 347 }, { name: 'Essencial', price: 197 }, { name: 'Agenda', price: 197 }];
  assert.deepEqual(publicPlanOrder(plans).map(p => [p.name, p.price]), [['Agenda', 197], ['Essencial', 197], ['Completo', 347], ['Sob medida', 597]]);
});
test('retail starts with Essencial', () => {
  assert.deepEqual(publicPlanOrder([{ name: 'Agenda' }, { name: 'Essencial' }], 'Essencial').map(p => p.name), ['Essencial', 'Agenda']);
});
test('inactive plans are excluded', () => {
  assert.deepEqual(publicPlanOrder([{ name: 'Agenda', status: 'inactive' }]), []);
});
test('economy changes with actual plan price', () => {
  assert.equal(savingsForPlan(10000, 197).monthly, 2303);
  assert.equal(savingsForPlan(10000, 347).monthly, 2153);
});
test('founder discount is 129 and picks next free number', () => {
  assert.equal(FOUNDER_PRICE, 129);
  assert.deepEqual(founderAvailability(['Sócio fundador 1/10', 'Sócio fundador 3/10', 'Outro']), { count: 2, remaining: 8, nextNumber: 2 });
});
test('ten founder stores block the offer', () => {
  assert.deepEqual(founderAvailability(Array.from({ length: 10 }, (_, i) => `Sócio fundador ${i + 1}/10`)), { count: 10, remaining: 0, nextNumber: null });
});