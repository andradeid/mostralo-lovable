/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  buildCashReportLines,
  cashDifference,
  differenceText,
  escapeHtml,
  methodLabel,
  methodRows,
  normalizeMethodKey,
  normalizeSummary,
} from './cashReport.ts';

const nb = (s: string) => s.replace(/ /g, ' ');

test('rótulos das formas de pagamento', () => {
  assert.equal(methodLabel('dinheiro'), 'Dinheiro');
  assert.equal(methodLabel('pix'), 'Pix');
  assert.equal(methodLabel('credito'), 'Cartão de crédito');
  assert.equal(methodLabel('debito'), 'Cartão de débito');
  assert.equal(methodLabel('outro'), 'Outros');
  assert.equal(methodLabel('outros'), 'Outros'); // o PDV grava "outros"
  assert.equal(methodLabel('vale'), 'Outros');
  assert.equal(normalizeMethodKey(null), 'outro');
});

test('diferença: sobrou, faltou e bateu (centavos exatos)', () => {
  assert.deepEqual(cashDifference(160, 150), { value: 10, status: 'sobrou', label: 'Sobrou' });
  assert.deepEqual(cashDifference(149.9, 150), { value: -0.1, status: 'faltou', label: 'Faltou' });
  assert.deepEqual(cashDifference(0.1 + 0.2, 0.3), { value: 0, status: 'bateu', label: 'Bateu' });
  assert.equal(nb(differenceText(cashDifference(140, 150.5))), 'Faltou R$ 10,50');
  assert.equal(differenceText(cashDifference(10, 10)), 'Bateu (sem diferença)');
});

test('normaliza o resumo vindo do banco (números como texto)', () => {
  const s = normalizeSummary({
    opening_amount: '150.00',
    by_method: { dinheiro: { total: '40.5', count: '2' } },
    sales_total: '40.5', sales_count: 2, cash_sales: '40.5',
    sangrias: '10', suprimentos: 0, expected_cash: '180.5',
  });
  assert.equal(s.opening_amount, 150);
  assert.deepEqual(s.by_method.dinheiro, { total: 40.5, count: 2 });
  assert.equal(s.expected_cash, 180.5);
  assert.equal(s.discounts, 0);
  assert.deepEqual(normalizeSummary(null).by_method, {});
});

test('vendas por forma: ordem fixa e "outro"/"outros" juntos', () => {
  const rows = methodRows({
    by_method: {
      outros: { total: 5, count: 1 },
      pix: { total: 20, count: 2 },
      outro: { total: 3, count: 1 },
      dinheiro: { total: 10, count: 1 },
      debito: { total: 0, count: 0 },
    },
  });
  assert.deepEqual(rows.map((r) => r.key), ['dinheiro', 'pix', 'outro']);
  assert.deepEqual(rows[2], { key: 'outro', label: 'Outros', total: 8, count: 2 });
});

test('linhas do relatório com contado, diferença e movimentos', () => {
  const summary = normalizeSummary({
    opening_amount: 150,
    by_method: { dinheiro: { total: 50, count: 2 }, pix: { total: 30, count: 1 } },
    sales_total: 80, sales_count: 3, cash_sales: 50,
    sangrias: 20, suprimentos: 10, expected_cash: 190,
  });
  const lines = buildCashReportLines({
    storeName: 'Loja <Teste>',
    summary,
    openedAt: '2026-11-02T11:12:00Z',
    closedAt: '2026-11-02T22:00:00Z',
    countedAmount: 185,
    movements: [{ type: 'sangria', amount: 20, reason: 'Depósito', created_at: '2026-11-02T15:00:00Z' }],
    timeZone: 'America/Sao_Paulo',
  });
  const rows = lines.filter((l) => l.kind === 'row') as { label: string; value: string }[];
  const find = (label: string) => rows.find((r) => r.label === label)?.value;
  assert.equal(lines[1].kind === 'title' && lines[1].text, 'FECHAMENTO DE CAIXA');
  assert.equal(find('Aberto em'), '02/11/2026, 08:12');
  assert.equal(nb(find('Dinheiro (2)')!), 'R$ 50,00');
  assert.equal(nb(find('Pix (1)')!), 'R$ 30,00');
  assert.equal(nb(find('Total vendido (3)')!), 'R$ 80,00');
  assert.equal(nb(find('ESPERADO')!), 'R$ 190,00');
  assert.equal(nb(find('Diferença')!), 'Faltou R$ 5,00');
  assert.ok(rows.some((r) => r.label === '12:00 Sangria - Depósito' && nb(r.value) === '-R$ 20,00'));
});

test('relatório de caixa aberto sem vendas', () => {
  const lines = buildCashReportLines({ storeName: '', summary: normalizeSummary({ opening_amount: 0 }), openedAt: null });
  assert.equal(lines[0].kind === 'title' && lines[0].text, 'Estabelecimento');
  assert.equal(lines[1].kind === 'title' && lines[1].text, 'RESUMO DO CAIXA (ABERTO)');
  assert.ok(lines.some((l) => l.kind === 'text' && l.text === 'Nenhuma venda no período'));
  assert.ok(!lines.some((l) => l.kind === 'row' && l.label === 'CONTADO'));
});

test('escapa HTML', () => {
  assert.equal(escapeHtml(`<b>"a" & 'b'</b>`), '&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;');
});
