// "Cancelar esta e as próximas da série" (função cancel_recurring_bookings).
// Aviso pelo WhatsApp: UMA mensagem só, na reserva escolhida, citando as outras datas.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { notifyCustomerOfCancellation } from '@/lib/bookingCancelNotice';
import { seriesCancelNotice } from '@/lib/bookingRecurrence/summary';
import { recurrenceKeys } from './useBookingRecurrence';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface CancelSeriesInput {
  bookingId: string;
  reason?: string;
  notify: boolean;
}

interface CancelSeriesResult {
  cancelled: number;
  bookingIds: string[];
  dates: string[];
}

export function useCancelBookingSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason, notify }: CancelSeriesInput): Promise<CancelSeriesResult> => {
      const { data, error } = await db.rpc('cancel_recurring_bookings', {
        p_booking_id: bookingId,
        p_reason: reason?.trim() || null,
      });
      if (error) throw error;
      const bookingIds: string[] = Array.isArray(data?.booking_ids) ? data.booking_ids.map(String) : [];
      const dates: string[] = Array.isArray(data?.dates) ? data.dates.map(String) : [];
      const result = { cancelled: Number(data?.cancelled) || bookingIds.length, bookingIds, dates };

      if (notify && bookingIds.length) {
        const idx = Math.max(0, bookingIds.indexOf(bookingId));
        const others = dates.filter((_, i) => i !== idx);
        await notifyCustomerOfCancellation(bookingIds[idx], seriesCancelNotice(reason, others));
      }
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-for-slot'] });
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.all });
      if (result.cancelled) toast.success(`${result.cancelled} ${result.cancelled === 1 ? 'agendamento cancelado' : 'agendamentos da série cancelados'}`);
      else toast.info('Nenhum agendamento futuro da série para cancelar');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar a série: ${error.message}`);
    },
  });
}
