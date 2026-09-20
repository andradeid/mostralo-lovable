/**
 * Utilitários de cálculo de MRR para o painel master admin.
 *
 * Regras:
 * - Só entram lojas com status 'active' E billing_enabled = true
 *   (lojas de teste/cortesia não devem inflar as métricas).
 * - O valor da loja (custom_monthly_price ?? plans.price) está no ciclo
 *   do plano, então precisa ser normalizado para mensal antes de somar.
 */

export type BillingCycle = 'monthly' | 'quarterly' | 'biannual' | 'annual' | null | undefined;

/** Divisor de meses por ciclo de cobrança. Ciclo desconhecido = mensal. */
export const cycleMonths = (cycle: BillingCycle): number => {
  switch (cycle) {
    case 'quarterly':
      return 3;
    case 'biannual':
      return 6;
    case 'annual':
      return 12;
    default:
      return 1;
  }
};

/** Converte um valor no ciclo do plano para o equivalente mensal. */
export const normalizeToMonthly = (value: number, cycle: BillingCycle): number =>
  value / cycleMonths(cycle);

interface StoreLike {
  id?: string;
  custom_monthly_price?: number | string | null;
  plans?: { price?: number | string | null; billing_cycle?: BillingCycle } | null;
}

/**
 * Calcula o valor mensal efetivo de uma loja.
 * Prioridade: custom_monthly_price > (plans.price - desconto de cupom).
 */
export const storeMonthlyValue = (store: StoreLike, couponDiscount = 0): number => {
  const plan = store.plans;
  if (!plan) return 0;

  const planPrice = Number(plan.price ?? 0);
  const effectivePrice =
    store.custom_monthly_price !== null && store.custom_monthly_price !== undefined
      ? Number(store.custom_monthly_price)
      : Math.max(0, planPrice - couponDiscount);

  return normalizeToMonthly(effectivePrice, plan.billing_cycle);
};

/** MRR do conjunto de lojas já filtrado. */
export const calculateMRR = (
  stores: StoreLike[],
  discountMap?: Map<string, number>
): number =>
  stores.reduce(
    (sum, store) => sum + storeMonthlyValue(store, (store.id && discountMap?.get(store.id)) || 0),
    0
  );

/** Ticket médio protegido contra divisão por zero. */
export const calculateAvgTicket = (mrr: number, storeCount: number): number =>
  storeCount > 0 ? mrr / storeCount : 0;
