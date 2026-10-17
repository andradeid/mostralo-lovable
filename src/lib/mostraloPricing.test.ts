/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { publicPlanOrder, founderAvailability, savingsForPlan, FOUNDER_PRICE, calculateAnnualPricing, resolveStoreBilling } from './mostraloPricing';
import { selectedBillingCycle } from '../../supabase/functions/_shared/billing-selection';

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
test('annual offer discounts monthly price by 30 percent then multiplies by twelve', () => {
  assert.deepEqual(calculateAnnualPricing(197, 30), { monthly: 137.9, annual: 1654.8, savings: 709.2, discountPercent: 30 });
});
test('annual total uses rounded monthly amount', () => {
  assert.deepEqual(calculateAnnualPricing(197.01, 30), { monthly: 137.91, annual: 1654.92, savings: 709.2, discountPercent: 30 });
});
test('annual discount is limited to zero through ninety', () => {
  assert.equal(calculateAnnualPricing(197, -1).monthly, 197);
  assert.equal(calculateAnnualPricing(197, 91).monthly, 19.7);
});
test('explicit annual store invoices use twelve discounted months', () => {
  assert.deepEqual(resolveStoreBilling({ price: 197, annual_enabled: true, annual_discount_percent: 30, billing_cycle: 'monthly' }, 'annual', null), { amount: 1654.8, intervalMonths: 12, annual: true, cycle: 'annual' });
});
test('annual negotiated monthly price is multiplied by twelve without another discount', () => {
  assert.equal(resolveStoreBilling({ price: 197, annual_enabled: true, annual_discount_percent: 30, billing_cycle: 'monthly' }, 'annual', 129).amount, 1548);
});
test('explicit monthly invoices ignore legacy plan interval and preserve custom value', () => {
  assert.deepEqual(resolveStoreBilling({ price: 197, billing_cycle: 'annual' }, 'monthly', 129), { amount: 129, intervalMonths: 1, annual: false, cycle: 'monthly' });
});
test('null store cycle retains existing plan intervals and invoice amounts', () => {
  for (const [cycle, months] of [['monthly', 1], ['quarterly', 3], ['biannual', 6], ['annual', 12]] as const) {
    assert.deepEqual(resolveStoreBilling({ price: 197, annual_enabled: true, annual_discount_percent: 30, billing_cycle: cycle }, null, null), { amount: 197, intervalMonths: months, annual: false, cycle });
  }
});
test('annual discount is not applied to disabled annual offers', () => {
  assert.equal(resolveStoreBilling({ price: 197, annual_enabled: false, billing_cycle: 'monthly' }, 'annual', null).amount, 197);
});
test('new approval cycle metadata leaves historical notes untouched', () => {
  assert.equal(selectedBillingCycle('Upgrade de plano\n[billing_cycle:annual]'), 'annual');
  assert.equal(selectedBillingCycle('Renovação de assinatura'), null);
});