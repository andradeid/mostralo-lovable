import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { leadDaysFromConfig } from '@/lib/leadTime';

/** Prazo de produção da loja em dias úteis (delivery_config.lead_time_business_days) ou null. */
export function useStoreLeadDays(storeId?: string | null) {
  return useQuery({
    queryKey: ['store-lead-days', storeId],
    enabled: !!storeId,
    staleTime: 60000,
    queryFn: async () => {
      const { data, error } = await supabase.from('stores')
        .select('delivery_config').eq('id', storeId || '').maybeSingle();
      if (error) throw error;
      return leadDaysFromConfig((data as { delivery_config?: unknown } | null)?.delivery_config);
    },
  });
}
