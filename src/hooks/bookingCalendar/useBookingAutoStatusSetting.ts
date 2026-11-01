// Configuração "status automático" da loja (booking_settings.auto_status_enabled).
// Código movido da BookingCalendarPage sem mudança (mesma consulta).
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useBookingAutoStatusSetting(storeId: string | null, bookingEnabled: boolean) {
  // Fetch auto_status_enabled from booking_settings
  return useQuery({
    queryKey: ['booking-settings-auto-status', storeId],
    queryFn: async () => {
      if (!storeId) return false;
      const { data } = await supabase
        .from('booking_settings' as any)
        .select('auto_status_enabled')
        .eq('store_id', storeId)
        .single();
      return (data as any)?.auto_status_enabled ?? false;
    },
    enabled: !!storeId && bookingEnabled,
  });
}
