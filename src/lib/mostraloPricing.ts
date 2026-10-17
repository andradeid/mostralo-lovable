export const PRICING_ASSURANCE = 'Sem comissão por pedido. Implantação grátis, 7 dias para testar e garantia de 30 dias.';
export const ANNUAL_PRICING_MESSAGE = 'Pagamento anual: 2 meses grátis — fale com a gente';
export const FOUNDER_LIMIT = 10;
export const FOUNDER_PRICE = 129;

export interface CatalogModule { module_id: string; modules: { name: string; key: string | null } }
export interface CatalogPlan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  billing_cycle: string;
  status: string;
  plan_modules: CatalogModule[];
}

// Compatibility projection for older sales tools; no billing records are changed.
export function catalogSalesPlan(plan: CatalogPlan) {
  const billing_cycle: 'monthly' | 'quarterly' | 'biannual' | 'annual' =
    plan.billing_cycle === 'annual' || plan.billing_cycle === 'quarterly' || plan.billing_cycle === 'biannual' ? plan.billing_cycle : 'monthly';
  return {
    ...plan, billing_cycle, status: 'active' as const,
    features: plan.plan_modules.map(module => publicModuleName(module.modules.name)),
    booking_white_label_enabled: false, created_at: '', updated_at: '',
    discount_percentage: null, discount_price: null, promotion_active: false,
    is_popular: plan.name === 'Completo', max_categories: null, max_products: null,
    promotion_end_date: null, promotion_start_date: null, promotion_label: null,
  };
}

export function commercialPlansText(plans: Array<{ name: string; price: number; status?: string; description?: string | null; features?: unknown }>): string {
  return `## Planos Mostralo\n${publicPlanOrder(plans).map(plan =>
    `### ${plan.name}${plan.name === 'Completo' ? ' — Mais escolhido' : ''}: ${plan.name === 'Sob medida' ? 'a partir de ' : ''}${formatPlanMoney(plan.price)}/mês\n${publicModuleName(plan.description ?? '')}\n${Array.isArray(plan.features) ? plan.features.filter((f): f is string => typeof f === 'string').map(f => `- ${publicModuleName(f)}`).join('\n') : ''}`
  ).join('\n\n')}\n${PRICING_ASSURANCE}\n${ANNUAL_PRICING_MESSAGE}`;
}

export function resolveCommercialPlaceholders(text: string, plans: Array<{ name: string; price: number }>): string {
  const essential = plans.find(plan => plan.name === 'Essencial');
  return publicModuleName(text)
    .replace(/valor do plano vigente(?:\/mês)?/g, essential ? `${formatPlanMoney(essential.price)}/mês` : 'consulte o catálogo atual')
    .replace(/R\$\s?397,90/g, essential ? formatPlanMoney(essential.price) : 'consulte o catálogo atual')
    .replace(/R\$\s?(?:4\.774,80|2\.102(?:,10)?|3\.352,10|25\.225|10\.852,10)/g, '[calcule com o plano escolhido]');
}

export function publicPlanOrder<T extends { name: string; status?: string }>(plans: T[], priority: 'Agenda' | 'Essencial' = 'Agenda'): T[] {
  const order = priority === 'Agenda' ? ['Agenda', 'Essencial', 'Completo', 'Sob medida'] : ['Essencial', 'Agenda', 'Completo', 'Sob medida'];
  return plans.filter(p => p.name !== 'Essencial Anual' && (!p.status || p.status === 'active'))
    .sort((a, b) => (order.indexOf(a.name) < 0 ? 99 : order.indexOf(a.name)) - (order.indexOf(b.name) < 0 ? 99 : order.indexOf(b.name)));
}

export const formatPlanMoney = (value: number): string => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export const publicModuleName = (name: string): string => name.replace(/cardápio digital/gi, 'Loja virtual').replace(/cardápio na mesa/gi, 'Pedidos na mesa').replace(/cardápio/gi, 'Catálogo');

export function savingsForPlan(revenue: number, price: number) {
  const fee = Math.max(0, revenue) * 0.25;
  const monthly = fee - price;
  return { fee, monthly, annual: monthly * 12, daily: monthly / 30 };
}

export function founderAvailability(reasons: Array<string | null>) {
  const founders = reasons.filter((reason): reason is string => reason?.startsWith('Sócio fundador') === true);
  const used = new Set(founders.map(reason => Number(reason.match(/^Sócio fundador (\d+)\/10/)?.[1])).filter(Number.isFinite));
  const remaining = Math.max(0, FOUNDER_LIMIT - founders.length);
  return { count: founders.length, remaining, nextNumber: remaining > 0 ? Array.from({ length: FOUNDER_LIMIT }, (_, i) => i + 1).find(n => !used.has(n)) ?? null : null };
}