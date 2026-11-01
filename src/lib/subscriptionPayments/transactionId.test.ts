import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractTransactionId } from './transactionId.ts';

test('pega o EndToEndId de notas em JSON', () => {
  assert.equal(extractTransactionId(JSON.stringify({ EndToEndId: 'E123' })), 'E123');
  assert.equal(extractTransactionId(JSON.stringify({ endToEndId: 'E456' })), 'E456');
  assert.equal(extractTransactionId(JSON.stringify({ e2eId: 'E789' })), 'E789');
  assert.equal(extractTransactionId(JSON.stringify({ outro: 1 })), null);
});

test('acha o ID em texto livre (letras e números depois do E)', () => {
  const id = 'E18236120202611011234abcDEF5678';
  assert.equal(extractTransactionId(`Pago via Pix ${id} ok`), id);
  assert.equal(extractTransactionId('EndToEndId: abc123'), 'abc123');
});

test('sem notas ou sem ID devolve null', () => {
  assert.equal(extractTransactionId(null), null);
  assert.equal(extractTransactionId(''), null);
  assert.equal(extractTransactionId('pago no dinheiro'), null);
});
