/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { canRequestPayout, formatIsoDate, payoutDateForCycle, payoutScheduleText } from './partnerPayout';

test('ciclo é pago no dia 15 do mês seguinte', () => {
  assert.equal(payoutDateForCycle(10, 2026), '2026-11-15');
  assert.equal(payoutDateForCycle(12, 2026), '2027-01-15');
  assert.equal(payoutDateForCycle(1, 2027), '2027-02-15');
});

test('data sem deslocar pelo fuso', () => {
  assert.equal(formatIsoDate('2026-11-15'), '15/11/2026');
  assert.equal(formatIsoDate('2026-11-15T13:00:00.000Z'), '15/11/2026');
  assert.equal(formatIsoDate('2026-11-01T02:30:00.000Z'), '31/10/2026'); // 23h30 em Brasília
  assert.equal(formatIsoDate(null), '');
});

test('frase do pagamento por situação', () => {
  assert.equal(payoutScheduleText({ status: 'open', cycle_month: 10, cycle_year: 2026 }), 'Pagamento em 15/11/2026');
  assert.equal(payoutScheduleText({ status: 'pending', cycle_month: 10, cycle_year: 2026, scheduled_payment_date: '2026-11-15' }), 'Pagamento em 15/11/2026');
  assert.equal(payoutScheduleText({ status: 'paid', cycle_month: 10, cycle_year: 2026, paid_at: '2026-11-15T13:00:00Z' }), 'Pago em 15/11/2026');
  assert.equal(payoutScheduleText({ status: 'rejected', cycle_month: 10, cycle_year: 2026 }), 'Pagamento recusado');
});

test('só pede pagamento de mês fechado com valor', () => {
  assert.equal(canRequestPayout({ status: 'pending', grand_total: '12.90' }), true);
  assert.equal(canRequestPayout({ status: 'open', grand_total: 12.9 }), false);
  assert.equal(canRequestPayout({ status: 'pending', grand_total: 0 }), false);
  assert.equal(canRequestPayout({ status: 'requested', grand_total: 50 }), false);
});
