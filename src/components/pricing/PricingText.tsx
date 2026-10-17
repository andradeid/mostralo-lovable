import { useMostraloPlans } from '@/hooks/useMostraloPlans';
import { formatPlanMoney, PRICING_ASSURANCE, publicModuleName, type CatalogPlan } from '@/lib/mostraloPricing';

export function resolvePricingText(text: string, plans: CatalogPlan[]): string {
  return publicModuleName(text).split('\n').map(line => {
    const name = /Sob medida|Empresarial|Premium/i.test(line) ? 'Sob medida' : /Completo|Profissional/i.test(line) ? 'Completo' : /Agenda/i.test(line) ? 'Agenda' : 'Essencial';
    const plan = plans.find(p => p.name === name);
    return line.replace(/valor do plano vigente(?:\/mês)?/g, plan ? `${plan.name === 'Sob medida' ? 'a partir de ' : ''}${formatPlanMoney(plan.price)}/mês` : 'consulte os planos atuais');
  }).join('\n');
}

export function pricingCatalogText(plans: CatalogPlan[]): string {
  return `\n\n## Planos Mostralo atuais\n${plans.map(p => `### ${p.name}: ${p.name === 'Sob medida' ? 'a partir de ' : ''}${formatPlanMoney(p.price)}/mês\n${publicModuleName(p.description ?? '')}\n${p.plan_modules.map(m => `- ${publicModuleName(m.modules.name)}`).join('\n')}`).join('\n\n')}\n${PRICING_ASSURANCE}`;
}

export function PricingText({ text }: { text: string }) {
  const { plans } = useMostraloPlans();
  return <>{resolvePricingText(text, plans)}</>;
}