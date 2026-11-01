import { test } from 'node:test';
import assert from 'node:assert';
import { invoicePayPath } from './invoiceLinks';

test('fatura com token usa /pagar', () => {
  assert.strictEqual(invoicePayPath({ id: 'abc', public_token: 'tok' }), '/pagar/tok');
});
test('fatura sem token cai no link antigo', () => {
  assert.strictEqual(invoicePayPath({ id: 'abc', public_token: null }), '/invoice-payment/abc');
  assert.strictEqual(invoicePayPath({ id: 'abc' }), '/invoice-payment/abc');
});
