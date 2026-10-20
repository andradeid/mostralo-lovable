// Textos do ciclo de cobrança dos planos do clube (ex.: "por mês", "/mês")
const UNIT: Record<string, string> = {
  weekly: 'semana',
  biweekly: 'quinzena',
  monthly: 'mês',
  quarterly: 'trimestre',
  biannual: 'semestre',
  annual: 'ano',
};

/** "mês", "semana"... (padrão: mês) */
export function billingCycleUnit(cycle?: string | null): string {
  return UNIT[cycle || ''] || 'mês';
}

/** "4 por mês", "1 por semana" */
export function usageLimitText(limit: number, cycle?: string | null): string {
  return `${limit} por ${billingCycleUnit(cycle)}`;
}
