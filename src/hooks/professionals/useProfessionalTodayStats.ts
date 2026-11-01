// Números de hoje de cada profissional (agendamentos, faturamento, ocupação).
// Código movido da ProfessionalsPage sem mudança (mesmas consultas, mesma ordem).
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildProfessionalTodayStats } from '@/lib/professionals/professionalsList';

// Hook to fetch today's booking stats per professional
export function useProfessionalTodayStats(professionalIds: string[], storeId: string | null) {
  return useQuery({
    queryKey: ['professional-today-stats', professionalIds, storeId],
    queryFn: async () => {
      if (!storeId || professionalIds.length === 0) return {};
      const today = new Date().toISOString().split('T')[0];
      
      const { data: bookings } = await supabase
        .from('bookings')
        .select('professional_id, status, price')
        .eq('store_id', storeId)
        .eq('booking_date', today)
        .in('professional_id', professionalIds);

      const { data: schedules } = await supabase
        .from('professional_schedules')
        .select('professional_id, is_available, start_time, end_time')
        .in('professional_id', professionalIds)
        .eq('day_of_week', new Date().getDay())
        .eq('is_available', true);

      return buildProfessionalTodayStats(professionalIds, bookings, schedules);
    },
    enabled: !!storeId && professionalIds.length > 0,
    staleTime: 60 * 1000,
  });
}
