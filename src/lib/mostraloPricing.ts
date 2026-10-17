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