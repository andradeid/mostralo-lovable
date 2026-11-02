// Regras puras do caixa do PDV (sem React, sem Supabase): rótulos, diferença e linhas do relatório.
// O resumo vem pronto da função `cash_session_summary` do banco; aqui só organizamos para mostrar/imprimir.

export type CashMethodKey = 'dinheiro' | 'pix' | 'credito' | 'debito' | 'outro';

export interface CashMethodTotal {
  total: number;
  count: number;
}

export interface CashSummary {
  session_id?: string;
  status?: 'open' | 'closed' | string;
  opened_at?: string | null;
  until?: string | null;
  opening_amount: number;
  by_method: Record<string, CashMethodTotal>;
  sales_total: number;
  sales_count: number;
  cash_sales: number;
  discounts: number;
  service_fee: number;
  sangrias: number;
  suprimentos: number;
  expected_cash: number;
}

export interface CashMovementLike {
  type: 'sangria' | 'suprimento' | string;
  amount: number;
  reason?: string | null;
  created_at: string;
}

export const METHOD_ORDER: CashMethodKey[] = ['dinheiro', 'pix', 'credito', 'debito', 'outro'];

export const METHOD_LABELS: Record<CashMethodKey, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  credito: 'Cartão de crédito',
  debito: 'Cartão de débito',
  outro: 'Outros',
};

/** O PDV grava "outros"; o banco usa "outro" para vazio. Qualquer forma desconhecida cai em "outro". */
export function normalizeMethodKey(key: string | null | undefined): CashMethodKey {
  const k = (key || '').trim().toLowerCase();
  if (k === 'dinheiro' || k === 'pix' || k === 'credito' || k === 'debito') return k;
  return 'outro';
}

export function methodLabel(key: string | null | undefined): string {
  return METHOD_LABELS[normalizeMethodKey(key)];
}

export function toMoney(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

/** Garante números (o banco pode devolver numeric como texto) e o mapa de formas sempre presente. */
export function normalizeSummary(raw: unknown): CashSummary {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const byMethod: Record<string, CashMethodTotal> = {};
  const src = r.by_method && typeof r.by_method === 'object' ? r.by_method : {};
  for (const [k, v] of Object.entries(src as Record<string, any>)) {
    byMethod[k] = { total: toMoney(v?.total), count: Math.trunc(Number(v?.count) || 0) };
  }
  return {
    session_id: r.session_id,
    status: r.status,
    opened_at: r.opened_at ?? null,
    until: r.until ?? null,
    opening_amount: toMoney(r.opening_amount),
    by_method: byMethod,
    sales_total: toMoney(r.sales_total),
    sales_count: Math.trunc(Number(r.sales_count) || 0),
    cash_sales: toMoney(r.cash_sales),
    discounts: toMoney(r.discounts),
    service_fee: toMoney(r.service_fee),
    sangrias: toMoney(r.sangrias),
    suprimentos: toMoney(r.suprimentos),
    expected_cash: toMoney(r.expected_cash),
  };
}

export interface MethodRow {
  key: CashMethodKey;
  label: string;
  total: number;
  count: number;
}

/** Vendas por forma de pagamento, na ordem fixa, juntando "outro"/"outros"/desconhecidas. Só formas com venda. */
export function methodRows(summary: Pick<CashSummary, 'by_method'>): MethodRow[] {
  const acc = new Map<CashMethodKey, MethodRow>();
  for (const [k, v] of Object.entries(summary.by_method || {})) {
    const key = normalizeMethodKey(k);
    const row = acc.get(key) || { key, label: METHOD_LABELS[key], total: 0, count: 0 };
    row.total = toMoney(row.total + toMoney(v?.total));
    row.count += Math.trunc(Number(v?.count) || 0);
    acc.set(key, row);
  }
  return METHOD_ORDER.filter((k) => acc.has(k) && (acc.get(k)!.count > 0 || acc.get(k)!.total !== 0)).map((k) => acc.get(k)!);
}

export type DifferenceStatus = 'sobrou' | 'faltou' | 'bateu';

export interface CashDifference {
  value: number;
  status: DifferenceStatus;
  label: string;
}

/** Contado − esperado, em centavos exatos. Positivo = sobrou, negativo = faltou, zero = bateu. */
export function cashDifference(counted: number, expected: number): CashDifference {
  const cents = Math.round(toMoney(counted) * 100) - Math.round(toMoney(expected) * 100);
  const value = cents / 100;
  if (cents > 0) return { value, status: 'sobrou', label: 'Sobrou' };
  if (cents < 0) return { value, status: 'faltou', label: 'Faltou' };
  return { value: 0, status: 'bateu', label: 'Bateu' };
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toMoney(value));
}

export function formatDateTimeBR(iso: string | null | undefined, timeZone?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  });
}

export function differenceText(diff: CashDifference): string {
  if (diff.status === 'bateu') return 'Bateu (sem diferença)';
  return `${diff.label} ${formatBRL(Math.abs(diff.value))}`;
}

// ── Relatório (linhas de texto para a impressão 80mm) ──

export type ReportLine =
  | { kind: 'title'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'row'; label: string; value: string; strong?: boolean }
  | { kind: 'separator' };

export interface CashReportInput {
  storeName: string;
  summary: CashSummary;
  openedAt: string | null | undefined;
  closedAt?: string | null;
  openedByName?: string | null;
  closedByName?: string | null;
  countedAmount?: number | null;
  openingNotes?: string | null;
  closingNotes?: string | null;
  movements?: CashMovementLike[];
  timeZone?: string;
}

export function buildCashReportLines(input: CashReportInput): ReportLine[] {
  const s = input.summary;
  const tz = input.timeZone;
  const lines: ReportLine[] = [];
  lines.push({ kind: 'title', text: input.storeName || 'Estabelecimento' });
  lines.push({ kind: 'title', text: input.closedAt ? 'FECHAMENTO DE CAIXA' : 'RESUMO DO CAIXA (ABERTO)' });
  lines.push({ kind: 'separator' });
  lines.push({ kind: 'row', label: 'Aberto em', value: formatDateTimeBR(input.openedAt, tz) });
  if (input.openedByName) lines.push({ kind: 'row', label: 'Aberto por', value: input.openedByName });
  if (input.closedAt) lines.push({ kind: 'row', label: 'Fechado em', value: formatDateTimeBR(input.closedAt, tz) });
  if (input.closedByName) lines.push({ kind: 'row', label: 'Fechado por', value: input.closedByName });
  lines.push({ kind: 'separator' });

  lines.push({ kind: 'text', text: 'VENDAS POR FORMA' });
  const rows = methodRows(s);
  if (rows.length === 0) lines.push({ kind: 'text', text: 'Nenhuma venda no período' });
  for (const r of rows) lines.push({ kind: 'row', label: `${r.label} (${r.count})`, value: formatBRL(r.total) });
  lines.push({ kind: 'row', label: `Total vendido (${s.sales_count})`, value: formatBRL(s.sales_total), strong: true });
  if (s.discounts > 0) lines.push({ kind: 'row', label: 'Descontos dados', value: formatBRL(s.discounts) });
  if (s.service_fee > 0) lines.push({ kind: 'row', label: 'Taxa de serviço', value: formatBRL(s.service_fee) });
  lines.push({ kind: 'separator' });

  lines.push({ kind: 'text', text: 'DINHEIRO NA GAVETA' });
  lines.push({ kind: 'row', label: 'Troco inicial', value: formatBRL(s.opening_amount) });
  lines.push({ kind: 'row', label: '+ Vendas em dinheiro', value: formatBRL(s.cash_sales) });
  lines.push({ kind: 'row', label: '+ Suprimentos', value: formatBRL(s.suprimentos) });
  lines.push({ kind: 'row', label: '- Sangrias', value: formatBRL(s.sangrias) });
  lines.push({ kind: 'row', label: 'ESPERADO', value: formatBRL(s.expected_cash), strong: true });
  if (input.countedAmount != null) {
    const diff = cashDifference(input.countedAmount, s.expected_cash);
    lines.push({ kind: 'row', label: 'CONTADO', value: formatBRL(input.countedAmount), strong: true });
    lines.push({ kind: 'row', label: 'Diferença', value: differenceText(diff), strong: true });
  }

  const movs = input.movements || [];
  if (movs.length > 0) {
    lines.push({ kind: 'separator' });
    lines.push({ kind: 'text', text: 'SANGRIAS E SUPRIMENTOS' });
    for (const m of movs) {
      const time = formatDateTimeBR(m.created_at, tz).split(' ').pop() || '';
      const tipo = m.type === 'sangria' ? 'Sangria' : 'Suprimento';
      lines.push({ kind: 'row', label: `${time} ${tipo}${m.reason ? ` - ${m.reason}` : ''}`, value: `${m.type === 'sangria' ? '-' : '+'}${formatBRL(m.amount)}` });
    }
  }

  if (input.openingNotes || input.closingNotes) {
    lines.push({ kind: 'separator' });
    if (input.openingNotes) lines.push({ kind: 'text', text: `Obs. abertura: ${input.openingNotes}` });
    if (input.closingNotes) lines.push({ kind: 'text', text: `Obs. fechamento: ${input.closingNotes}` });
  }
  return lines;
}

export function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
