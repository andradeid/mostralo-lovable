import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMasterWhatsApp } from '@/hooks/useMasterWhatsApp';
import { PLAN_PRESENTATION } from '@/lib/planPresentation';
import { publicModuleName, type CatalogPlan, type StoreBillingCycle } from '@/lib/mostraloPricing';
import { cn } from '@/lib/utils';
import { PlanBillingPrice } from './PlanBillingPrice';
import { PlanDetails } from './PlanDetails';

export interface MostraloPlanCardProps {
  plan: CatalogPlan;
  selected?: boolean;
  disabled?: boolean;
  value?: StoreBillingCycle;
  onValueChange?: (cycle: StoreBillingCycle) => void;
  onSelect?: (cycle: StoreBillingCycle) => void;
  actionLabel?: string;
}

export function MostraloPlanCard({ plan, selected, disabled, value, onValueChange, onSelect, actionLabel = 'Assinar agora' }: MostraloPlanCardProps) {
  const [localCycle, setLocalCycle] = useState<StoreBillingCycle>(plan.annual_enabled ? 'annual' : 'monthly');
  const cycle = plan.annual_enabled ? value ?? localCycle : 'monthly';
  const popular = plan.name === 'Completo';
  const custom = plan.name === 'Sob medida';
  const presentation = PLAN_PRESENTATION[plan.name];
  const { getWhatsAppLink } = useMasterWhatsApp();
  return <Card className={cn('flex flex-col min-w-0', popular && 'border-primary', selected && 'ring-2 ring-primary')}>
    <CardHeader className="space-y-3">
      <div className="h-6">{popular && <Badge>Mais escolhido</Badge>}</div>
      <CardTitle className="text-2xl">{plan.name}</CardTitle>
      <CardDescription className="min-h-10">{presentation?.audience ?? publicModuleName(plan.description ?? '')}</CardDescription>
      <PlanBillingPrice plan={plan} value={cycle} onValueChange={next => { setLocalCycle(next); onValueChange?.(next); }} />
    </CardHeader>
    <CardContent className="flex flex-1 flex-col gap-4">
      <ul className="space-y-2 flex-1">{(presentation?.highlights ?? plan.plan_modules.map(module => publicModuleName(module.modules.name))).slice(0, 4).map(highlight => <li key={highlight} className="flex gap-2 text-sm"><Check className="h-4 w-4 shrink-0 text-primary mt-0.5" /><span>{highlight}</span></li>)}</ul>
      {custom ? <Button type="button" asChild variant="outline" className="w-full h-auto min-h-11 whitespace-normal"><a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 mr-2 shrink-0" />Falar com especialista</a></Button> : onSelect ? <Button type="button" disabled={disabled} onClick={() => onSelect(cycle)} className="w-full h-auto min-h-11 whitespace-normal">{selected ? 'Plano selecionado' : actionLabel}</Button> : <Button asChild className="w-full h-auto min-h-11 whitespace-normal"><Link to={`/assinar?plan=${plan.id}&billing_cycle=${cycle}`}>{actionLabel}</Link></Button>}
      <PlanDetails plan={plan} />
    </CardContent>
  </Card>;
}