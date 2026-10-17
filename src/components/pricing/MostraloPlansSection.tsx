import { Link } from 'react-router-dom';
import { Check, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMostraloPlans } from '@/hooks/useMostraloPlans';
import { useMasterWhatsApp } from '@/hooks/useMasterWhatsApp';
import { ANNUAL_PRICING_MESSAGE, PRICING_ASSURANCE, formatPlanMoney, publicModuleName } from '@/lib/mostraloPricing';
import { cn } from '@/lib/utils';
import { FounderOffer } from './FounderOffer';

export interface MostraloPlansSectionProps { priority?: 'Agenda' | 'Essencial'; founder?: boolean; id?: string }
export function MostraloPlansSection({ priority = 'Agenda', founder = false, id = 'planos' }: MostraloPlansSectionProps) {
  const { plans, isPending, isError, refetch } = useMostraloPlans(priority);
  const { getWhatsAppLink } = useMasterWhatsApp();
  return <>
    <section id={id} className="bg-background py-12 md:py-20 text-foreground">
      <div className="container px-4 space-y-8">
        <header className="text-center space-y-3"><h2 className="font-display text-3xl md:text-4xl font-bold">Planos Mostralo</h2><p className="text-muted-foreground">{PRICING_ASSURANCE}</p></header>
        {isPending && <div role="status" className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" aria-label="Carregando planos" /></div>}
        {isError && <div role="alert" className="text-center space-y-3"><p>Não foi possível carregar os planos.</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></div>}
        {!isPending && !isError && plans.length === 0 && <p className="text-center text-muted-foreground">Consulte nossa equipe sobre os planos disponíveis.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {plans.map(plan => {
            const popular = plan.name === 'Completo';
            const custom = plan.name === 'Sob medida';
            return <Card key={plan.id} className={cn('flex flex-col relative', popular && 'border-primary border-2')}>
              <CardHeader className="space-y-3">
                <div className="min-h-6">{popular ? <Badge>Mais escolhido</Badge> : ['Agenda', 'Essencial'].includes(plan.name) ? <Badge variant="secondary">Plano de entrada</Badge> : null}</div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{publicModuleName(plan.description ?? '')}</CardDescription>
                <p className="text-2xl font-bold text-primary">{custom && <span className="block text-sm font-normal">A partir de</span>}{formatPlanMoney(plan.price)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-6">
                <ul className="space-y-2 flex-1">{plan.plan_modules.map(module => <li key={module.module_id} className="flex gap-2 text-sm"><Check className="h-4 w-4 shrink-0 text-primary mt-0.5" /><span>{publicModuleName(module.modules.name)}</span></li>)}</ul>
                {plan.name === 'Agenda' && <p className="text-sm text-muted-foreground">Confirmação, lembrete e avaliação no WhatsApp com botões.</p>}
                <Button asChild variant={popular ? 'default' : 'outline'} className="w-full whitespace-normal h-auto min-h-11">{custom ? <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 mr-2 shrink-0" />Falar com especialista</a> : <Link to={`/signup?plan=${plan.id}`}>Testar {plan.name}</Link>}</Button>
              </CardContent>
            </Card>;
          })}
        </div>
        <p className="text-center"><a className="text-primary underline underline-offset-4" href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">{ANNUAL_PRICING_MESSAGE}</a></p>
      </div>
    </section>
    {founder && <FounderOffer />}
  </>;
}