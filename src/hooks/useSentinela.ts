import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SentinelaRule {
  id: string;
  store_id: string;
  product_id: string | null;
  category_id: string | null;
  recurrence_days: number;
  reminder_days_before: number;
  message_template: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
}

export interface SentinelaReminder {
  id: string;
  store_id: string;
  customer_id: string;
  product_id: string | null;
  order_id: string | null;
  rule_id: string | null;
  scheduled_for: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled' | 'converted';
  sent_at: string | null;
  message_sent: string | null;
  error_message: string | null;
  conversion_order_id: string | null;
  converted_at: string | null;
  created_at: string;
  customer?: { id: string; name: string; phone: string } | null;
  product?: { id: string; name: string } | null;
}

export interface CreateRuleParams {
  store_id: string;
  product_id?: string | null;
  category_id?: string | null;
  recurrence_days: number;
  reminder_days_before?: number;
  message_template?: string | null;
  is_active?: boolean;
}

export interface StoreConfig {
  sentinela_enabled: boolean;
  sentinela_default_template: string | null;
}

export function useSentinela(storeId: string | null) {
  const queryClient = useQueryClient();

  // Buscar configuração da loja
  const { data: storeConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['sentinela-config', storeId],
    queryFn: async (): Promise<StoreConfig | null> => {
      if (!storeId) return null;
      
      const { data, error } = await supabase
        .from('stores')
        .select('sentinela_enabled, sentinela_default_template')
        .eq('id', storeId)
        .single();

      if (error) throw error;
      return data as StoreConfig;
    },
    enabled: !!storeId
  });

  // Buscar regras
  const { data: rules, isLoading: isLoadingRules } = useQuery({
    queryKey: ['sentinela-rules', storeId],
    queryFn: async (): Promise<SentinelaRule[]> => {
      if (!storeId) return [];
      
      const { data, error } = await supabase
        .from('sentinela_rules')
        .select(`
          *,
          product:products(id, name),
          category:categories(id, name)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SentinelaRule[];
    },
    enabled: !!storeId
  });

  // Buscar lembretes
  const { data: reminders, isLoading: isLoadingReminders } = useQuery({
    queryKey: ['sentinela-reminders', storeId],
    queryFn: async (): Promise<SentinelaReminder[]> => {
      if (!storeId) return [];
      
      const { data, error } = await supabase
        .from('sentinela_reminders')
        .select(`
          *,
          customer:customers(id, name, phone),
          product:products(id, name)
        `)
        .eq('store_id', storeId)
        .order('scheduled_for', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as SentinelaReminder[];
    },
    enabled: !!storeId
  });

  // Atualizar configuração da loja
  const updateConfig = useMutation({
    mutationFn: async (config: Partial<StoreConfig>) => {
      if (!storeId) throw new Error('Store ID não definido');

      const { error } = await supabase
        .from('stores')
        .update(config)
        .eq('id', storeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinela-config', storeId] });
      toast.success('Configuração atualizada');
    },
    onError: (error) => {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração');
    }
  });

  // Criar regra
  const createRule = useMutation({
    mutationFn: async (params: CreateRuleParams) => {
      const { data, error } = await supabase
        .from('sentinela_rules')
        .insert({
          store_id: params.store_id,
          product_id: params.product_id || null,
          category_id: params.category_id || null,
          recurrence_days: params.recurrence_days,
          reminder_days_before: params.reminder_days_before || 3,
          message_template: params.message_template || null,
          is_active: params.is_active ?? true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinela-rules', storeId] });
      toast.success('Regra criada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar regra:', error);
      toast.error('Erro ao criar regra');
    }
  });

  // Atualizar regra
  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SentinelaRule> & { id: string }) => {
      const { error } = await supabase
        .from('sentinela_rules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinela-rules', storeId] });
      toast.success('Regra atualizada');
    },
    onError: (error) => {
      console.error('Erro ao atualizar regra:', error);
      toast.error('Erro ao atualizar regra');
    }
  });

  // Deletar regra
  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('sentinela_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinela-rules', storeId] });
      toast.success('Regra removida');
    },
    onError: (error) => {
      console.error('Erro ao remover regra:', error);
      toast.error('Erro ao remover regra');
    }
  });

  // Cancelar lembrete
  const cancelReminder = useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from('sentinela_reminders')
        .update({ status: 'cancelled' })
        .eq('id', reminderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinela-reminders', storeId] });
      toast.success('Lembrete cancelado');
    },
    onError: (error) => {
      console.error('Erro ao cancelar lembrete:', error);
      toast.error('Erro ao cancelar lembrete');
    }
  });

  // Estatísticas
  const stats = {
    totalRules: rules?.length || 0,
    activeRules: rules?.filter(r => r.is_active).length || 0,
    pendingReminders: reminders?.filter(r => r.status === 'pending').length || 0,
    sentReminders: reminders?.filter(r => r.status === 'sent').length || 0,
    convertedReminders: reminders?.filter(r => r.status === 'converted').length || 0,
    failedReminders: reminders?.filter(r => r.status === 'failed').length || 0,
    conversionRate: reminders && reminders.length > 0
      ? Math.round((reminders.filter(r => r.status === 'converted').length / reminders.filter(r => r.status === 'sent').length) * 100) || 0
      : 0
  };

  return {
    storeConfig,
    rules,
    reminders,
    stats,
    isLoading: isLoadingConfig || isLoadingRules || isLoadingReminders,
    updateConfig,
    createRule,
    updateRule,
    deleteRule,
    cancelReminder
  };
}
