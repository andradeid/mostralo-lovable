/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  buildStockEntryArgs,
  costAfterEntry,
  isDuplicateBarcodeError,
  stockErrorMessage,
  stockStatus,
  type StockEntryForm,
} from './stockEntry.ts';

const form = (o: Partial<StockEntryForm> = {}): StockEntryForm => ({
  productId: 'p1', quantity: '10', unitCost: null, supplier: '', invoiceNumber: '', notes: '', ...o,
});

test('monta os parâmetros da função: textos vazios viram null', () => {
  assert.deepEqual(buildStockEntryArgs(form({ unitCost: 2.5, supplier: ' Atacadão ', invoiceNumber: '123' })), {
    args: {
      p_product_id: 'p1', p_quantity: 10, p_unit_cost: 2.5,
      p_supplier: 'Atacadão', p_invoice_number: '123', p_notes: null,
    },
  });
});

test('confere produto, quantidade inteira positiva e custo', () => {
  assert.deepEqual(buildStockEntryArgs(form({ productId: null })), { error: 'Escolha o produto' });
  for (const q of ['', '0', '-2', '1.5', 'abc']) {
    assert.ok('error' in buildStockEntryArgs(form({ quantity: q })), q);
  }
  assert.deepEqual(buildStockEntryArgs(form({ unitCost: -1 })), { error: 'O custo não pode ser negativo' });
});

test('situação do estoque', () => {
  assert.equal(stockStatus(0, 5), 'sem_estoque');
  assert.equal(stockStatus(null, 5), 'sem_estoque');
  assert.equal(stockStatus(3, 5), 'baixo');
  assert.equal(stockStatus(3, null), 'baixo');
  assert.equal(stockStatus(6, 5), 'ok');
});

test('reconhece código de barras repetido', () => {
  assert.equal(isDuplicateBarcodeError({ code: '23505', message: 'duplicate key value violates unique constraint "products_store_barcode_key"' }), true);
  assert.equal(isDuplicateBarcodeError({ code: '23505', message: 'duplicate key "products_slug_key"' }), false);
  assert.equal(isDuplicateBarcodeError(null), false);
});

test('mensagem de erro: a do banco (português) ou uma genérica', () => {
  assert.equal(stockErrorMessage({ message: 'Informe uma quantidade maior que zero' }), 'Informe uma quantidade maior que zero');
  assert.equal(stockErrorMessage({ message: 'permission denied for function stock_add_entry' }), 'Sem permissão para esta loja');
  assert.equal(stockErrorMessage(undefined), 'Não foi possível registrar a entrada. Tente de novo.');
});

test('custo depois da entrada: média ponderada igual à função do banco', () => {
  assert.equal(costAfterEntry(2, 10, 10, 4), 3); // (2×10 + 4×10) / 20
  assert.equal(costAfterEntry(2, 0, 10, 4), 4); // sem estoque: custo da entrada
  assert.equal(costAfterEntry(null, 10, 10, 4), 4); // sem custo anterior
  assert.equal(costAfterEntry(2, 10, 10, null), 2); // sem custo informado: não muda
  assert.equal(costAfterEntry(1, 3, 1, 2), 1.25);
});
