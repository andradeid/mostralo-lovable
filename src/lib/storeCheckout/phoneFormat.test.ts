import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCustomerPhone } from './phoneFormat.ts';

test('tira o 55 do cadastro', () => {
  assert.equal(formatCustomerPhone('5561994009368'), '(61) 99400-9368');
});
test('celular digitado', () => {
  assert.equal(formatCustomerPhone('61994009368'), '(61) 99400-9368');
});
test('fixo', () => {
  assert.equal(formatCustomerPhone('6132345678'), '(61) 3234-5678');
});
test('digitando aos poucos', () => {
  assert.equal(formatCustomerPhone('6199'), '6199'); // igual ao comportamento anterior
});
