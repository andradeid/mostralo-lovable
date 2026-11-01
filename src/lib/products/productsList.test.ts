import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyProductFilters,
  filterAndSortCategories,
  maxFilterPrice,
  organizeByCategory,
  sortProductsAlphabetically,
} from './productsList.ts';

// deno-lint-ignore no-explicit-any
const product = (o: Record<string, unknown>): any => ({
  name: 'X', description: null, price: 10, image_url: null, image_gallery: null, button_text: null,
  is_available: true, is_featured: false, show_in_menu: true, display_order: 0,
  created_at: '', updated_at: '', store_id: 's1', category_id: 'c1',
  is_on_offer: false, original_price: null, offer_price: null,
  track_stock: false, stock_quantity: null, stock_alert_threshold: null, ...o,
});

// deno-lint-ignore no-explicit-any
const category = (o: Record<string, unknown>): any => ({
  name: 'Cat', description: null, display_order: 0, is_active: true, store_id: 's1', products: [], ...o,
});

const noFilters = {
  status: 'all', stock: 'all', priceRange: { min: null, max: null }, promotion: 'all',
  categories: [], hasImage: 'all', featured: 'all',
  // deno-lint-ignore no-explicit-any
} as any;

test('agrupa por categoria e põe "Sem Categoria" no topo só quando houver', () => {
  const cats = [category({ id: 'c1' }), category({ id: 'c2' })];
  const grouped = organizeByCategory([product({ id: 'a' }), product({ id: 'b', category_id: null })], cats, 's1');
  assert.deepEqual(grouped.map((c) => c.id), ['uncategorized', 'c1', 'c2']);
  assert.equal(grouped[0].name, 'Sem Categoria');
  assert.equal(grouped[0].display_order, -1);
  assert.deepEqual(grouped[0].products.map((p) => p.id), ['b']);
  assert.deepEqual(organizeByCategory([product({ id: 'a' })], cats, 's1').map((c) => c.id), ['c1', 'c2']);
});

test('filtro de estoque: esgotado, baixo (limite padrão 5), normal e sem controle', () => {
  const list = [
    product({ id: 'off' }),
    product({ id: 'zero', track_stock: true, stock_quantity: 0 }),
    product({ id: 'low', track_stock: true, stock_quantity: 5 }),
    product({ id: 'ok', track_stock: true, stock_quantity: 6 }),
  ];
  const ids = (stock: string) => applyProductFilters(list, { ...noFilters, stock }).map((p) => p.id);
  assert.deepEqual(ids('out_of_stock'), ['zero']);
  assert.deepEqual(ids('low_stock'), ['low']);
  assert.deepEqual(ids('normal'), ['ok']);
  assert.deepEqual(ids('no_tracking'), ['off']);
});

test('faixa de preço usa o preço de oferta quando o produto está em oferta', () => {
  const list = [product({ id: 'a', price: 50, is_on_offer: true, offer_price: 20 }), product({ id: 'b', price: 30 })];
  const r = applyProductFilters(list, { ...noFilters, priceRange: { min: null, max: 25 } });
  assert.deepEqual(r.map((p) => p.id), ['a']);
});

test('status oculto = show_in_menu false; destaque e imagem', () => {
  const list = [
    product({ id: 'a', show_in_menu: false }),
    product({ id: 'b', is_featured: true, image_url: 'x.png' }),
  ];
  assert.deepEqual(applyProductFilters(list, { ...noFilters, status: 'hidden' }).map((p) => p.id), ['a']);
  assert.deepEqual(applyProductFilters(list, { ...noFilters, featured: 'featured' }).map((p) => p.id), ['b']);
  assert.deepEqual(applyProductFilters(list, { ...noFilters, hasImage: 'without_image' }).map((p) => p.id), ['a']);
});

test('ordena manual por display_order ou A-Z (pt-BR) e some com categorias vazias', () => {
  const cats = [
    category({ id: 'c1', products: [product({ id: 'b', name: 'Ébano', display_order: 0 }), product({ id: 'a', name: 'Abacate', display_order: 1 })] }),
    category({ id: 'c2', products: [product({ id: 'z', is_available: false })] }),
  ];
  assert.deepEqual(filterAndSortCategories(cats, noFilters, 'manual')[0].products.map((p) => p.id), ['b', 'a']);
  assert.deepEqual(filterAndSortCategories(cats, noFilters, 'alphabetical')[0].products.map((p) => p.id), ['a', 'b']);
  const onlyActive = filterAndSortCategories(cats, { ...noFilters, status: 'available' }, 'manual');
  assert.deepEqual(onlyActive.map((c) => c.id), ['c1']);
});

test('teto do filtro de preço: mínimo 100, arredondado para cima de 10 em 10', () => {
  assert.equal(maxFilterPrice([]), 100);
  assert.equal(maxFilterPrice([category({ id: 'c', products: [product({ price: 123 })] })]), 130);
  assert.equal(maxFilterPrice([category({ id: 'c', products: [product({ price: 500, is_on_offer: true, offer_price: 101 })] })]), 110);
});

test('A-Z não altera a lista original', () => {
  const list = [product({ id: 'b', name: 'Banana' }), product({ id: 'a', name: 'Água' })];
  assert.deepEqual(sortProductsAlphabetically(list).map((p) => p.id), ['a', 'b']);
  assert.deepEqual(list.map((p) => p.id), ['b', 'a']);
});
