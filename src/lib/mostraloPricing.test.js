import { describe, expect, test } from 'bun:test';
import { founderAvailability, publicPlanOrder, savingsForPlan, FOUNDER_PRICE } from './mostraloPricing';

describe('Mostralo pricing rules', () => {
  const plans = [
    { name: 'Sob medida', price: 597, status: 'active' },
    { name: 'Essencial Anual', price: 397.9, status: 'active' },
    { name: 'Completo', price: 347, status: 'active' },
    { name: 'Essencial', price: 197, status: 'active' },
    { name: 'Agenda', price: 197, status: 'active' },
  ];
  test('shows the four current plans in service order and excludes the legacy annual plan', () => {
    expect(publicPlanOrder(plans).map(p => [p.name, p.price])).toEqual([
      ['Agenda', 197], ['Essencial', 197], ['Completo', 347], ['Sob medida', 597],
    ]);
  });
  test('retail prioritizes Essencial', () => {
    expect(publicPlanOrder(plans, 'Essencial').map(p => p.name)).toEqual(['Essencial', 'Agenda', 'Completo', 'Sob medida']);
  });
  test('inactive plans are not offered', () => {
    expect(publicPlanOrder([{ name: 'Agenda', status: 'inactive' }])).toEqual([]);
  });
  test('economy uses the supplied plan price, not a fixed monthly fee', () => {
    expect(savingsForPlan(10000, 197)).toEqual({ fee: 2500, monthly: 2303, annual: 27636, daily: 2303 / 30 });
    expect(savingsForPlan(10000, 347).monthly).toBe(2153);
  });
  test('ten founder stores exhaust availability regardless of status or malformed suffix', () => {
    expect(founderAvailability(Array.from({ length: 10 }, (_, i) => `Sócio fundador ${i + 1}/10`))).toEqual({ count: 10, remaining: 0, nextNumber: null });
  });
  test('founder number uses the first unused slot and the agreed 129 price', () => {
    expect(FOUNDER_PRICE).toBe(129);
    expect(founderAvailability(['Sócio fundador 1/10', 'Sócio fundador 3/10', null, 'Outro desconto'])).toEqual({ count: 2, remaining: 8, nextNumber: 2 });
  });
});