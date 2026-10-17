import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMostraloPlans } from '@/hooks/useMostraloPlans';
import { PRICING_ASSURANCE } from '@/lib/mostraloPricing';
import { MostraloPlanCard } from './MostraloPlanCard';
import { FounderOffer } from './FounderOffer';

export interface MostraloPlansSectionProps { priority?: 'Agenda' | 'Essencial'; founder?: boolean; id?: string }
export function MostraloPlansSection({ priority = 'Agenda', founder = false, id = 'planos' }: MostraloPlansSectionProps) {
  const { plans, isPending, isError, refetch } = useMostraloPlans(priority);
  return <>
    <section id={id} className="bg-background py-12 md:py-20 text-foreground">
      <div className="container px-4 space-y-8">
        <header className="text-center"><h2 className="font-display text-3xl md:text-4xl font-bold">Planos Mostralo</h2></header>
        {isPending && <div role="status" className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" aria-label="Carregando planos" /></div>}
        {isError && <div role="alert" className="text-center space-y-3"><p>Não foi possível carregar os planos.</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></div>}
        {!isPending && !isError && plans.length === 0 && <p className="text-center text-muted-foreground">Consulte nossa equipe sobre os planos disponíveis.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {plans.map(plan => <MostraloPlanCard key={plan.id} plan={plan} />)}
        </div>
        <p className="text-center text-sm text-muted-foreground">{PRICING_ASSURANCE}</p>
      </div>
    </section>
    {founder && <FounderOffer />}
  </>;
}