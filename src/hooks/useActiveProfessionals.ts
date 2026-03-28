import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ActiveProfessional {
  id: string;
  name: string;
  photo_url?: string | null;
  specialty?: string | null;
}

/**
 * Hook compartilhado para buscar profissionais ativos de uma loja.
 * staleTime de 5 minutos para evitar seq scans repetitivos no banco.
 * Todos os componentes do dashboard devem usar este hook em vez de
 * queries independentes à tabela professionals.
 */
export function useActiveProfessionals(storeId: string | null) {
  return useQuery<ActiveProfessional[]>({
    queryKey: ['active-professionals', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('professionals')
        .select('id, name, photo_url, specialty')
        .eq('store_id', storeId)
        .eq('is_active', true);
      if (error) throw error;
      return (data ?? []) as ActiveProfessional[];
    },
    enabled: !!storeId,
    staleTime: 300_000, // 5 minutos — profissionais raramente mudam
    gcTime: 600_000, // 10 minutos em cache
  });
}
