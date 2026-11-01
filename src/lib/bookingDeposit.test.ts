/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  calculateBookingDeposit, normalizeDepositMode, normalizeDepositTimeout, depositCommissionPercent,
  isDepositPending, hasDepositFlow, depositPaidEnough, remainingAfterDeposit, buildStoreDepositMessage,
} from '../../supabase/functions/_shared/booking-deposit.ts';

const on = { require_deposit: true, default_deposit_percentage: 30 };

test('sinal desligado na loja = sem sinal, mesmo com sinal no serviço', () => {
  assert.equal(calculateBookingDeposit({ require_deposit: false, default_deposit_percentage: 30 }, { price: 100, requires_deposit: true, deposit_amount: 20 }), 0);
  assert.equal(calculateBookingDeposit(null, { price: 100 }), 0);
});

test('valor fixo do serviço vem primeiro', () => {
  assert.equal(calculateBookingDeposit(on, { price: 100, requires_deposit: true, deposit_amount: 25, deposit_percentage: 50 }), 25);
});

test('depois a % do serviço', () => {
  assert.equal(calculateBookingDeposit(on, { price: 80, requires_deposit: true, deposit_amount: 0, deposit_percentage: 50 }), 40);
});

test('senão a % padrão da loja (inclusive serviço sem sinal próprio com valores antigos)', () => {
  assert.equal(calculateBookingDeposit(on, { price: 100 }), 30);
  assert.equal(calculateBookingDeposit(on, { price: 100, requires_deposit: false, deposit_amount: 99 }), 30);
});

test('arredonda no centavo', () => {
  assert.equal(calculateBookingDeposit({ require_deposit: true, default_deposit_percentage: 33 }, { price: 45.5 }), 15.02);
  assert.equal(calculateBookingDeposit({ require_deposit: true, default_deposit_percentage: 15 }, { price: '49.90' }), 7.49);
  assert.equal(calculateBookingDeposit(on, { price: 0.1 }), 0.03);
});

test('serviço grátis ou % zero = sem sinal', () => {
  assert.equal(calculateBookingDeposit(on, { price: 0 }), 0);
  assert.equal(calculateBookingDeposit({ require_deposit: true, default_deposit_percentage: 0 }, { price: 100 }), 0);
  assert.equal(calculateBookingDeposit({ require_deposit: true, default_deposit_percentage: null }, { price: 100 }), 0);
});

test('nunca passa do preço e ignora % fora de 0–100', () => {
  assert.equal(calculateBookingDeposit(on, { price: 50, requires_deposit: true, deposit_amount: 80 }), 50);
  assert.equal(calculateBookingDeposit({ require_deposit: true, default_deposit_percentage: 150 }, { price: 50 }), 50);
  assert.equal(calculateBookingDeposit({ require_deposit: true, default_deposit_percentage: -10 }, { price: 50 }), 0);
});

test('modo, prazo e taxa normalizados', () => {
  assert.equal(normalizeDepositMode('mostralo'), 'mostralo');
  assert.equal(normalizeDepositMode(undefined), 'store');
  assert.equal(normalizeDepositMode('x'), 'store');
  assert.equal(normalizeDepositTimeout(undefined), 15);
  assert.equal(normalizeDepositTimeout(2), 5);
  assert.equal(normalizeDepositTimeout(90), 60);
  assert.equal(normalizeDepositTimeout('20'), 20);
  assert.equal(depositCommissionPercent(null), 7);
  assert.equal(depositCommissionPercent(4.5), 4.5);
  assert.equal(depositCommissionPercent(0), 0);
  assert.equal(depositCommissionPercent(500), 7);
});

test('sinal pendente só para reserva do fluxo de sinal, não paga e não cancelada', () => {
  assert.equal(isDepositPending({ status: 'pending', deposit_mode: 'store', deposit_amount: 20, deposit_paid: false }), true);
  assert.equal(isDepositPending({ status: 'pending', deposit_mode: 'mostralo', deposit_amount: '20.00', deposit_paid: false }), true);
  assert.equal(isDepositPending({ status: 'confirmed', deposit_mode: 'store', deposit_amount: 20, deposit_paid: true }), false);
  assert.equal(isDepositPending({ status: 'cancelled', deposit_mode: 'mostralo', deposit_amount: 20, deposit_paid: false }), false);
  // Reservas antigas / feitas no painel: sem deposit_mode, nada muda
  assert.equal(isDepositPending({ status: 'pending', deposit_mode: null, deposit_amount: 20, deposit_paid: false }), false);
  assert.equal(hasDepositFlow({ deposit_mode: 'store', deposit_amount: 0 }), false);
});

test('valor recebido x sinal (tolerância de 1 centavo)', () => {
  assert.equal(depositPaidEnough('15.00', 15), true);
  assert.equal(depositPaidEnough('14.99', 15), true);
  assert.equal(depositPaidEnough('14.98', 15), false);
  assert.equal(depositPaidEnough(20, '15.02'), true);
});

test('cobrança do restante desconta o sinal pago', () => {
  assert.equal(remainingAfterDeposit(100, { deposit_paid: true, deposit_amount: 30 }), 70);
  assert.equal(remainingAfterDeposit(100, { deposit_paid: false, deposit_amount: 30 }), 100);
  assert.equal(remainingAfterDeposit(100, null), 100);
  assert.equal(remainingAfterDeposit(30, { deposit_paid: true, deposit_amount: 30 }), 0);
});

test('mensagem do Pix da loja tem chave, valor e dados do horário', () => {
  const msg = buildStoreDepositMessage({
    customerName: 'Ana', serviceName: 'Corte', professionalName: 'Carlos', date: '2026-11-27', time: '14:30:00',
    amount: 15, pixKey: 'pix@loja.com', pixKeyType: 'email', recipientName: 'Loja da Ana', storeName: 'Barbearia X',
  });
  assert.match(msg, /Sinal: \*R\$\s15,00\*/);
  assert.match(msg, /Pix \(E-mail\): \*pix@loja\.com\*/);
  assert.match(msg, /Data: 27\/11\/2026 às 14:30/);
  assert.match(msg, /Favorecido: Loja da Ana/);
  assert.match(msg, /Barbearia X conferir/);
  const short = buildStoreDepositMessage({ amount: 10, pixKey: 'abc' });
  assert.ok(!short.includes('Serviço:'));
  assert.ok(!short.includes('Favorecido'));
  assert.ok(!/\n\n\n/.test(short));
});
