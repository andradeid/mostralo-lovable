/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  calculateAddonsPrice, cartItemId, cartItemName, cartUnitPrice, displayPrices, nextAddonSelections,
  validateRequiredAddons, whatsAppOrderMessage,
} from './pricing.ts';
import { splitFlavorsFromId } from '../../../supabase/functions/_shared/pizza-flavors.ts';

const cat = (id: string, name: string, extra: Record<string, unknown>, addons: { id: string; name: string; price: number }[]) => ({
  id, name, min_selections: 0, max_selections: null as any, is_required: false, ...extra,
  addons: addons.map(a => ({ ...a, is_available: true, addon_category: {} as any })),
});
const molhos = cat('m', 'Molhos', { max_selections: 2 }, [{ id: 'bar', name: 'Barbecue', price: 2 }, { id: 'alho', name: 'Alho', price: 1.5 }]);
const extras = cat('e', 'Extras', { is_required: true, min_selections: 1 }, [{ id: 'bacon', name: 'Bacon', price: 5 }]);
const product = { id: 'p1', name: 'Pizza Calabresa', price: 40, slug: 'pizza', is_on_offer: false };
const offer = { ...product, is_on_offer: true, offer_price: 35 };
const grande = { id: 'v1', name: 'Grande', price: 50, is_available: true, is_default: true };
const noPf = { active: false, complete: true, price: null, mainPrice: null, label: '', otherIds: [] };
const pf = { active: true, complete: true, price: 55, mainPrice: 50, label: 'Calabresa / Frango', otherIds: ['fra'] };

test('total dos adicionais soma preço × quantidade de cada categoria', () => {
  assert.equal(calculateAddonsPrice([molhos, extras], { m: { bar: 2, alho: 1 }, e: { bacon: 1 } }), 2 * 2 + 1.5 + 5);
  assert.equal(calculateAddonsPrice([molhos], {}), 0);
});

test('obrigatório exige o mínimo da categoria', () => {
  assert.equal(validateRequiredAddons([molhos, extras], {}), false);
  assert.equal(validateRequiredAddons([molhos, extras], { e: { bacon: 1 } }), true);
});

test('adicional: soma, remove ao chegar a zero e respeita o máximo da categoria', () => {
  assert.deepEqual(nextAddonSelections(molhos, {}, 'bar', 1), { selections: { bar: 1 }, limitExceeded: null });
  assert.deepEqual(nextAddonSelections(molhos, { bar: 1 }, 'bar', -1), { selections: {}, limitExceeded: null });
  assert.deepEqual(nextAddonSelections(molhos, { bar: 1, alho: 1 }, 'alho', 1), { selections: null, limitExceeded: 2 });
  assert.deepEqual(nextAddonSelections(extras, { bacon: 7 }, 'bacon', 1), { selections: { bacon: 8 }, limitExceeded: null });
});

test('preço no carrinho: sabores > promoção > variação > oferta > preço', () => {
  assert.equal(cartUnitPrice(pf, 30, grande, product), 55);
  assert.equal(cartUnitPrice(noPf, 30, grande, product), 30);
  assert.equal(cartUnitPrice(noPf, null, grande, product), 50);
  assert.equal(cartUnitPrice(noPf, null, null, offer), 35);
  assert.equal(cartUnitPrice(noPf, null, null, product), 40);
});

test('preço na tela: pizza ainda sem todos os sabores mostra o preço do sabor principal', () => {
  assert.deepEqual(displayPrices({ ...pf, complete: false, price: null }, null, grande, product, 3), { singleFlavorPrice: 50, currentFinalPrice: 50, totalPrice: 53 });
  assert.equal(displayPrices(noPf, 45, grande, product, 2).totalPrice, 47);
});

test('nome e id do item: variação, adicionais por grupo e sabores no id', () => {
  const sel = { m: { bar: 2 }, e: { bacon: 1 } };
  assert.equal(cartItemName(noPf, product, grande, [molhos, extras], sel), 'Pizza Calabresa - Grande — Molhos: 2x Barbecue · Extras: Bacon');
  assert.equal(cartItemName(pf, product, null, [], {}), 'Calabresa / Frango');
  const id = cartItemId(product, grande, sel, pf.otherIds);
  assert.deepEqual(splitFlavorsFromId(id), { baseId: `p1_v1_${JSON.stringify(sel)}`, otherFlavorIds: ['fra'] });
  assert.equal(cartItemId(product, null, {}, []), 'p1_default_{}');
});

test('mensagem do WhatsApp: total com adicionais × quantidade e observações', () => {
  const msg = whatsAppOrderMessage(noPf, product, grande, [molhos], { m: { bar: 1 } }, 2, 'sem cebola');
  assert.match(msg, /^Olá! Gostaria de fazer um pedido:\n\n\*Pizza Calabresa\* - Grande\nMolhos: 1x Barbecue \(\+R\$\s2,00\)\nQuantidade: 2\nPreço: R\$\s104,00\nObservações: sem cebola\n\nPoderia me ajudar\?$/);
});
