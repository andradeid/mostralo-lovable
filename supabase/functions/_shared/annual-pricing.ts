/** Shared browser/server calculation: the annual total uses rounded monthly cents. */
export function calculateAnnualPricing(price: number, discountPercent: number) {
  const safePrice = Number.isFinite(price) ? Math.max(0, price) : 0;
  const discount = Number.isFinite(discountPercent) ? Math.min(90, Math.max(0, discountPercent)) : 0;
  const monthlyCents = Math.round(safePrice * (1 - discount / 100) * 100 + Number.EPSILON);
  const annualCents = monthlyCents * 12;
  return { monthly: monthlyCents / 100, annual: annualCents / 100, savings: Math.round(safePrice * 1200 - annualCents) / 100, discountPercent: discount };
}

export type StoreBillingCycle = 'monthly' | 'annual';

export interface BillingPlan {
  price: number;
  billing_cycle: string | null;
  annual_enabled?: boolean;
  annual_discount_percent?: number;
}

/** Explicit store choices override the plan; null retains the legacy amount and interval. */
export function resolveStoreBilling(plan: BillingPlan, cycle: string | null, customPrice: number | null) {
  const annual = cycle === 'annual' && plan.annual_enabled === true;
  const intervals: Record<string, number> = { monthly: 1, quarterly: 3, biannual: 6, annual: 12 };
  const intervalMonths = annual ? 12 : cycle === 'monthly' ? 1 : intervals[plan.billing_cycle ?? 'monthly'] ?? 1;
  const monthly = calculateAnnualPricing(Number(plan.price), Number(plan.annual_discount_percent ?? 0)).monthly;
  const amount = annual ? Math.round(Number(customPrice ?? monthly) * 1200) / 100 : Number(customPrice ?? plan.price);
  return { intervalMonths, amount, annual, cycle: annual ? 'annual' : cycle === 'monthly' ? 'monthly' : plan.billing_cycle ?? 'monthly' };
}