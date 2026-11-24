import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOrderPreference,
  isMercadoPagoOrder,
  orderPaymentMethodFrom,
  paidDetails,
  paymentSettlesOrder,
  safeReturnUrl,
} from '../../../supabase/functions/_shared/mercadopago-order.ts';

const order = { id: 'o1', order_number: 42, total: 59.9, customer_name: 'Ana', customer_email: null, customer_phone: '5561999998888' };

test('marca do pedido online', () => {
  assert.equal(isMercadoPagoOrder({ gateway: 'mercado_pago' }), true);
  assert.equal(isMercadoPagoOrder({ card_type: 'credit' }), false);
  assert.equal(isMercadoPagoOrder(null), false);
});

test('volta só para o Mostralo, prévias ou domínio da loja', () => {
  const fb = 'https://mostralo.com.br/loja/querencia/meus-pedidos';
  assert.equal(safeReturnUrl('https://mostralo.com.br/loja/querencia/meus-pedidos', 'querencia'), fb);
  assert.equal(safeReturnUrl('https://x.mostralo.pages.dev/loja/q/meus-pedidos', 'q'), 'https://x.mostralo.pages.dev/loja/q/meus-pedidos');
  assert.equal(safeReturnUrl('https://www.loja.com.br/meus-pedidos', 'q', 'www.loja.com.br'), 'https://www.loja.com.br/meus-pedidos');
  assert.equal(safeReturnUrl('https://evil.com/x', 'querencia'), fb);
  assert.equal(safeReturnUrl('http://mostralo.com.br/x', 'querencia'), fb);
  assert.equal(safeReturnUrl('https://mostralo.com.br.evil.com/', 'querencia'), fb);
  assert.equal(safeReturnUrl(123, 'querencia'), fb);
});

test('preferência usa o total do pedido e volta com o id', () => {
  const b = buildOrderPreference({ order, storeName: 'Querência', returnUrl: 'https://mostralo.com.br/loja/q/meus-pedidos', notificationUrl: 'https://n', expiresAt: '2026-11-25T00:00:00Z' }) as any;
  assert.equal(b.external_reference, 'order_o1');
  assert.equal(b.items[0].unit_price, 59.9);
  assert.equal(b.items[0].title, 'Pedido #42 - Querência');
  assert.equal(b.back_urls.success, 'https://mostralo.com.br/loja/q/meus-pedidos?pedido=o1');
  assert.deepEqual(b.payer.phone, { area_code: '61', number: '999998888' });
  assert.equal(b.statement_descriptor, 'Querencia');
  assert.deepEqual(b.payment_methods.excluded_payment_types, [{ id: 'ticket' }, { id: 'atm' }]);
});

test('só aprovado, do mesmo pedido e com valor cheio dá baixa', () => {
  const ok = { status: 'approved', external_reference: 'order_o1', transaction_amount: 59.9 };
  assert.equal(paymentSettlesOrder(ok, 'o1', 59.9), true);
  assert.equal(paymentSettlesOrder({ ...ok, transaction_amount: 1 }, 'o1', 59.9), false);
  assert.equal(paymentSettlesOrder({ ...ok, status: 'pending' }, 'o1', 59.9), false);
  assert.equal(paymentSettlesOrder({ ...ok, external_reference: 'order_o2' }, 'o1', 59.9), false);
});

test('forma de pagamento e detalhes', () => {
  assert.equal(orderPaymentMethodFrom({ payment_type_id: 'credit_card' }), 'card');
  assert.equal(orderPaymentMethodFrom({ payment_type_id: 'bank_transfer' }), 'pix');
  const d = paidDetails({ id: 9, payment_type_id: 'credit_card', installments: 3, transaction_amount: 59.9 });
  assert.equal(d.gateway, 'mercado_pago');
  assert.equal(d.mp_payment_id, '9');
  assert.equal(d.card_type, 'credit');
});
