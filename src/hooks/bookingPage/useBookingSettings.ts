// Configurações públicas de agendamento da loja e o serviço mais agendado (selo "Mais escolhido").
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useBookingSettings(storeId: string | undefined) {
  // Serviço realmente mais agendado (90 dias, mín. 5). Sem dados suficientes, não mostra selo.
  const { data: mostBookedServiceId } = useQuery({
    queryKey: ['most-booked-service', storeId],
    queryFn: async () => {
      const { data } = await (supabase as any).rpc('get_most_booked_service', { p_store_id: storeId! });
      return (data as string | null) ?? null;
    },
    enabled: !!storeId,
    staleTime: 10 * 60_000,
  });

  // Fetch booking settings for the store
  const { data: bookingSettings } = useQuery({
    queryKey: ['booking-settings-public', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('booking_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
      if (error) {
        console.error('Error fetching booking settings:', error);
        return null;
      }
      return data;
    },
    enabled: !!storeId,
    staleTime: 5 * 60_000, // 5min — configs raramente mudam
    gcTime: 10 * 60_000,
  });

  return { mostBookedServiceId, bookingSettings };
}

export type PublicBookingSettings = ReturnType<typeof useBookingSettings> extends { bookingSettings: infer T } ? T : never;
