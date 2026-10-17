import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateAnnualPricing, formatPlanMoney, type CatalogPlan } from '@/lib/mostraloPricing';

export interface PlanBillingPriceProps { plan: CatalogPlan }

export function PlanBillingPrice({ plan }: PlanBillingPriceProps) {
  const [mode, setMode] = useState('annual');
  const annual = plan.annual_enabled === true && mode === 'annual';
  const values = calculateAnnualPricing(plan.price, Number(plan.annual_discount_percent ?? 0));
  return <div className="space-y-3">
    {plan.annual_enabled && <Tabs value={mode} onValueChange={setMode} aria-label={`Pagamento do plano ${plan.name}`}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="annual">Anual</TabsTrigger>
        <TabsTrigger value="monthly">Mensal</TabsTrigger>
      </TabsList>
    </Tabs>}
    <p className="text-2xl font-bold text-primary">
      {plan.name === 'Sob medida' && <span className="block text-sm font-normal">A partir de</span>}
      {formatPlanMoney(annual ? values.monthly : plan.price)}<span className="text-sm font-normal text-muted-foreground">/mês</span>
    </p>
    {annual && <div className="space-y-1 text-sm">
      <p className="text-muted-foreground">cobrado {formatPlanMoney(values.annual)} por ano</p>
      <p className="text-primary">Você economiza {formatPlanMoney(values.savings)} ({values.discountPercent}%)</p>
    </div>}
  </div>;
}