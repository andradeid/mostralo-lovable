/** Valor em reais no padrão brasileiro: 1234.5 → "R$ 1.234,50" */
export const brl = (value: unknown): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
