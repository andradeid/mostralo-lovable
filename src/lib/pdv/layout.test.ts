/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { deviceLayoutKey, isPdvLayout, resolvePdvLayout } from './layout.ts';
import { parseQuantity, pdvHotkeyAction } from './hotkeys.ts';
import { lastCartItem, mergeScannedItem } from './cartScan.ts';

test('modo do PDV: computador > loja > grade', () => {
  assert.equal(resolvePdvLayout('list', null), 'list');
  assert.equal(resolvePdvLayout('list', 'mixed'), 'mixed');
  assert.equal(resolvePdvLayout(undefined, undefined), 'grid');
  assert.equal(resolvePdvLayout('xpto', 'outro'), 'grid');
  assert.equal(resolvePdvLayout('mixed', 'lixo'), 'mixed');
  assert.ok(isPdvLayout('grid') && !isPdvLayout('GRID') && !isPdvLayout(1));
  assert.equal(deviceLayoutKey('abc'), 'mostralo:pdv-layout:abc');
});

const free = { dialogOpen: false, editableFocused: false, searchFocused: false };

test('atalhos: F2/F3/F4/Delete sem diálogo nem campo de texto', () => {
  assert.equal(pdvHotkeyAction({ key: 'F2' }, free), 'quantity');
  assert.equal(pdvHotkeyAction({ key: 'F3' }, free), 'search');
  assert.equal(pdvHotkeyAction({ key: 'F4' }, free), 'pay');
  assert.equal(pdvHotkeyAction({ key: 'Delete' }, free), 'removeLast');
  assert.equal(pdvHotkeyAction({ key: 'Enter' }, free), null);
  assert.equal(pdvHotkeyAction({ key: '7' }, free), null);
  assert.equal(pdvHotkeyAction({ key: 'F5' }, free), null);
});

test('atalhos: diálogo aberto, modificadores, repetição e campos de texto', () => {
  assert.equal(pdvHotkeyAction({ key: 'F4' }, { ...free, dialogOpen: true }), null);
  assert.equal(pdvHotkeyAction({ key: 'F4', ctrlKey: true }, free), null);
  assert.equal(pdvHotkeyAction({ key: 'Delete', repeat: true }, free), null);
  assert.equal(pdvHotkeyAction({ key: 'Delete', shiftKey: true }, free), null);
  // campo comum: nada
  assert.equal(pdvHotkeyAction({ key: 'F4' }, { ...free, editableFocused: true }), null);
  assert.equal(pdvHotkeyAction({ key: 'Delete' }, { ...free, editableFocused: true }), null);
  // busca do PDV: F2–F4 valem, Delete apaga texto
  const search = { ...free, editableFocused: true, searchFocused: true };
  assert.equal(pdvHotkeyAction({ key: 'F4' }, search), 'pay');
  assert.equal(pdvHotkeyAction({ key: 'F2' }, search), 'quantity');
  assert.equal(pdvHotkeyAction({ key: 'Delete' }, search), null);
});

test('quantidade do F2: inteiro de 1 a 999', () => {
  assert.deepEqual(parseQuantity(' 3 '), { ok: true, quantity: 3 });
  assert.equal(parseQuantity('0').ok, false);
  assert.equal(parseQuantity('1,5').ok, false);
  assert.equal(parseQuantity('').ok, false);
  assert.equal(parseQuantity('1000').ok, false);
});

test('último item: a linha mexida por último, inclusive quando a leitura soma numa linha antiga', () => {
  let n = 0;
  const id = () => `l${++n}`;
  let cart = mergeScannedItem([], { product_id: 'a', unit_price: 2, quantity: 1 }, id, 1);
  cart = mergeScannedItem(cart, { product_id: 'b', unit_price: 3, quantity: 1 }, id, 2);
  assert.equal(lastCartItem(cart)?.product_id, 'b');
  cart = mergeScannedItem(cart, { product_id: 'a', unit_price: 2, quantity: 1 }, id, 3);
  assert.equal(cart.length, 2);
  assert.equal(lastCartItem(cart)?.product_id, 'a');
  assert.equal(lastCartItem(cart)?.quantity, 2);
  assert.equal(lastCartItem([]), null);
  // sem carimbo: a de baixo
  assert.equal(lastCartItem([{ id: 'x', unit_price: 1, quantity: 1, total_price: 1 }, { id: 'y', unit_price: 1, quantity: 1, total_price: 1 }])?.id, 'y');
});

test('item pesado nunca soma com outra leitura do mesmo produto', () => {
  let n = 0;
  const id = () => `l${++n}`;
  const cart = mergeScannedItem([], { product_id: 'pao', unit_price: 5.81, quantity: 1, weight_kg: 0.45 }, id, 1);
  const next = mergeScannedItem(cart, { product_id: 'pao', unit_price: 5.81, quantity: 1, weight_kg: 0.45 }, id, 2);
  assert.equal(next.length, 2);
});
