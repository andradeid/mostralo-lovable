import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CustomerInfo {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

export interface PlanInfo {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  plan_type: string;
  usage_limit: number | null;
}

export interface ClientSubscription {
  id: string;
  customer_id: string;
  store_id: string;
  plan_id: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'pending_payment';
  start_date: string;
  current_period_start: string;
  current_period_end: string;
  usages_this_period: number;
  payment_method: string | null;
  last_payment_date: string | null;
  next_payment_date: string | null;
  payment_amount: number | null;
  auto_renew: boolean;
  notes: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  paused_at: string | null;
  pause_reason: string | null;
  created_at: string;
  updated_at: string;
  customer?: CustomerInfo;
  plan?: PlanInfo;
}

export interface SubscriptionUsage {
  id: string;
  subscription_id: string;
  booking_id: string | null;
  service_id: string;
  used_at: string;
  notes: string | null;
  service?: { id: string; name: string; price: number };
  professional?: { id: string; name: string };
  booking?: { id: string; booking_date: string; start_time: string };
}

export interface SubscriptionCoverage {
  has_coverage: boolean;
  subscription_id?: string;
  plan_name?: string;
  usages_this_period?: number;
  usage_limit?: number | null;
  is_unlimited?: boolean;
}

export function useClientSubscriptions(storeId: string | null) {
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubscriptions = useCallback(async () => {
    if (!storeId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'list_subscriptions', storeId },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao buscar assinaturas');

      setSubscriptions(response.data.data || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar assinaturas');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const createSubscription = useCallback(async (
    customerId: string, 
    planId: string, 
    data?: Record<string, unknown>
  ) => {
    if (!storeId) return null;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'create_subscription', storeId, customerId, planId, data },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao criar assinatura');

      toast({
        title: 'Assinatura criada!',
        description: 'O cliente foi adicionado ao plano com sucesso.'
      });

      await fetchSubscriptions();
      return response.data.data;
    } catch (err) {
      console.error('Error creating subscription:', err);
      toast({
        title: 'Erro ao criar assinatura',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return null;
    }
  }, [storeId, fetchSubscriptions, toast]);

  const pauseSubscription = useCallback(async (subscriptionId: string, reason?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'pause_subscription', subscriptionId, data: { reason } },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao pausar assinatura');

      toast({
        title: 'Assinatura pausada',
        description: 'A assinatura foi pausada com sucesso.'
      });

      await fetchSubscriptions();
      return true;
    } catch (err) {
      console.error('Error pausing subscription:', err);
      toast({
        title: 'Erro ao pausar assinatura',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return false;
    }
  }, [fetchSubscriptions, toast]);

  const resumeSubscription = useCallback(async (subscriptionId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'resume_subscription', subscriptionId },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao reativar assinatura');

      toast({
        title: 'Assinatura reativada',
        description: 'A assinatura foi reativada com sucesso.'
      });

      await fetchSubscriptions();
      return true;
    } catch (err) {
      console.error('Error resuming subscription:', err);
      toast({
        title: 'Erro ao reativar assinatura',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return false;
    }
  }, [fetchSubscriptions, toast]);

  const cancelSubscription = useCallback(async (subscriptionId: string, reason?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'cancel_subscription', subscriptionId, data: { reason } },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao cancelar assinatura');

      toast({
        title: 'Assinatura cancelada',
        description: 'A assinatura foi cancelada com sucesso.'
      });

      await fetchSubscriptions();
      return true;
    } catch (err) {
      console.error('Error canceling subscription:', err);
      toast({
        title: 'Erro ao cancelar assinatura',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return false;
    }
  }, [fetchSubscriptions, toast]);

  const renewSubscription = useCallback(async (subscriptionId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'renew_subscription', subscriptionId },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao renovar assinatura');

      toast({
        title: 'Assinatura renovada!',
        description: 'O período foi renovado com sucesso.'
      });

      await fetchSubscriptions();
      return true;
    } catch (err) {
      console.error('Error renewing subscription:', err);
      toast({
        title: 'Erro ao renovar assinatura',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return false;
    }
  }, [fetchSubscriptions, toast]);

  const checkCoverage = useCallback(async (
    customerId: string, 
    serviceId: string
  ): Promise<SubscriptionCoverage> => {
    if (!storeId) return { has_coverage: false };

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        return { has_coverage: false };
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'check_coverage', storeId, customerId, serviceId },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error || !response.data?.success) {
        return { has_coverage: false };
      }

      return response.data.data || { has_coverage: false };
    } catch (err) {
      console.error('Error checking coverage:', err);
      return { has_coverage: false };
    }
  }, [storeId]);

  const registerUsage = useCallback(async (
    subscriptionId: string,
    serviceId: string,
    data?: { bookingId?: string; professionalId?: string; notes?: string }
  ) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'register_usage', subscriptionId, serviceId, data },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || 'Erro ao registrar uso');

      return response.data.data;
    } catch (err) {
      console.error('Error registering usage:', err);
      toast({
        title: 'Erro ao registrar uso',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  const listUsages = useCallback(async (subscriptionId: string): Promise<SubscriptionUsage[]> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        return [];
      }

      const response = await supabase.functions.invoke('manage-client-subscriptions', {
        body: { action: 'list_usages', subscriptionId },
        headers: { Authorization: `Bearer ${session.session.access_token}` }
      });

      if (response.error || !response.data?.success) {
        return [];
      }

      return response.data.data || [];
    } catch (err) {
      console.error('Error listing usages:', err);
      return [];
    }
  }, []);

  return {
    subscriptions,
    loading,
    error,
    fetchSubscriptions,
    createSubscription,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    renewSubscription,
    checkCoverage,
    registerUsage,
    listUsages
  };
}
