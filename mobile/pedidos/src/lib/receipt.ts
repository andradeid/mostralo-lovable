// Monta a via do pedido para a térmica (58 mm = 32 colunas, 80 mm = 48 colunas).
import { Receipt } from './escpos';

export interface OrderAddon { order_item_id: string; addon_name: string; quantity: number; subtotal: number }
export interface OrderItem { id: string; product_name: string; quantity: number; subtotal: number; notes?: string | null }
export interface Order {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  delivery_type: 'delivery' | 'pickup' | string;
  payment_method: string | null;
  payment_details?: unknown;
  subtotal: number | null;
  delivery_fee: number | null;
  promotion_discount?: number | null;
  total: number;
  notes?: string | null;
  created_at: string;
  scheduled_for?: string | null;
  source?: string | null;
}

export interface ReceiptOptions { paper: 58 | 80; semAcentos?: boolean; storeName: string; copies?: number }

export const columns = (paper: 58 | 80) => (paper === 80 ? 48 : 32);

export function brl(v: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0).replace(/ /g, ' ');
}

export function dateTime(iso: string): string {
  const d = new Date(iso);
  const f = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return f.format(d).replace(',', '');
}

export function paymentText(method: string | null, details?: unknown): string {
  const d = (details && typeof details === 'object' ? details : {}) as Record<string, unknown>;
  const card = d.card_type;
  const base = method === 'card' ? (card === 'debit' ? 'Cartão de débito' : card === 'credit' ? 'Cartão de crédito' : 'Cartão')
    : method === 'pix' ? 'Pix' : method === 'cash' ? 'Dinheiro'
    : method === 'credit_card' ? 'Cartão de crédito' : method === 'debit_card' ? 'Cartão de débito' : 'Não informado';
  const change = Number(d.change_for ?? d.troco ?? d.changeFor ?? 0);
  return method === 'cash' && change > 0 ? `${base} (troco para ${brl(change)})` : base;
}

/** Quebra o texto em linhas da largura do papel. */
export function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  for (const raw of text.split('\n')) {
    let line = '';
    for (const word of raw.split(/\s+/).filter(Boolean)) {
      if (!line) line = word;
      else if ((line + ' ' + word).length <= width) line += ' ' + word;
      else { out.push(line); line = word; }
      while (line.length > width) { out.push(line.slice(0, width)); line = line.slice(width); }
    }
    out.push(line);
  }
  return out;
}

/** "Texto ........ R$ 10,00" com o valor encostado à direita. */
export function twoCols(left: string, right: string, width: number): string[] {
  const room = width - right.length - 1;
  const lines = wrap(left, Math.max(room, 8));
  const last = lines.pop() ?? '';
  return [...lines, last.padEnd(width - right.length, ' ') + right];
}

export function buildReceipt(order: Order, items: OrderItem[], addons: OrderAddon[], opt: ReceiptOptions): Uint8Array {
  const w = columns(opt.paper);
  const sep = '-'.repeat(w);
  const r = new Receipt(opt.semAcentos);
  const copies = Math.max(1, opt.copies ?? 1);

  for (let c = 0; c < copies; c++) {
    r.align('center').bold().line(opt.storeName.slice(0, w)).bold(false);
    r.size(true).bold().line(`PEDIDO #${order.order_number}`).size(false).bold(false);
    r.line(order.delivery_type === 'delivery' ? 'ENTREGA' : 'RETIRADA');
    if (order.scheduled_for) r.bold().line(`AGENDADO: ${dateTime(order.scheduled_for)}`).bold(false);
    r.line(dateTime(order.created_at));
    r.align('left').line(sep);

    if (order.customer_name) wrap(`Cliente: ${order.customer_name}`, w).forEach(l => r.line(l));
    if (order.customer_phone) r.line(`Tel: ${order.customer_phone}`);
    if (order.delivery_type === 'delivery' && order.customer_address) wrap(`End: ${order.customer_address}`, w).forEach(l => r.line(l));
    r.line(sep);

    for (const it of items) {
      r.bold();
      twoCols(`${it.quantity}x ${it.product_name}`, brl(it.subtotal), w).forEach(l => r.line(l));
      r.bold(false);
      for (const a of addons.filter(x => x.order_item_id === it.id)) {
        twoCols(`  + ${a.quantity > 1 ? a.quantity + 'x ' : ''}${a.addon_name}`, Number(a.subtotal) > 0 ? brl(a.subtotal) : '', w).forEach(l => r.line(l));
      }
      if (it.notes) wrap(`  Obs: ${it.notes}`, w).forEach(l => r.line(l));
    }
    r.line(sep);

    twoCols('Subtotal', brl(order.subtotal ?? order.total), w).forEach(l => r.line(l));
    if (Number(order.delivery_fee) > 0) twoCols('Taxa de entrega', brl(order.delivery_fee), w).forEach(l => r.line(l));
    if (Number(order.promotion_discount) > 0) twoCols('Desconto', '-' + brl(order.promotion_discount), w).forEach(l => r.line(l));
    r.bold().size(true);
    twoCols('TOTAL', brl(order.total), Math.floor(w / 2)).forEach(l => r.line(l));
    r.size(false).bold(false);
    wrap(`Pagamento: ${paymentText(order.payment_method, order.payment_details)}`, w).forEach(l => r.line(l));

    if (order.notes) { r.line(sep).bold().line('OBSERVAÇÕES').bold(false); wrap(order.notes, w).forEach(l => r.line(l)); }

    r.line(sep).align('center').line('mostralo.com.br').feed(3).cut();
  }
  return r.build();
}

export function buildTestReceipt(opt: ReceiptOptions & { printerName: string }): Uint8Array {
  const w = columns(opt.paper);
  return new Receipt(opt.semAcentos)
    .align('center').bold().size(true).line('TESTE OK').size(false).bold(false)
    .line(opt.storeName.slice(0, w)).line(opt.printerName.slice(0, w))
    .line('-'.repeat(w)).align('left')
    .line(`Papel: ${opt.paper} mm (${w} colunas)`)
    .line('Acentos: ação, pão, coração, é ê')
    .line('1234567890'.repeat(5).slice(0, w))
    .align('center').line('Mostralo Pedidos').feed(3).cut().build();
}
