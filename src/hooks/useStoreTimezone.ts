import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useStoreTimezone(storeId?: string | null, publicOnly = false) {
  return useQuery({
    queryKey: ['store-timezone', storeId, publicOnly],
    enabled: !!storeId && !publicOnly,
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