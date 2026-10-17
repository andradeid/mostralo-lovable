import type { StoreBillingCycle } from './annual-pricing.ts';

export function selectedBillingCycle(notes: string | null | undefined): StoreBillingCycle | null {
  const match = notes?.match(/\[billing_cycle:(monthly|annual)\]/);
  return match?.[1] === 'annual' ? 'annual' : match?.[1] === 'monthly' ? 'monthly' : null;
}

export function billingSelectionNotes(notes: string, cycle: StoreBillingCycle): string {
  return `${notes}\n[billing_cycle:${cycle}]`;
}