// Margem do produto (sobre o preço de venda) e preço de venda efetivo (oferta, se houver).
// Funções puras: formulário de produto e tela de Estoque usam as mesmas.

export interface SalePriceInput {
  price: number | string | null | undefined;
  is_on_offer?: boolean | null;
  offer_price?: number | string | null;
}

/** Preço que o cliente paga: o da oferta quando ligada e menor que o preço; senão, o preço. */
export function effectiveSalePrice({ price, is_on_offer, offer_price }: SalePriceInput): number {
  const base = Number(price) || 0;
  const offer = Number(offer_price) || 0;
  if (is_on_offer && offer > 0 && offer < base) return offer;
  return base;
}

export interface Margin {
  /** Lucro por unidade em reais (venda − custo), 2 casas. */
  profit: number;
  /** Margem em % sobre o preço de venda, 1 casa. */
  percent: number;
}

/** Margem e lucro por unidade. null quando não há preço de venda ou custo informado. */
export function calculateMargin(salePrice: number | null | undefined, cost: number | null | undefined): Margin | null {
  const sale = Number(salePrice);
  if (cost === null || cost === undefined || Number.isNaN(Number(cost))) return null;
  if (!Number.isFinite(sale) || sale <= 0) return null;
  const c = Number(cost);
  const profit = Math.round((sale - c) * 100) / 100;
  const percent = Math.round(((sale - c) / sale) * 1000) / 10;
  return { profit, percent };
}

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

/** "Margem: 42% · lucro R$ 8,40" (ou "prejuízo" quando o custo passa do preço). */
export function formatMargin(m: Margin | null): string {
  if (!m) return '';
  const pct = m.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  if (m.profit < 0) return `Margem: ${pct}% · prejuízo ${brl(Math.abs(m.profit))}`.replace(/ /g, ' ');
  return `Margem: ${pct}% · lucro ${brl(m.profit)}`.replace(/ /g, ' ');
}

/** Valor do estoque a custo (estoque × custo). null quando falta o custo. */
export function stockValue(quantity: number | null | undefined, cost: number | null | undefined): number | null {
  if (cost === null || cost === undefined) return null;
  const q = Math.max(0, Number(quantity) || 0);
  return Math.round(q * Number(cost) * 100) / 100;
}
