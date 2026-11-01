// Exportação da tela de Relatórios da loja (CSV e PDF).
// Módulo puro: recebe as linhas já buscadas no banco (mesmas consultas da tela) e monta
// as mesmas contas que os componentes de src/components/admin/reports/ mostram.

export const REPORT_TIME_ZONE = 'America/Sao_Paulo';

export interface ReportOrder {
  id: string;
  order_number?: string | null;
  status: string;
  total: number | string | null;
  created_at: string;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  payment_method?: string | null;
  /** Forma de pagamento já traduzida como no histórico de vendas (paymentLabel). */
  payment_label?: string | null;
  delivery_type?: string | null;
  order_type?: string | null;
}

export interface ReportComanda {
  id: string;
  number?: string | number | null;
  type?: string | null;
  status: string;
  total: number | string | null;
  service_fee?: number | string | null;
  created_at: string;
  closed_at?: string | null;
  customer_name?: string | null;
  payment_method?: string | null;
  table_number?: string | number | null;
}

export interface ReportItem {
  product_name: string;
  quantity: number;
  /** subtotal (order_items) ou total_price (comanda_items) */
  total: number | string | null;
}

export interface ReportCustomer {
  id: string;
  name?: string | null;
  phone?: string | null;
  created_at: string;
}

export interface RawStoreReport {
  from: Date;
  to: Date;
  /** Pedidos criados no período (todos os status). */
  orders: ReportOrder[];
  /** Pedidos do período anterior (comparação dos indicadores). */
  previousOrders: ReportOrder[];
  /** Comandas fechadas no período (por closed_at). */
  closedComandas: ReportComanda[];
  previousClosedComandas: ReportComanda[];
  /** Comandas abertas no período (por created_at, todos os status). */
  comandasCreated: ReportComanda[];
  /** Itens de pedidos concluídos no período. */
  orderItems: ReportItem[];
  /** Itens de comandas fechadas no período. */
  comandaItems: ReportItem[];
  /** Clientes vinculados à loja. */
  customers: ReportCustomer[];
}

export type ColumnKind = 'text' | 'int' | 'money' | 'pct' | 'date' | 'datetime';
/** Célula com tipo próprio (ex.: coluna "Valor" do resumo, que mistura dinheiro, contagem e %). */
export interface TypedCell {
  value: number;
  kind: ColumnKind;
}
export type CellValue = string | number | null | undefined | TypedCell;

export interface ReportColumn {
  label: string;
  kind: ColumnKind;
}

export interface ReportSection {
  title: string;
  columns: ReportColumn[];
  rows: CellValue[][];
}

export interface ReportMeta {
  storeName: string;
  from: Date;
  to: Date;
  generatedAt?: Date;
}

// ---------- rótulos (iguais aos da tela) ----------

const STATUS_LABELS: Record<string, string> = {
  confirmado: 'Confirmado',
  aguardando_pagamento: 'Aguardando pagamento',
  aguarda_retirada: 'Aguarda retirada',
  em_transito: 'Em trânsito',
  entrada: 'Entrada',
  em_preparo: 'Em Preparo',
  pronto: 'Pronto',
  saiu_entrega: 'Saiu p/ Entrega',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  open: 'Aberta',
  closed: 'Fechada',
};

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const TREND_PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
};

const COMANDA_PAYMENT_LABELS: Record<string, string> = {
  card: 'Cartão',
  cash: 'Dinheiro',
  credit: 'Crédito',
  debit: 'Débito',
  pix: 'PIX',
  mixed: 'Misto',
  card_on_delivery: 'Cartão',
  pix_on_delivery: 'PIX',
  online_pix: 'PIX Online',
  online_card: 'Cartão Online',
};

const CHANNEL_LABELS: Record<string, string> = {
  delivery: 'Delivery',
  pickup: 'Retirada',
  table: 'Mesa',
  counter: 'Balcão',
};

// ---------- formatação ----------

const num = (v: unknown): number => Number(v) || 0;

function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: REPORT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === t)?.value || '';
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour'), min: get('minute'), weekday: weekdayIndex };
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Dia no fuso de Brasília como 'AAAA-MM-DD' (chave de agrupamento e nome do arquivo). */
export function isoDay(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '';
  const p = zonedParts(d);
  return `${p.y}-${p.m}-${p.d}`;
}

/** 'dd/mm/aaaa' no fuso de Brasília. Aceita 'AAAA-MM-DD' sem deslocar o dia. */
export function formatDateBR(value: string | Date | null | undefined): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  const d = toDate(value);
  if (!d) return '';
  const p = zonedParts(d);
  return `${p.d}/${p.m}/${p.y}`;
}

/** 'dd/mm/aaaa hh:mm' no fuso de Brasília. */
export function formatDateTimeBR(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '';
  const p = zonedParts(d);
  return `${p.d}/${p.m}/${p.y} ${p.h}:${p.min}`;
}

/** Dinheiro para planilha: 1234.5 → '1234,50' (sem separador de milhar, o Excel em português entende como número). */
export function formatMoneyCsv(value: unknown): string {
  return num(value).toFixed(2).replace('.', ',');
}

/** Dinheiro para leitura: 1234.5 → '1.234,50'. */
export function formatMoneyPrint(value: unknown): string {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num(value));
}

/** Percentual com uma casa: 12.345 → '12,3'. */
export function formatPct(value: unknown): string {
  return num(value).toFixed(1).replace('.', ',');
}

function formatCell(value: CellValue, kind: ColumnKind, target: 'csv' | 'print'): string {
  if (value !== null && typeof value === 'object') return formatCell(value.value, value.kind, target);
  if (value === null || value === undefined || value === '') return '';
  switch (kind) {
    case 'money':
      return target === 'csv' ? formatMoneyCsv(value) : formatMoneyPrint(value);
    case 'pct':
      return formatPct(value);
    case 'int':
      return String(Math.round(num(value)));
    case 'date':
      return formatDateBR(String(value));
    case 'datetime':
      return formatDateTimeBR(String(value));
    default:
      return String(value);
  }
}

/** 'Pizzaria do Zé' → 'pizzaria-do-ze' */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** relatorio-<slug-ou-nome>-<aaaa-mm-dd>-a-<aaaa-mm-dd> (sem extensão) */
export function reportFileBaseName(storeSlugOrName: string | null | undefined, from: Date, to: Date): string {
  const key = slugify(storeSlugOrName || '') || 'loja';
  return `relatorio-${key}-${isoDay(from)}-a-${isoDay(to)}`;
}

/** Início do período anterior usado na comparação dos indicadores (mesma conta de SalesKPICards). */
export function previousPeriodStart(from: Date, to: Date): Date {
  const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  const previousFrom = new Date(from);
  previousFrom.setDate(previousFrom.getDate() - daysDiff);
  return previousFrom;
}

// ---------- contas (espelham os componentes da tela) ----------

const variation = (current: number, previous: number) => (previous > 0 ? ((current - previous) / previous) * 100 : 0);

/** SalesKPICards */
function summarySection(raw: RawStoreReport): ReportSection {
  const sumTotal = (list: { total: unknown }[]) => list.reduce((s, x) => s + num(x.total), 0);

  const completed = raw.orders.filter(o => o.status === 'concluido');
  const ordersCount = raw.orders.filter(o => o.status !== 'cancelado').length;
  const comandasCount = raw.closedComandas.length;
  const totalSales = sumTotal(completed) + sumTotal(raw.closedComandas);
  const totalOrders = ordersCount + comandasCount;
  const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
  const serviceFee = raw.closedComandas.reduce((s, c) => s + num(c.service_fee), 0);

  const uniqueCustomers = new Set(raw.orders.map(o => o.customer_id).filter(Boolean));
  const perCustomer: Record<string, number> = {};
  raw.orders.forEach(o => {
    if (o.customer_id) perCustomer[o.customer_id] = (perCustomer[o.customer_id] || 0) + 1;
  });
  const repeat = Object.values(perCustomer).filter(c => c > 1).length;
  const repeatRate = uniqueCustomers.size > 0 ? (repeat / uniqueCustomers.size) * 100 : 0;

  const trends = { sales: 0, orders: 0, ticket: 0, comandas: 0 };
  if (raw.previousOrders.length > 0 || raw.previousClosedComandas.length > 0) {
    const prevSales = sumTotal(raw.previousOrders.filter(o => o.status === 'concluido')) + sumTotal(raw.previousClosedComandas);
    const prevOrders = raw.previousOrders.filter(o => o.status !== 'cancelado').length + raw.previousClosedComandas.length;
    const prevTicket = prevOrders > 0 ? prevSales / prevOrders : 0;
    trends.sales = variation(totalSales, prevSales);
    trends.orders = variation(totalOrders, prevOrders);
    trends.ticket = variation(avgTicket, prevTicket);
    trends.comandas = variation(comandasCount, raw.previousClosedComandas.length);
  }

  return {
    title: 'Resumo do período',
    columns: [
      { label: 'Indicador', kind: 'text' },
      { label: 'Valor', kind: 'money' },
      { label: 'Variação vs período anterior (%)', kind: 'pct' },
    ],
    rows: [
      ['Total de vendas (R$) — pedidos concluídos + comandas fechadas', { value: totalSales, kind: 'money' }, trends.sales],
      ['Pedidos online (exceto cancelados)', { value: ordersCount, kind: 'int' }, trends.orders],
      ['Comandas PDV fechadas', { value: comandasCount, kind: 'int' }, trends.comandas],
      ['Taxa de serviço das comandas (R$)', { value: serviceFee, kind: 'money' }, null],
      ['Ticket médio (R$)', { value: avgTicket, kind: 'money' }, trends.ticket],
      ['Clientes únicos', { value: uniqueCustomers.size, kind: 'int' }, null],
      ['Taxa de recompra (%)', { value: repeatRate, kind: 'pct' }, null],
    ],
  };
}

/** SalesChart (agrupado por dia completo, para não juntar dias de anos diferentes). */
function dailySection(raw: RawStoreReport): ReportSection {
  type Day = { vendas: number; pedidos: number; comandas: number; countOrders: number; countComandas: number };
  const days: Record<string, Day> = {};
  const day = (key: string) => (days[key] ||= { vendas: 0, pedidos: 0, comandas: 0, countOrders: 0, countComandas: 0 });

  raw.orders.forEach(o => {
    const d = day(isoDay(o.created_at));
    if (o.status === 'concluido') {
      d.vendas += num(o.total);
      d.countOrders += 1;
    }
    if (o.status !== 'cancelado') d.pedidos += 1;
  });
  raw.closedComandas.forEach(c => {
    if (!c.closed_at) return;
    const d = day(isoDay(c.closed_at));
    d.vendas += num(c.total);
    d.comandas += 1;
    d.countComandas += 1;
  });

  return {
    title: 'Vendas por dia',
    columns: [
      { label: 'Data', kind: 'date' },
      { label: 'Vendas (R$)', kind: 'money' },
      { label: 'Pedidos online', kind: 'int' },
      { label: 'Comandas', kind: 'int' },
      { label: 'Ticket médio (R$)', kind: 'money' },
    ],
    rows: Object.keys(days)
      .sort()
      .map(key => {
        const d = days[key];
        const count = d.countOrders + d.countComandas;
        return [key, d.vendas, d.pedidos, d.comandas, count > 0 ? d.vendas / count : 0];
      }),
  };
}

function countBy<T>(list: T[], keyOf: (x: T) => string): [string, number][] {
  const acc = new Map<string, number>();
  list.forEach(x => {
    const k = keyOf(x);
    acc.set(k, (acc.get(k) || 0) + 1);
  });
  return [...acc.entries()];
}

/** OrdersAnalysis */
function ordersSections(raw: RawStoreReport): ReportSection[] {
  const completed = raw.orders.filter(o => o.status === 'concluido');
  const closed = raw.comandasCreated.filter(c => c.status === 'closed');
  const statusLabel = (s: string) => STATUS_LABELS[s] || s;
  return [
    {
      title: 'Vendas por origem',
      columns: [
        { label: 'Origem', kind: 'text' },
        { label: 'Quantidade', kind: 'int' },
        { label: 'Receita (R$)', kind: 'money' },
      ],
      rows: [
        ['Pedidos Online (concluídos)', completed.length, completed.reduce((s, o) => s + num(o.total), 0)],
        ['Comandas PDV (fechadas)', closed.length, closed.reduce((s, c) => s + num(c.total), 0)],
      ],
    },
    {
      title: 'Pedidos online por status',
      columns: [
        { label: 'Status', kind: 'text' },
        { label: 'Quantidade', kind: 'int' },
      ],
      rows: countBy(raw.orders, o => statusLabel(o.status)),
    },
    {
      title: 'Comandas por status',
      columns: [
        { label: 'Status', kind: 'text' },
        { label: 'Quantidade', kind: 'int' },
      ],
      rows: countBy(raw.comandasCreated, c => statusLabel(c.status)),
    },
  ];
}

/** SalesTrends (só pedidos concluídos) */
function trendsSections(raw: RawStoreReport): ReportSection[] {
  const completed = raw.orders.filter(o => o.status === 'concluido');
  const byDay = new Map<number, { vendas: number; pedidos: number }>();
  completed.forEach(o => {
    const d = toDate(o.created_at);
    if (!d) return;
    const w = zonedParts(d).weekday;
    const cur = byDay.get(w) || { vendas: 0, pedidos: 0 };
    cur.vendas += num(o.total);
    cur.pedidos += 1;
    byDay.set(w, cur);
  });

  return [
    {
      title: 'Vendas por dia da semana (pedidos concluídos)',
      columns: [
        { label: 'Dia', kind: 'text' },
        { label: 'Vendas (R$)', kind: 'money' },
        { label: 'Pedidos', kind: 'int' },
      ],
      rows: [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([w, v]) => [DAY_NAMES[w], v.vendas, v.pedidos]),
    },
    {
      title: 'Tipo de entrega (pedidos concluídos)',
      columns: [
        { label: 'Tipo', kind: 'text' },
        { label: 'Pedidos', kind: 'int' },
      ],
      rows: countBy(completed, o => (o.delivery_type === 'delivery' ? 'Entrega' : 'Retirada')),
    },
    {
      title: 'Forma de pagamento (pedidos concluídos)',
      columns: [
        { label: 'Forma', kind: 'text' },
        { label: 'Pedidos', kind: 'int' },
      ],
      rows: countBy(completed, o => TREND_PAYMENT_LABELS[o.payment_method || ''] || o.payment_method || 'Não informado'),
    },
  ];
}

/** TopProducts */
function topProductsSection(raw: RawStoreReport): ReportSection {
  type P = { name: string; quantity: number; revenue: number; orders: number; comandas: number };
  const grouped: Record<string, P> = {};
  const add = (item: ReportItem, source: 'orders' | 'comandas') => {
    const p = (grouped[item.product_name] ||= { name: item.product_name, quantity: 0, revenue: 0, orders: 0, comandas: 0 });
    p.quantity += num(item.quantity);
    p.revenue += num(item.total);
    p[source] += num(item.quantity);
  };
  raw.orderItems.forEach(i => add(i, 'orders'));
  raw.comandaItems.forEach(i => add(i, 'comandas'));

  const top = Object.values(grouped).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  const totalRevenue = top.reduce((s, p) => s + p.revenue, 0);

  return {
    title: 'Top 10 produtos mais vendidos (pedidos + comandas)',
    columns: [
      { label: 'Posição', kind: 'int' },
      { label: 'Produto', kind: 'text' },
      { label: 'Qtd vendida', kind: 'int' },
      { label: 'Online', kind: 'int' },
      { label: 'PDV', kind: 'int' },
      { label: 'Receita (R$)', kind: 'money' },
      { label: '% do total', kind: 'pct' },
    ],
    rows: top.map((p, i) => [
      i + 1,
      p.name,
      p.quantity,
      p.orders,
      p.comandas,
      p.revenue,
      totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
    ]),
  };
}

/** CustomersAnalysis (pedidos concluídos) */
function customersSections(raw: RawStoreReport): ReportSection[] {
  const orders = raw.orders.filter(o => o.status === 'concluido');
  const customers = raw.customers;
  const byId = new Map(customers.map(c => [c.id, c]));

  const activeIds = new Set(orders.map(o => o.customer_id));
  const newCustomers = orders.filter(o => {
    const c = o.customer_id ? byId.get(o.customer_id) : undefined;
    return c && new Date(c.created_at) >= raw.from;
  }).length;

  const perCustomer: Record<string, number> = {};
  orders.forEach(o => {
    if (o.customer_id) perCustomer[o.customer_id] = (perCustomer[o.customer_id] || 0) + 1;
  });
  const segments = { novos: 0, recorrentes: 0, vips: 0, inativos: customers.length - activeIds.size };
  Object.values(perCustomer).forEach(count => {
    if (count === 1) segments.novos++;
    else if (count <= 5) segments.recorrentes++;
    else segments.vips++;
  });

  const top = Object.entries(perCustomer)
    .map(([id, count]) => {
      const c = byId.get(id);
      const own = orders.filter(o => o.customer_id === id);
      const last = own.reduce<string | null>((acc, o) => (!acc || o.created_at > acc ? o.created_at : acc), null);
      return {
        name: c?.name || 'Cliente',
        phone: c?.phone || '',
        count,
        spent: own.reduce((s, o) => s + num(o.total), 0),
        last,
      };
    })
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10);

  return [
    {
      title: 'Clientes',
      columns: [
        { label: 'Indicador', kind: 'text' },
        { label: 'Quantidade', kind: 'int' },
      ],
      rows: [
        ['Total de clientes', customers.length],
        ['Clientes ativos', activeIds.size],
        ['Novos clientes', newCustomers],
        ['Clientes inativos', customers.length - activeIds.size],
      ],
    },
    {
      title: 'Segmentação de clientes',
      columns: [
        { label: 'Segmento', kind: 'text' },
        { label: 'Clientes', kind: 'int' },
      ],
      rows: [
        ['Novos (1 pedido)', segments.novos],
        ['Recorrentes (2-5)', segments.recorrentes],
        ['VIPs (6+)', segments.vips],
        ['Inativos', segments.inativos],
      ],
    },
    {
      title: 'Top 10 clientes (maiores compradores)',
      columns: [
        { label: 'Cliente', kind: 'text' },
        { label: 'Telefone', kind: 'text' },
        { label: 'Total pedidos', kind: 'int' },
        { label: 'Total gasto (R$)', kind: 'money' },
        { label: 'Última compra', kind: 'date' },
      ],
      rows: top.map(c => [c.name, c.phone, c.count, c.spent, c.last]),
    },
  ];
}

/** SalesHistoryTable (sem os filtros da tabela: tudo do período) */
function historySection(raw: RawStoreReport): ReportSection {
  type Row = { createdAt: string; cells: CellValue[] };
  const rows: Row[] = [
    ...raw.orders.map(o => ({
      createdAt: o.created_at,
      cells: [
        'Pedido',
        o.order_number || o.id.slice(0, 8),
        CHANNEL_LABELS[o.order_type === 'pickup' ? 'pickup' : 'delivery'],
        o.customer_name || '',
        o.customer_phone || '',
        num(o.total),
        STATUS_LABELS[o.status] || o.status,
        o.payment_method ? o.payment_label || o.payment_method : '',
        o.created_at,
      ] as CellValue[],
    })),
    ...raw.comandasCreated.map(c => {
      const isTable = c.type === 'mesa';
      const channel = CHANNEL_LABELS[isTable ? 'table' : 'counter'] + (isTable && c.table_number ? ` #${c.table_number}` : '');
      return {
        createdAt: c.created_at,
        cells: [
          'Comanda',
          c.number == null ? '' : String(c.number),
          channel,
          c.customer_name || '',
          '',
          num(c.total),
          STATUS_LABELS[c.status] || c.status,
          c.payment_method ? COMANDA_PAYMENT_LABELS[c.payment_method] || c.payment_method : '',
          c.created_at,
        ] as CellValue[],
      };
    }),
  ];
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    title: 'Histórico de vendas (pedidos e comandas do período)',
    columns: [
      { label: 'Tipo', kind: 'text' },
      { label: 'Número', kind: 'text' },
      { label: 'Canal', kind: 'text' },
      { label: 'Cliente', kind: 'text' },
      { label: 'Telefone', kind: 'text' },
      { label: 'Valor (R$)', kind: 'money' },
      { label: 'Status', kind: 'text' },
      { label: 'Pagamento', kind: 'text' },
      { label: 'Data/Hora', kind: 'datetime' },
    ],
    rows: rows.map(r => r.cells),
  };
}

/** Todas as seções do relatório, na ordem da tela. */
export function buildStoreReportSections(raw: RawStoreReport): ReportSection[] {
  return [
    summarySection(raw),
    dailySection(raw),
    ...ordersSections(raw),
    ...trendsSections(raw),
    topProductsSection(raw),
    ...customersSections(raw),
    historySection(raw),
  ];
}

// ---------- CSV ----------

/** Linhas do CSV (já formatadas no padrão brasileiro): cabeçalho, e cada seção com título, colunas e linhas. */
export function buildStoreReportCsvRows(meta: ReportMeta, sections: ReportSection[]): string[][] {
  const out: string[][] = [
    ['Relatório da loja', meta.storeName],
    ['Período', `${formatDateBR(meta.from)} a ${formatDateBR(meta.to)}`],
  ];
  if (meta.generatedAt) out.push(['Gerado em', formatDateTimeBR(meta.generatedAt)]);
  sections.forEach(section => {
    out.push([]);
    out.push([section.title]);
    out.push(section.columns.map(c => c.label));
    if (section.rows.length === 0) out.push(['Sem dados no período']);
    section.rows.forEach(row => out.push(row.map((v, i) => formatCell(v, section.columns[i]?.kind || 'text', 'csv'))));
  });
  return out;
}

function csvField(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** CSV com separador ';', quebra CRLF e BOM UTF-8 (para o Excel abrir acentos certo). */
export function toCsv(rows: string[][]): string {
  return '﻿' + rows.map(r => r.map(csvField).join(';')).join('\r\n') + '\r\n';
}

// ---------- PDF (HTML para impressão) ----------

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const RIGHT_ALIGNED: ColumnKind[] = ['int', 'money', 'pct'];

/** Documento HTML completo, pronto para window.print() (salvar como PDF). */
export function buildStoreReportHtml(meta: ReportMeta, sections: ReportSection[], title: string): string {
  const body = sections
    .map(section => {
      const head = section.columns
        .map(c => `<th class="${RIGHT_ALIGNED.includes(c.kind) ? 'r' : ''}">${escapeHtml(c.label)}</th>`)
        .join('');
      const rows = section.rows.length
        ? section.rows
            .map(
              row =>
                `<tr>${row
                  .map((v, i) => {
                    const kind = section.columns[i]?.kind || 'text';
                    return `<td class="${RIGHT_ALIGNED.includes(kind) ? 'r' : ''}">${escapeHtml(formatCell(v, kind, 'print'))}</td>`;
                  })
                  .join('')}</tr>`,
            )
            .join('')
        : `<tr><td colspan="${section.columns.length}" class="empty">Sem dados no período</td></tr>`;
      return `<section><h2>${escapeHtml(section.title)}</h2><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></section>`;
    })
    .join('\n');

  const generated = meta.generatedAt ? ` · Gerado em ${formatDateTimeBR(meta.generatedAt)}` : '';
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #111; font-size: 10.5px; margin: 0; }
  header { border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 10px; }
  h1 { font-size: 18px; margin: 0 0 2px; }
  .sub { color: #444; font-size: 11px; }
  section { margin: 0 0 14px; }
  h2 { font-size: 12.5px; margin: 0 0 4px; break-after: avoid; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th, td { border: 1px solid #ccc; padding: 3px 5px; text-align: left; vertical-align: top; }
  th { background: #f1f1f1; font-weight: 600; }
  .r { text-align: right; white-space: nowrap; }
  .empty { color: #777; font-style: italic; }
</style></head>
<body>
<header><h1>${escapeHtml(meta.storeName)}</h1>
<div class="sub">Relatório de vendas · Período: ${formatDateBR(meta.from)} a ${formatDateBR(meta.to)}${generated}</div></header>
${body}
</body></html>`;
}
