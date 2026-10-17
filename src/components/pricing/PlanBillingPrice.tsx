import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateAnnualPricing, formatPlanMoney, type CatalogPlan, type StoreBillingCycle } from '@/lib/mostraloPricing';

export interface PlanBillingPriceProps { plan: CatalogPlan; value?: StoreBillingCycle; onValueChange?: (value: StoreBillingCycle) => void }

export function PlanBillingPrice({ plan, value, onValueChange }: PlanBillingPriceProps) {
  const [localMode, setLocalMode] = useState<StoreBillingCycle>('annual');
  const mode = value ?? localMode;
  const setMode = (next: string) => { if (next !== 'annual' && next !== 'monthly') return; setLocalMode(next); onValueChange?.(next); };
  const annual = plan.annual_enabled === true && mode === 'annual';
  const values = calculateAnnualPricing(plan.price, Number(plan.annual_discount_percent ?? 0));
  return <div className="space-y-3">
    {plan.annual_enabled && <Tabs value={mode} onValueChange={setMode} aria-label={`Pagamento do plano ${plan.name}`}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="annual">Anual -{values.discountPercent}%</TabsTrigger>
        <TabsTrigger value="monthly">Mensal</TabsTrigger>
      </TabsList>
    </Tabs>}
    <p className="text-2xl font-bold text-primary">
      {plan.name === 'Sob medida' && <span className="block text-sm font-normal">A partir de</span>}
      {formatPlanMoney(annual ? values.monthly : plan.price)}<span className="text-sm font-normal text-muted-foreground">/mês</span>
    </p>
    {annual && <p className="text-xs leading-relaxed text-muted-foreground">cobrado {formatPlanMoney(values.annual)} por ano · você economiza {formatPlanMoney(values.savings)}</p>}
  </div>;
}