import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStoreTimezone(storeId?: string | null) {
  return useQuery({
    queryKey: ['store-timezone', storeId],
    enabled: !!storeId,
    staleTime: 120000,
    queryFn: async () => {
      const { data, error } = await supabase.from('stores')
        .select('timezone').eq('id', storeId || '').maybeSingle();
      if (error) throw error;
      const row = data as unknown as { timezone?: string | null } | null;
      return row?.timezone || 'America/Sao_Paulo';
    },
  });
}