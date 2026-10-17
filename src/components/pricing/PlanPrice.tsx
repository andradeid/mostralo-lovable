import { useMostraloPlans } from '@/hooks/useMostraloPlans';
import { formatPlanMoney } from '@/lib/mostraloPricing';

export interface PlanPriceProps { name?: string; monthly?: boolean }
export function PlanPrice({ name = 'Essencial', monthly = false }: PlanPriceProps) {
  const { plans, isPending, isError } = useMostraloPlans();
  const plan = plans.find(p => p.name === name);
  if (!plan) return <span>{isPending ? 'Carregando…' : isError ? 'Preço indisponível' : 'Consulte os planos'}</span>;
  return <span>{plan.name === 'Sob medida' ? 'A partir de ' : ''}{formatPlanMoney(plan.price)}{monthly ? '/mês' : ''}</span>;
}