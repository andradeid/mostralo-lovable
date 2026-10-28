// Regra de quando imprimir: pedido novo (ao chegar) ou quando sai de "entrada" (ao aceitar).
export type PrintWhen = 'arrive' | 'accept';

const ACCEPTED = new Set(['confirmado', 'em_preparo', 'aguarda_retirada', 'em_transito', 'concluido']);

export function shouldPrint(order: { id: string; status: string }, when: PrintWhen, printed: Set<string>): boolean {
  if (printed.has(order.id)) return false;
  if (order.status === 'cancelado' || order.status === 'aguardando_pagamento') return false;
  return when === 'arrive' ? true : ACCEPTED.has(order.status);
}

/** Guarda só os últimos N ids impressos. */
export function rememberPrinted(list: string[], id: string, max = 500): string[] {
  return [...list.filter(x => x !== id), id].slice(-max);
}
