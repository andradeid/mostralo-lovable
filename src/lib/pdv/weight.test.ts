/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  buildWeightedItem,
  formatKg,
  parseWeightKg,
  productPdvFields,
  stripWeightSuffix,
  weightedItemName,
  weightPrice,
} from './weight.ts';

const kgOf = (s: string) => {
  const r = parseWeightKg(s);
  assert.ok(r.ok, `esperava peso válido para "${s}"`);
  return r.ok ? r.kg : NaN;
};

test('peso: vírgula, ponto, sem zero à esquerda e "kg" no fim', () => {
  assert.equal(kgOf('0,450'), 0.45);
  assert.equal(kgOf('0.450'), 0.45);
  assert.equal(kgOf(',5'), 0.5);
  assert.equal(kgOf('1'), 1);
  assert.equal(kgOf(' 2,5 kg '), 2.5);
  assert.equal(kgOf('1,25'), 1.25);
  assert.equal(kgOf('0,001'), 0.001);
  assert.equal(kgOf('50'), 50);
});

test('peso: zero, vazio, texto, duas vírgulas, mais de 3 casas e limites são inválidos', () => {
  for (const s of ['', '  ', '0', '0,000', ',', 'abc', '1,2,3', '1.2,3', '-1', '0,0005', '50,001', '120']) {
    const r = parseWeightKg(s);
    assert.equal(r.ok, false, `"${s}" deveria ser inválido`);
  }
  assert.deepEqual(parseWeightKg('0'), { ok: false, error: 'O peso precisa ser maior que zero' });
  assert.deepEqual(parseWeightKg('51'), { ok: false, error: 'Peso máximo: 50 kg' });
  assert.deepEqual(parseWeightKg('0,1234'), { ok: false, error: 'Use no máximo 3 casas (gramas)' });
});

test('valor: peso × preço do kg arredondado em centavos (meio centavo sobe)', () => {
  assert.equal(weightPrice(0.45, 12.9), 5.81); // 5,805
  assert.equal(weightPrice(0.333, 10), 3.33);
  assert.equal(weightPrice(1, 19.99), 19.99);
  assert.equal(weightPrice(0.125, 39.9), 4.99); // 4,9875
  assert.equal(weightPrice(2.5, 0.01), 0.03); // 0,025
  assert.equal(weightPrice(0.001, 1), 0); // 0,001 → menos de meio centavo
  assert.equal(weightPrice(0, 10), 0);
  // sem erro de ponto flutuante
  assert.equal(weightPrice(0.3, 0.1 + 0.2), 0.09);
});

test('nome e item do carrinho do produto pesado', () => {
  assert.equal(formatKg(0.45), '0,450');
  assert.equal(formatKg(12), '12,000');
  assert.equal(weightedItemName('Pão francês', 0.45), 'Pão francês (0,450 kg)');
  assert.equal(stripWeightSuffix('Pão francês (0,450 kg)'), 'Pão francês');
  assert.equal(stripWeightSuffix('Queijo (meia) (12,000 kg)'), 'Queijo (meia)');
  assert.equal(stripWeightSuffix('Coca 2L'), 'Coca 2L');
  assert.deepEqual(buildWeightedItem({ id: 'p1', name: 'Pão francês', price: 12.9, image_url: null }, 0.45), {
    product_id: 'p1',
    product_name: 'Pão francês (0,450 kg)',
    image_url: undefined,
    unit_price: 5.81,
    quantity: 1,
    weight_kg: 0.45,
    price_per_kg: 12.9,
  });
});

test('campos do PDV no produto: por quilo desliga o controle de estoque', () => {
  assert.deepEqual(productPdvFields({}), { sold_by_weight: false, pdv_shortcut: false });
  assert.deepEqual(productPdvFields({ pdv_shortcut: true }), { sold_by_weight: false, pdv_shortcut: true });
  assert.deepEqual(productPdvFields({ sold_by_weight: true }), {
    sold_by_weight: true,
    pdv_shortcut: false,
    track_stock: false,
    stock_quantity: null,
  });
});
