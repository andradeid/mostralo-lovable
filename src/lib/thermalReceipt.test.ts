/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { encodeText, stripAccents, toBase64 } from './thermal/escpos';
import { forgetPrint, isDuplicatePrint } from './thermal/dedupe';
import { brl, buildReceipt, paymentText, twoCols, wrap, type Order } from './thermal/receipt';

test('acentos em PC850 e sem acentos', () => {
  assert.deepEqual(encodeText('ção'), [0x87, 0xc6, 0x6f]);
  assert.equal(stripAccents('Pão de açúcar'), 'Pao de acucar');
  assert.deepEqual(encodeText('ção', true), [0x63, 0x61, 0x6f]);
});

test('colunas e quebra de linha', () => {
  assert.deepEqual(wrap('um dois tres quatro', 9), ['um dois', 'tres', 'quatro']);
  const [l] = twoCols('Coca', 'R$ 5,00', 20);
  assert.equal(l.length, 20);
  assert.ok(l.endsWith('R$ 5,00'));
});

test('dinheiro e pagamento', () => {
  assert.equal(brl(1234.5), 'R$ 1.234,50');
  assert.equal(paymentText('cash', { change_for: 100 }), 'Dinheiro (troco para R$ 100,00)');
  assert.equal(paymentText('card', { card_type: 'debit' }), 'Cartão de débito');
});

test('via do pedido tem número, itens, total e corte', () => {
  const order: Order = { id: 'o1', order_number: '0012', customer_name: 'Ana', customer_phone: '61999990000', customer_address: 'Quadra 1', delivery_type: 'delivery', payment_method: 'pix', subtotal: 40, delivery_fee: 5, total: 45, created_at: '2026-10-28T17:00:00Z' };
  const bytes = buildReceipt(order, [{ id: 'i1', product_name: 'X-Bacon', quantity: 2, subtotal: 40 }], [{ order_item_id: 'i1', addon_name: 'Cheddar', quantity: 1, subtotal: 4 }], { paper: 58, storeName: 'Casa Brasa' });
  const text = Buffer.from(bytes).toString('latin1');
  for (const s of ['PEDIDO #0012', 'ENTREGA', '2x X-Bacon', '+ Cheddar', 'R$ 45,00', 'Pix', '28/10/2026 14:00']) assert.ok(text.includes(s), s);
  assert.deepEqual([...bytes.slice(-4)], [0x1d, 0x56, 0x42, 0x00]);
  assert.ok(toBase64(bytes).length > 10);
});

test('não imprime duas vezes o mesmo pedido em 20 s', () => {
  const seen = new Map<string, number>();
  assert.equal(isDuplicatePrint('a', 1000, seen), false);
  assert.equal(isDuplicatePrint('a', 15000, seen), true);
  assert.equal(isDuplicatePrint('a', 22000, seen), false);
  forgetPrint('a', seen);
  assert.equal(isDuplicatePrint('a', 23000, seen), false);
});
