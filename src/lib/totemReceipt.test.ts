/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { brl } from './brl.ts';
import { buildTotemReceipt, formatReceiptDateTime, itemLineTotal } from './totemReceipt.ts';

const paidAt = new Date('2026-11-27T18:05:00Z'); // 15:05 em São Paulo

test('monta o recibo com itens, adicionais, observação, total cobrado e data/hora', () => {
  const r = buildTotemReceipt({
    storeName: ' Lanchonete do Zé ',
    passwordNumber: '42',
    items: [
      { name: 'X-Burguer', price: 20, quantity: 2, addons: [{ name: 'Bacon', price: 4 }], notes: ' sem cebola ' },
      { name: 'Refri', price: 6, quantity: 1 },
    ],
    total: 54,
    paidAt,
    timeZone: 'America/Sao_Paulo',
  });
  assert.equal(r.storeName, 'Lanchonete do Zé');
  assert.equal(r.passwordNumber, '42');
  assert.equal(r.dateTime, '27/11/2026 15:05');
  assert.deepEqual(r.lines[0], { label: '2x X-Burguer', amount: brl(48), details: ['+ Bacon', 'Obs.: sem cebola'] });
  assert.deepEqual(r.lines[1], { label: '1x Refri', amount: brl(6), details: [] });
  assert.equal(r.total, brl(54));
});

test('sem total cobrado usa a soma dos itens', () => {
  const r = buildTotemReceipt({ storeName: 'Loja', passwordNumber: '7', items: [{ name: 'A', price: 2.5, quantity: 3 }], paidAt, timeZone: 'UTC' });
  assert.equal(r.total, brl(7.5));
  assert.equal(r.dateTime, formatReceiptDateTime(paidAt, 'UTC'));
});

test('valor da linha com adicionais', () => {
  assert.equal(itemLineTotal({ name: 'x', price: 10, quantity: 2, addons: [{ name: 'a', price: 1.5 }] }), 23);
});
