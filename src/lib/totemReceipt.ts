/**
 * Recibo do cliente impresso pelo totem (opção "Imprimir Recibo Automaticamente").
 * Só monta o conteúdo; quem imprime é a tela de confirmação (window.print()).
 */
import { brl } from './brl';

export interface TotemReceiptItem {
  name: string;
  price: number;
  quantity: number;
  notes?: string | null;
  addons?: Array<{ name: string; price: number }>;
}

export interface TotemReceiptInput {
  storeName: string;
  passwordNumber: string;
  items: TotemReceiptItem[];
  /** Total cobrado (o que o servidor conferiu); sem ele, a soma dos itens. */
  total?: number | null;
  paidAt: Date;
  /** Fuso para data/hora; sem ele, o do aparelho do totem. */
  timeZone?: string;
}

export interface TotemReceiptLine {
  label: string;
  amount: string;
  details: string[];
}

export interface TotemReceipt {
  storeName: string;
  passwordNumber: string;
  dateTime: string;
  lines: TotemReceiptLine[];
  total: string;
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const itemLineTotal = (i: TotemReceiptItem) =>
  (num(i.price) + (i.addons ?? []).reduce((s, a) => s + num(a.price), 0)) * num(i.quantity);

export function formatReceiptDateTime(d: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(d).replace(',', '');
}

export function buildTotemReceipt(input: TotemReceiptInput): TotemReceipt {
  const lines = input.items.map(i => ({
    label: `${num(i.quantity)}x ${i.name}`,
    amount: brl(itemLineTotal(i)),
    details: [
      ...(i.addons ?? []).map(a => `+ ${a.name}`),
      ...(i.notes && i.notes.trim() ? [`Obs.: ${i.notes.trim()}`] : []),
    ],
  }));
  const sum = input.items.reduce((s, i) => s + itemLineTotal(i), 0);
  const total = input.total != null && Number.isFinite(Number(input.total)) && Number(input.total) > 0 ? Number(input.total) : sum;
  return {
    storeName: input.storeName.trim(),
    passwordNumber: String(input.passwordNumber),
    dateTime: formatReceiptDateTime(input.paidAt, input.timeZone),
    lines,
    total: brl(total),
  };
}
