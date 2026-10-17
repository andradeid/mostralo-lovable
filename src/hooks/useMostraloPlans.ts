import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { publicPlanOrder, type CatalogPlan } from '@/lib/mostraloPricing';

export interface PricingCatalog { plans: CatalogPlan[]; availability: { count: number; remaining: number; nextNumber: number | null } }
export async function fetchMostraloCatalog(): Promise<PricingCatalog> {
  const { data, error } = await supabase.functions.invoke<PricingCatalog>('mostralo-pricing', { body: { action: 'catalog' } });
  if (error || !data) throw new Error('Não foi possível carregar os planos. Tente novamente.');
  return { ...data, plans: publicPlanOrder(data.plans) };
}
export function useMostraloPlans(priority: 'Agenda' | 'Essencial' = 'Agenda') {
  const query = useQuery({ queryKey: ['mostralo-pricing-catalog'], queryFn: fetchMostraloCatalog, staleTime: 60_000, refetchOnWindowFocus: false, refetchInterval: 120_000 });
  return { ...query, plans: publicPlanOrder(query.data?.plans ?? [], priority), availability: query.data?.availability };
}