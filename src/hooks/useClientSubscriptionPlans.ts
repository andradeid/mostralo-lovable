import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface IncludedService {
  id: string;
  serviceId: string;
  usageLimit: number | null;
  serviceName?: string;
  servicePrice?: number;
}

export interface ClientSubscriptionPlan {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  billing_cycle: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'biannual' | 'annual';
  plan_type: 'unlimited' | 'limited';
  usage_limit: number | null;
  is_active: boolean;
  benefits: unknown[];
  image_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  includedServices?: IncludedService[];
}

export interface CreatePlanData {
  name: string;
  description?: string;
  price: number;
  billing_cycle: string;
  plan_type: string;
  usage_limit?: number | null;
  is_active?: boolean;
  benefits?: unknown[];
  includedServices?: { serviceId: string; usageLimit?: number | null }[];
}

export function useClientSubscriptionPlans(storeId: string | null) {
  const [plans, setPlans] = useState<ClientSubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlans = useCallback(async () => {
    if (!storeId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'list_plans', storeId },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao buscar planos');

      const plansData = response.data.data.map((plan: any) => ({
        ...plan,
        includedServices: plan.plan_included_services?.map((s: any) => ({
          id: s.id,
          serviceId: s.service_id,
          usageLimit: s.usage_limit_per_service,
          serviceName: s.booking_services?.name,
          servicePrice: s.booking_services?.price
        })) || []
      }));

      setPlans(plansData);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar planos');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const createPlan = useCallback(async (data: CreatePlanData) => {
    if (!storeId) return null;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'create_plan', storeId, data },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao criar plano');

      toast({
        title: 'Plano criado!',
        description: `O plano "${data.name}" foi criado com sucesso.`
      });

      await fetchPlans();
      return response.data.data;
    } catch (err) {
      console.error('Error creating plan:', err);
      toast({
        title: 'Erro ao criar plano',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return null;
    }
  }, [storeId, fetchPlans, toast]);

  const updatePlan = useCallback(async (planId: string, data: Partial<CreatePlanData>) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'update_plan', planId, data },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao atualizar plano');

      toast({
        title: 'Plano atualizado!',
        description: 'As alterações foram salvas com sucesso.'
      });

      await fetchPlans();
      return response.data.data;
    } catch (err) {
      console.error('Error updating plan:', err);
      toast({
        title: 'Erro ao atualizar plano',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return null;
    }
  }, [fetchPlans, toast]);

  const deletePlan = useCallback(async (planId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'delete_plan', planId },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao excluir plano');

      toast({
        title: 'Plano excluído!',
        description: 'O plano foi removido com sucesso.'
      });

      await fetchPlans();
      return true;
    } catch (err) {
      console.error('Error deleting plan:', err);
      toast({
        title: 'Erro ao excluir plano',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return false;
    }
  }, [fetchPlans, toast]);

  return {
    plans,
    loading,
    error,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan
  };
}
