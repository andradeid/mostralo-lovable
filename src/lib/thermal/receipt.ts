// Monta a via do pedido para a térmica (58 mm = 32 colunas, 80 mm = 48 colunas).
import { CODE_PAGE_OPTIONS, Receipt, type CodePage } from './escpos';

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
  payment_status?: string | null;
}

/** Configuração de impressão da loja (a mesma da tela Configuração de Impressão / Visualizar). */
export type Via = 'complete' | 'kitchen' | 'delivery';
export interface StorePrintLayout {
  sections?: Partial<Record<'header' | 'orderInfo' | 'customerInfo' | 'items' | 'totals' | 'payment' | 'footer', boolean>>;
  headerText?: string;
  footerText?: string;
  vias?: Via[];
}
const VIA_NAME: Record<Via, string> = { complete: 'COMPLETA', kitchen: 'COZINHA', delivery: 'ENTREGADOR' };

export interface ReceiptOptions { paper: 58 | 80; codepage?: CodePage; semAcentos?: boolean; storeName: string; copies?: number; layout?: StorePrintLayout; cutter?: boolean; kitchenSize?: KitchenSize }

/** Tamanho dos itens na via da cozinha. */
export type KitchenSize = 'normal' | 'mid' | 'big';

/** Guilhotina: se não foi escolhido, só a de 80 mm corta (as de 58 mm portáteis não têm). */
const cutOf = (opt: ReceiptOptions) => opt.cutter ?? opt.paper === 80;

/** Tabela de acentos da configuração (o antigo "sem acentos" vira 'none'). */
const cpOf = (opt: ReceiptOptions): CodePage => opt.codepage ?? (opt.semAcentos ? 'none' : 'pc850');

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
    const indent = raw.match(/^ */)?.[0] ?? '';
    let line = indent;
    for (const word of raw.split(/\s+/).filter(Boolean)) {
      if (line === indent) line = indent + word;
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

/** Tira emoji e espaços das pontas (a térmica não tem emoji; sobrava espaço no começo). */
const clean = (t?: string | null) => (t ?? '').replace(/\p{Extended_Pictographic}|[\u{FE00}-\u{FE0F}\u{200D}]/gu, '').trim();

export function buildReceipt(order: Order, items: OrderItem[], addons: OrderAddon[], opt: ReceiptOptions): Uint8Array {
  const w = columns(opt.paper);
  const sep = '-'.repeat(w);
  const r = new Receipt(cpOf(opt), opt.paper);
  const copies = Math.max(1, opt.copies ?? 1);
  const L = opt.layout ?? {};
  const on = (k: keyof NonNullable<StorePrintLayout['sections']>) => L.sections?.[k] !== false;
  const vias: Via[] = L.vias?.length ? L.vias : ['complete'];
  const addonsOf = (it: OrderItem) => addons.filter(x => x.order_item_id === it.id);

  for (let c = 0; c < copies; c++) {
    vias.forEach((via, vi) => {
      if (vias.length > 1) r.align('center').bold().line(`=== VIA ${VIA_NAME[via]} ===`).bold(false);

      // Cabeçalho
      if (on('header')) {
        r.align('center').bold().line(opt.storeName.slice(0, w)).bold(false);
        if (L.headerText) wrap(L.headerText, w).forEach(l => r.line(l));
      }
      // Pedido
      r.align('center').size(true).bold().line(`PEDIDO #${order.order_number}`).size(false).bold(false);
      if (on('orderInfo')) {
        r.line(order.delivery_type === 'delivery' ? 'ENTREGA' : 'RETIRADA');
        if (order.scheduled_for) r.bold().line('ENCOMENDA').line(`Para: ${dateTime(order.scheduled_for)}`).bold(false);
        r.line(`Feito em: ${dateTime(order.created_at)}`);
      }
      r.align('left').line(sep);

      // Cliente (o entregador vê o endereço em destaque e não vê o telefone)
      if (via === 'delivery') {
        if (order.customer_name) wrap(`Cliente: ${order.customer_name}`, w).forEach(l => r.line(l));
        if (order.customer_address) { r.bold().line('ENDEREÇO DE ENTREGA:').bold(false); wrap(order.customer_address, w).forEach(l => r.bold().line(l).bold(false)); }
        r.line(sep);
      } else if (on('customerInfo')) {
        if (order.customer_name) wrap(`Cliente: ${order.customer_name}`, w).forEach(l => r.line(l));
        if (order.customer_phone) r.line(`Tel: ${order.customer_phone}`);
        if (order.customer_address) wrap(`End: ${order.customer_address}`, w).forEach(l => r.line(l));
        r.line(sep);
      }

      // Itens
      if (on('items')) {
        for (const it of items) {
          if (via === 'kitchen') {
            const ks = opt.kitchenSize ?? 'mid';
            r.bold().size(ks === 'big' ? true : ks === 'mid' ? 'mid' : false);
            wrap(`${it.quantity}x ${it.product_name}`, ks === 'big' ? Math.floor(w / 2) : w).forEach(l => r.line(l));
            r.size(false);
            for (const a of addonsOf(it)) wrap(`  + ${a.quantity}x ${a.addon_name}`, w).forEach(l => r.line(l));
            if (clean(it.notes)) wrap(`  >> OBS: ${clean(it.notes)}`, w).forEach(l => r.line(l));
            r.bold(false);
          } else if (via === 'delivery') {
            wrap(`${it.quantity}x ${it.product_name}`, w).forEach(l => r.line(l));
          } else {
            r.bold();
            twoCols(`${it.quantity}x ${it.product_name}`, brl(it.subtotal), w).forEach(l => r.line(l));
            r.bold(false);
            if (it.quantity > 1) r.line(`  ${brl(it.subtotal / it.quantity)} x ${it.quantity}`);
            for (const a of addonsOf(it)) {
              twoCols(`  + ${a.quantity > 1 ? a.quantity + 'x ' : ''}${a.addon_name}`, Number(a.subtotal) > 0 ? brl(a.subtotal) : '', w).forEach(l => r.line(l));
            }
            if (clean(it.notes)) wrap(`  Obs: ${clean(it.notes)}`, w).forEach(l => r.line(l));
          }
        }
        r.line(sep);
      }

      // Totais
      if (on('totals') && via !== 'kitchen') {
        if (via === 'delivery') {
          r.align('center').bold().line('TOTAL A RECEBER').size(true).line(brl(order.total)).size(false).bold(false).align('left');
        } else {
          twoCols('Subtotal', brl(order.subtotal ?? order.total), w).forEach(l => r.line(l));
          if (Number(order.delivery_fee) > 0) twoCols('Taxa de entrega', brl(order.delivery_fee), w).forEach(l => r.line(l));
          if (Number(order.promotion_discount) > 0) twoCols('Desconto', '-' + brl(order.promotion_discount), w).forEach(l => r.line(l));
          r.bold().size(true);
          twoCols('TOTAL', brl(order.total), Math.floor(w / 2)).forEach(l => r.line(l));
          r.size(false).bold(false);
        }
        r.line(sep);
      }

      // Observações do pedido (sempre saem, menos na via do entregador)
      if (clean(order.notes) && via !== 'delivery') {
        r.bold().line('OBSERVAÇÕES DO PEDIDO:').bold(false);
        wrap(clean(order.notes), w).forEach(l => r.line(l));
        r.line(sep);
      }

      // Pagamento
      if (on('payment') && via !== 'kitchen') {
        wrap(`Pagamento: ${paymentText(order.payment_method, order.payment_details)}`, w).forEach(l => r.line(l));
        if (order.payment_status) r.line(`Status: ${order.payment_status === 'paid' ? 'Pago' : 'Pendente'}`);
        r.line(sep);
      }

      // Rodapé
      r.align('center');
      if (on('footer') && L.footerText) wrap(L.footerText, w).forEach(l => r.line(l));
      r.line('MOSTRALO - mostralo.com.br');
      r.feed(vi === vias.length - 1 ? 3 : 2).cut(cutOf(opt));
    });
  }
  return r.build();
}

export function buildTestReceipt(opt: ReceiptOptions & { printerName: string }): Uint8Array {
  const w = columns(opt.paper);
  const chosen = cpOf(opt);
  // Escolhido "imagem": o teste inteiro sai como imagem
  if (chosen === 'image') {
    return new Receipt('image', opt.paper)
      .align('center').bold().size(true).line('TESTE OK').size(false).bold(false)
      .line(opt.storeName.slice(0, w)).line(opt.printerName.slice(0, w))
      .line('-'.repeat(w)).align('left')
      .line(`Papel: ${opt.paper} mm (${w} colunas)`)
      .line('Modo imagem: todos os acentos')
      .line('América Observações preferência')
      .line('ação pão coração ÁÉÍÓÚ Ç Ã Õ')
      .line('-'.repeat(w)).align('center').line('Mostralo Pedidos').feed(3).cut(cutOf(opt)).build();
  }
  const r = new Receipt(chosen, opt.paper)
    .align('center').bold().size(true).line('TESTE OK').size(false).bold(false)
    .line(opt.storeName.slice(0, w)).line(opt.printerName.slice(0, w))
    .line('-'.repeat(w)).align('left')
    .line(`Papel: ${opt.paper} mm (${w} colunas)`)
    .line('1234567890'.repeat(5).slice(0, w))
    .line('-'.repeat(w))
    .bold().line('Qual linha saiu certa?').bold(false);
  // Uma linha por tabela; o lojista escolhe no app o número que saiu certinho.
  // Cada linha volta para ASCII antes do número, para um caractere chinês não "comer" a quebra de linha.
  const textOptions = CODE_PAGE_OPTIONS.filter(p => p.id !== 'image');
  textOptions.forEach((p, i) => {
    r.page('none').text(`${i + 1}) `).page(p.id).text('América Observações preferência').page('none').line(' .');
  });
  r.page('none').line(`${textOptions.length + 1}) (imagem, logo abaixo)`);
  const head = r.build();
  // A última opção sai como imagem, para comparar
  const img = new Receipt('image', opt.paper)
    .line('América Observações preferência')
    .line('-'.repeat(w)).align('center').line('Mostralo Pedidos').feed(3).cut(cutOf(opt)).build();
  const all = new Uint8Array(head.length + img.length);
  all.set(head); all.set(img, head.length);
  return all;
}
