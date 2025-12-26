import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TableServiceConfig {
  id: string;
  store_id: string;
  require_waiter_approval: boolean;
  allow_direct_payment: boolean;
  customer_password_required: boolean;
  max_comandas_per_table: number;
  table_count: number;
  created_at: string;
  updated_at: string;
}

export function useTableServiceConfig(storeId: string | null) {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['table-service-config', storeId],
    queryFn: async () => {
      if (!storeId) return null;

      const { data, error } = await supabase
        .from('store_table_service_config')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as TableServiceConfig | null;
    },
    enabled: !!storeId
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<TableServiceConfig>) => {
      if (!storeId) throw new Error('Store ID não encontrado');

      if (config) {
        const { error } = await supabase
          .from('store_table_service_config')
          .update(updates)
          .eq('store_id', storeId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('store_table_service_config')
          .insert({ store_id: storeId, ...updates });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-service-config', storeId] });
      toast.success('Configurações salvas');
    },
    onError: (error) => {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  });

  return {
    config,
    isLoading,
    updateConfig: updateConfig.mutateAsync,
    isUpdating: updateConfig.isPending
  };
}
