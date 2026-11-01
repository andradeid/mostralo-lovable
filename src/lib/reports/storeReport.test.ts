/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  buildStoreReportCsvRows,
  buildStoreReportHtml,
  buildStoreReportSections,
  formatDateBR,
  formatDateTimeBR,
  formatMoneyCsv,
  previousPeriodStart,
  reportFileBaseName,
  toCsv,
  type RawStoreReport,
} from './storeReport';

// 15h UTC = 12h em Brasília: o dia não muda.
const from = new Date('2026-10-01T03:00:00.000Z'); // 01/10 00h em Brasília
const to = new Date('2026-10-31T23:00:00.000Z'); // 31/10 20h em Brasília

const raw: RawStoreReport = {
  from,
  to,
  orders: [
    { id: 'o1-aaaaaaaa', order_number: '101', status: 'concluido', total: 50.5, created_at: '2026-10-05T15:00:00.000Z', customer_id: 'c1', customer_name: 'Ana; "da Silva"', customer_phone: '61999990000', payment_method: 'pix', payment_label: 'Pix', delivery_type: 'delivery', order_type: 'delivery' },
    { id: 'o2-bbbbbbbb', order_number: '102', status: 'concluido', total: '1200', created_at: '2026-10-05T18:00:00.000Z', customer_id: 'c1', customer_name: 'Ana', payment_method: 'cash', payment_label: 'Dinheiro', delivery_type: 'pickup', order_type: 'pickup' },
    { id: 'o3-cccccccc', order_number: null, status: 'cancelado', total: 30, created_at: '2026-10-06T15:00:00.000Z', customer_id: 'c2', payment_method: null },
  ],
  previousOrders: [{ id: 'p1', status: 'concluido', total: 100, created_at: '2026-09-10T15:00:00.000Z' }],
  closedComandas: [
    { id: 'k1', number: 7, type: 'mesa', status: 'closed', total: 49.5, service_fee: 4.5, created_at: '2026-10-06T14:00:00.000Z', closed_at: '2026-10-06T15:00:00.000Z', payment_method: 'card', table_number: 3 },
  ],
  previousClosedComandas: [],
  comandasCreated: [
    { id: 'k1', number: 7, type: 'mesa', status: 'closed', total: 49.5, created_at: '2026-10-06T14:00:00.000Z', closed_at: '2026-10-06T15:00:00.000Z', payment_method: 'card', table_number: 3 },
  ],
  orderItems: [
    { product_name: 'Pizza', quantity: 2, total: 100 },
    { product_name: 'Refri', quantity: 3, total: 15 },
  ],
  comandaItems: [{ product_name: 'Pizza', quantity: 1, total: 49.5 }],
  customers: [
    { id: 'c1', name: 'Ana', phone: '61999990000', created_at: '2026-10-02T12:00:00.000Z' },
    { id: 'c2', name: 'Bia', phone: null, created_at: '2025-01-01T12:00:00.000Z' },
  ],
};

const meta = { storeName: 'Pizzaria do Zé', from, to };
const rows = buildStoreReportCsvRows(meta, buildStoreReportSections(raw));
const sectionRows = (title: string) => {
  const start = rows.findIndex(r => r[0] === title);
  assert.ok(start >= 0, `seção ${title} não encontrada`);
  const end = rows.findIndex((r, i) => i > start && r.length === 0);
  return rows.slice(start + 2, end === -1 ? undefined : end); // pula título e cabeçalho
};

test('formatos brasileiros', () => {
  assert.equal(formatMoneyCsv(1234.5), '1234,50');
  assert.equal(formatMoneyCsv('abc'), '0,00');
  assert.equal(formatDateBR('2026-10-05'), '05/10/2026');
  assert.equal(formatDateBR('2026-11-01T02:30:00.000Z'), '31/10/2026'); // 23h30 em Brasília
  assert.equal(formatDateTimeBR('2026-10-05T15:07:00.000Z'), '05/10/2026 12:07');
});

test('nome do arquivo com slug e período', () => {
  assert.equal(reportFileBaseName('Pizzaria do Zé', from, to), 'relatorio-pizzaria-do-ze-2026-10-01-a-2026-10-31');
  assert.equal(reportFileBaseName('pizzaria-ze', from, to), 'relatorio-pizzaria-ze-2026-10-01-a-2026-10-31');
  assert.equal(reportFileBaseName(null, from, to), 'relatorio-loja-2026-10-01-a-2026-10-31');
});

test('período anterior tem o mesmo tamanho', () => {
  const f = new Date(2026, 9, 11);
  const t = new Date(2026, 9, 21);
  assert.equal(previousPeriodStart(f, t).getDate(), 1);
});

test('cabeçalho com loja e período', () => {
  assert.deepEqual(rows[0], ['Relatório da loja', 'Pizzaria do Zé']);
  assert.deepEqual(rows[1], ['Período', '01/10/2026 a 31/10/2026']);
});

test('resumo igual aos cartões da tela', () => {
  const resumo = sectionRows('Resumo do período');
  // vendas = 50,50 + 1200 (concluídos) + 49,50 (comanda) = 1300
  assert.deepEqual(resumo[0].slice(1), ['1300,00', '1200,0']); // vs 100 no período anterior
  assert.equal(resumo[1][1], '2'); // pedidos online exceto cancelados
  assert.equal(resumo[2][1], '1'); // comandas
  assert.equal(resumo[3][1], '4,50'); // taxa de serviço
  assert.equal(resumo[4][1], '433,33'); // 1300 / (2 + 1)
  assert.equal(resumo[5][1], '2'); // clientes únicos
  assert.equal(resumo[6][1], '50,0'); // c1 tem 2 pedidos de 2 clientes
  assert.equal(resumo[6][2], ''); // a tela não calcula variação da recompra
});

test('vendas por dia em dd/mm/aaaa', () => {
  assert.deepEqual(sectionRows('Vendas por dia'), [
    ['05/10/2026', '1250,50', '2', '0', '625,25'],
    ['06/10/2026', '49,50', '0', '1', '49,50'],
  ]);
});

test('top produtos soma pedidos e comandas', () => {
  assert.deepEqual(sectionRows('Top 10 produtos mais vendidos (pedidos + comandas)'), [
    ['1', 'Pizza', '3', '2', '1', '149,50', '90,9'],
    ['2', 'Refri', '3', '3', '0', '15,00', '9,1'],
  ]);
});

test('top clientes e histórico', () => {
  assert.deepEqual(sectionRows('Top 10 clientes (maiores compradores)'), [['Ana', '61999990000', '2', '1250,50', '05/10/2026']]);
  const hist = sectionRows('Histórico de vendas (pedidos e comandas do período)');
  assert.equal(hist.length, 4);
  assert.deepEqual(hist[0], ['Pedido', 'o3-ccccc', 'Delivery', '', '', '30,00', 'Cancelado', '', '06/10/2026 12:00']);
  assert.deepEqual(hist[1], ['Comanda', '7', 'Mesa #3', '', '', '49,50', 'Fechada', 'Cartão', '06/10/2026 11:00']);
  assert.equal(hist[3][2], 'Delivery');
  assert.equal(hist[2][2], 'Retirada');
});

test('CSV com BOM, ponto e vírgula e aspas escapadas', () => {
  const csv = toCsv([['a', 'Ana; "da Silva"', '1,50'], ['linha\nquebrada']]);
  assert.ok(csv.startsWith('﻿'));
  assert.equal(csv.slice(1), 'a;"Ana; ""da Silva""";1,50\r\n"linha\nquebrada"\r\n');
});

test('seção vazia avisa sem dados', () => {
  const empty = buildStoreReportCsvRows(meta, buildStoreReportSections({ ...raw, orderItems: [], comandaItems: [] }));
  const i = empty.findIndex(r => r[0] === 'Top 10 produtos mais vendidos (pedidos + comandas)');
  assert.deepEqual(empty[i + 2], ['Sem dados no período']);
});

test('HTML de impressão escapa texto e mostra loja e período', () => {
  const html = buildStoreReportHtml({ ...meta, storeName: 'Loja <b>X</b>' }, buildStoreReportSections(raw), 'relatorio-x');
  assert.ok(html.includes('Loja &lt;b&gt;X&lt;/b&gt;'));
  assert.ok(html.includes('01/10/2026 a 31/10/2026'));
  assert.ok(html.includes('1.250,50'));
  assert.ok(html.includes('<title>relatorio-x</title>'));
});
