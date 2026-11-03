/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { canManageProducts, checkScannedProduct, notFoundMessage, scanAddedMessage } from './scanRules.ts';
import { mergeScannedItem } from '../pdv/cartScan.ts';
import { buildQuickProduct } from '../products/quickProduct.ts';

const base = { name: 'Coca-Cola 350ml', is_available: true, track_stock: false, stock_quantity: null };

test('produto lido: indisponível bloqueia; estoque zerado avisa; entrada aceita tudo', () => {
  assert.deepEqual(checkScannedProduct(base), { ok: true });
  assert.deepEqual(checkScannedProduct({ ...base, is_available: false }), { ok: false, message: 'Coca-Cola 350ml está indisponível' });
  assert.deepEqual(checkScannedProduct({ ...base, track_stock: true, stock_quantity: 0 }), { ok: true, warning: 'Coca-Cola 350ml: estoque zerado' });
  assert.deepEqual(checkScannedProduct({ ...base, track_stock: true, stock_quantity: 3 }), { ok: true });
  assert.deepEqual(checkScannedProduct({ ...base, is_available: false }, { requireAvailable: false }), { ok: true });
});

test('quem pode cadastrar pelo leitor', () => {
  assert.equal(canManageProducts('store_admin'), true);
  assert.equal(canManageProducts('master_admin'), true);
  assert.equal(canManageProducts('attendant'), false);
  assert.equal(canManageProducts(null), false);
});

test('textos dos avisos', () => {
  assert.equal(scanAddedMessage('Coca-Cola 350ml'), 'Adicionado: Coca-Cola 350ml');
  assert.equal(notFoundMessage('7891234567895'), 'Código 7891234567895 não cadastrado');
});

test('carrinho: ler de novo soma 1 na mesma linha', () => {
  let n = 0;
  const id = () => `l${++n}`;
  const item = { product_id: 'p1', product_name: 'Coca', unit_price: 5, quantity: 1 };
  let cart = mergeScannedItem<{ id: string; product_id?: string; product_name: string; unit_price: number; quantity: number; total_price: number; notes?: string }>([], item, id);
  cart = mergeScannedItem(cart, item, id);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 2);
  assert.equal(cart[0].total_price, 10);
  // linha com observação (adicionada pelo clique) não recebe a leitura
  cart = [{ ...cart[0], notes: 'gelada' }];
  cart = mergeScannedItem(cart, item, id);
  assert.equal(cart.length, 2);
  assert.equal(cart[1].quantity, 1);
  // outro produto: linha nova
  cart = mergeScannedItem(cart, { ...item, product_id: 'p2' }, id);
  assert.equal(cart.length, 3);
});

const form = { name: 'Coca-Cola 350ml', price: 5.5, categoryId: 'cat1', barcode: '7891234567895', cost: null, initialStock: '' };

test('cadastro rápido: monta com os valores do formulário de produto', () => {
  const r = buildQuickProduct(form);
  assert.ok(!('error' in r));
  if ('error' in r) return;
  assert.equal(r.data.name, 'Coca-Cola 350ml');
  assert.equal(r.data.price, 5.5);
  assert.equal(r.data.category_id, 'cat1');
  assert.equal(r.data.barcode, '7891234567895');
  assert.equal(r.data.is_available, true);
  assert.equal(r.data.track_stock, false);
  assert.equal(r.data.button_text, 'Comprar');
  assert.equal(r.cost, null);
  assert.equal(r.initialStock, null);
});

test('cadastro rápido: custo e estoque inicial opcionais', () => {
  const r = buildQuickProduct({ ...form, cost: 3.2, initialStock: ' 24 ' });
  assert.ok(!('error' in r) && r.cost === 3.2 && r.initialStock === 24);
  const zero = buildQuickProduct({ ...form, cost: 0 });
  assert.ok(!('error' in zero) && zero.cost === null);
});

test('cadastro rápido: vendido por quilo grava a marca e ignora o estoque inicial', () => {
  const r = buildQuickProduct({ ...form, initialStock: '10', soldByWeight: true });
  assert.ok(!('error' in r));
  if ('error' in r) return;
  assert.equal(r.data.sold_by_weight, true);
  assert.equal(r.initialStock, null);
  const n = buildQuickProduct(form);
  assert.ok(!('error' in n) && n.data.sold_by_weight === false);
});

test('cadastro rápido: erros em português', () => {
  assert.deepEqual(buildQuickProduct({ ...form, name: '  ' }), { error: 'Nome é obrigatório' });
  assert.deepEqual(buildQuickProduct({ ...form, price: 0 }), { error: 'Preço deve ser maior que zero' });
  assert.deepEqual(buildQuickProduct({ ...form, categoryId: '' }), { error: 'Categoria é obrigatória' });
  assert.deepEqual(buildQuickProduct({ ...form, barcode: ' ' }), { error: 'Código de barras vazio' });
  assert.deepEqual(buildQuickProduct({ ...form, cost: -1 }), { error: 'O custo não pode ser negativo' });
  assert.deepEqual(buildQuickProduct({ ...form, initialStock: '2,5' }), { error: 'Estoque inicial: informe um número inteiro maior que zero' });
  assert.deepEqual(buildQuickProduct({ ...form, initialStock: '0' }), { error: 'Estoque inicial: informe um número inteiro maior que zero' });
});
