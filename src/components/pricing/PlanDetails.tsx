import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { groupedPlanModules } from '@/lib/planPresentation';
import type { CatalogPlan } from '@/lib/mostraloPricing';

export interface PlanDetailsProps { plan: CatalogPlan }
export function PlanDetails({ plan }: PlanDetailsProps) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const groups = groupedPlanModules(plan.plan_modules);
  const details = <div className="space-y-5">{groups.map(([group, labels]) => <section key={group} className="space-y-2">
    <h4 className="font-semibold">{group}</h4>
    <ul className="space-y-2">{labels.map(label => <li key={label} className="flex gap-2 text-sm"><Check className="h-4 w-4 shrink-0 text-primary" />{label}</li>)}</ul>
  </section>)}{groups.length === 0 && <p className="text-sm text-muted-foreground">Consulte nossa equipe sobre os recursos deste plano.</p>}</div>;
  return <>
    <Button type="button" variant="link" className="w-full text-muted-foreground" aria-expanded={open} onClick={() => { setMobile(window.matchMedia('(max-width: 767px)').matches); setOpen(!open); }}>Saiba mais<ChevronDown className="ml-1 h-3 w-3" /></Button>
    {mobile && open && <div className="border-t pt-4">{details}</div>}
    <Dialog open={open && !mobile} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{plan.name}</DialogTitle><DialogDescription>O que está incluso no plano</DialogDescription></DialogHeader>{details}</DialogContent></Dialog>
  </>;
}