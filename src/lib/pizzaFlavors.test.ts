import { test } from 'node:test';
import assert from 'node:assert';
import {
  checkFlavors, combinePrices, flavorPrice, flavorsLabel, maxFlavors, splitFlavorsFromId, withFlavorsInId,
} from '../../supabase/functions/_shared/pizza-flavors.ts';

const S = 'loja';
const cfg = { multi_flavor_enabled: true, multi_flavor_pricing: 'average', multi_flavor_max: { Broto: 1, Grande: 3 } };
const calabresa = { id: 'cal', name: 'Calabresa', store_id: S, category_id: 'pz', price: 40 };
const frango = { id: 'fra', name: 'Frango com Catupiry', store_id: S, category_id: 'pz', price: 45 };
const port = { id: 'por', name: 'Portuguesa', store_id: S, category_id: 'pz', price: 42 };
const doce = { id: 'doc', name: 'Chocolate', store_id: S, category_id: 'doces', price: 50 };
const variants = [
  { product_id: 'cal', name: 'Grande', price: 49.9 }, { product_id: 'cal', name: 'Broto', price: 34.9 },
  { product_id: 'fra', name: 'Grande', price: 59.9 },
  { product_id: 'por', name: 'Grande', price: 54.9 },
  { product_id: 'doc', name: 'Grande', price: 60 },
];

test('média: 49,90 + 59,90 = 54,90', () => {
  assert.strictEqual(combinePrices([49.9, 59.9], 'average'), 54.9);
});
test('mais caro: 49,90 + 59,90 = 59,90', () => {
  assert.strictEqual(combinePrices([49.9, 59.9], 'highest'), 59.9);
});
test('3 sabores arredonda no centavo', () => {
  assert.strictEqual(combinePrices([54.9, 44.9, 62.9], 'average'), 54.23);
});
test('limite por tamanho, com padrão 2', () => {
  assert.strictEqual(maxFlavors(cfg, 'Broto'), 1);
  assert.strictEqual(maxFlavors(cfg, 'grande'), 3);
  assert.strictEqual(maxFlavors(cfg, 'Média'), 2);
  assert.strictEqual(maxFlavors({ multi_flavor_enabled: false }, 'Grande'), 1);
});
test('preço do sabor: variação do mesmo tamanho; sem tamanho, preço/oferta', () => {
  assert.strictEqual(flavorPrice(frango, variants, 'Grande'), 59.9);
  assert.strictEqual(flavorPrice(frango, variants, 'Broto'), null);
  assert.strictEqual(flavorPrice({ ...frango, is_on_offer: true, offer_price: 39 }, [], null), 39);
});
test('pizza montada: preço, frações e nome', () => {
  const r = checkFlavors({ main: calabresa, others: [frango], sizeName: 'Grande', variants, config: cfg, storeId: S });
  assert.ok(r.ok);
  if (r.ok) {
    assert.strictEqual(r.price, 54.9);
    assert.strictEqual(r.label, '1/2 Calabresa + 1/2 Frango com Catupiry');
    assert.deepStrictEqual(r.flavors.map((f) => f.fraction), [0.5, 0.5]);
  }
});
test('recusa: desligado, sabores demais, outra categoria, tamanho que o sabor não tem', () => {
  const base = { main: calabresa, sizeName: 'Grande', variants, storeId: S };
  assert.strictEqual(checkFlavors({ ...base, others: [frango], config: { multi_flavor_enabled: false } }).ok, false);
  assert.strictEqual(checkFlavors({ ...base, others: [frango, port, frango], config: cfg }).ok, false);
  assert.strictEqual(checkFlavors({ ...base, others: [doce], config: cfg }).ok, false);
  assert.strictEqual(checkFlavors({ ...base, sizeName: 'Broto', others: [frango], config: { ...cfg, multi_flavor_max: { '*': 2 } } }).ok, false);
});
test('id do carrinho leva os outros sabores e volta igual', () => {
  const id = withFlavorsInId('cal_v1_{"g":{"a":1}}', ['fra', 'por']);
  assert.deepStrictEqual(splitFlavorsFromId(id), { baseId: 'cal_v1_{"g":{"a":1}}', otherFlavorIds: ['fra', 'por'] });
  assert.deepStrictEqual(splitFlavorsFromId('cal'), { baseId: 'cal', otherFlavorIds: [] });
  assert.strictEqual(flavorsLabel(['A']), 'A');
});
