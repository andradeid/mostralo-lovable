import { useMostraloPlans } from '@/hooks/useMostraloPlans';
import { useMasterWhatsApp } from '@/hooks/useMasterWhatsApp';
import { Button } from '@/components/ui/button';
import { FOUNDER_PRICE, formatPlanMoney } from '@/lib/mostraloPricing';

export function FounderOffer() {
  const { availability } = useMostraloPlans();
  const { getWhatsAppLink } = useMasterWhatsApp();
  if (!availability || availability.remaining <= 0) return null;
  return <section className="border-y border-primary/30 bg-primary/10 py-10"><div className="container px-4 text-center space-y-4">
    <h3 className="text-2xl font-bold text-foreground">Sócio fundador</h3>
    <p className="text-foreground">As 10 primeiras barbearias pagam {formatPlanMoney(FOUNDER_PRICE).replace(',00', '')}/mês para sempre no plano Agenda. Restam {availability.remaining} vagas.</p>
    <Button asChild><a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer">Quero ser sócio fundador</a></Button>
  </div></section>;
}