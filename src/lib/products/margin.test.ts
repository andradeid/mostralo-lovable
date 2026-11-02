/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { calculateMargin, effectiveSalePrice, formatMargin, stockValue } from './margin.ts';

test('preço de venda: oferta ligada e menor que o preço vale; senão, o preço', () => {
  assert.equal(effectiveSalePrice({ price: 20, is_on_offer: true, offer_price: 15 }), 15);
  assert.equal(effectiveSalePrice({ price: 20, is_on_offer: false, offer_price: 15 }), 20);
  assert.equal(effectiveSalePrice({ price: 20, is_on_offer: true, offer_price: 0 }), 20);
  assert.equal(effectiveSalePrice({ price: '12.50', is_on_offer: null, offer_price: null }), 12.5);
});

test('margem sobre o preço de venda e lucro por unidade', () => {
  assert.deepEqual(calculateMargin(20, 11.6), { profit: 8.4, percent: 42 });
  assert.deepEqual(calculateMargin(3, 1), { profit: 2, percent: 66.7 });
  assert.deepEqual(calculateMargin(10, 0), { profit: 10, percent: 100 });
});

test('sem custo ou sem preço não há margem', () => {
  assert.equal(calculateMargin(20, null), null);
  assert.equal(calculateMargin(20, undefined), null);
  assert.equal(calculateMargin(0, 5), null);
});

test('texto da margem, com prejuízo quando o custo passa do preço', () => {
  assert.equal(formatMargin(calculateMargin(20, 11.6)), 'Margem: 42% · lucro R$ 8,40');
  assert.equal(formatMargin(calculateMargin(3, 1)), 'Margem: 66,7% · lucro R$ 2,00');
  assert.equal(formatMargin(calculateMargin(10, 12)), 'Margem: -20% · prejuízo R$ 2,00');
  assert.equal(formatMargin(null), '');
});

test('valor em estoque = estoque × custo (estoque negativo conta como zero)', () => {
  assert.equal(stockValue(12, 2.5), 30);
  assert.equal(stockValue(-3, 2.5), 0);
  assert.equal(stockValue(5, null), null);
});
