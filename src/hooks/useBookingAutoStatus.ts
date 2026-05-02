import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Booking } from '@/hooks/useBooking';

/**
 * Hook que atualiza automaticamente o status dos agendamentos baseado no horário:
 * - confirmed + horário iniciado → in_progress
 * - in_progress/confirmed + horário finalizado → completed
 * 
 * Atualiza no banco para que relatórios reflitam corretamente.
 */
function parseBookingDateTime(date: string, time: string): Date | null {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute, second = 0] = time.split(':').map(Number);

  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  // Usa data/hora local completa para não misturar data UTC com horário local.
  return new Date(year, month - 1, day, hour, minute, second || 0);
}

export function useBookingAutoStatus(
  bookings: Booking[],
  enabled: boolean,
  onStatusChanged?: () => void
) {
  const processingRef = useRef(false);

  useEffect(() => {
    if (!enabled || bookings.length === 0) return;

    const processAutoStatus = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      try {
        const now = new Date();
        const updates: { id: string; newStatus: string }[] = [];

        for (const b of bookings) {
          const startDateTime = parseBookingDateTime(b.booking_date, b.start_time);
          const endDateTime = parseBookingDateTime(b.booking_date, b.end_time);

          if (!startDateTime || !endDateTime) continue;

          // Confirmed + past start time + before end time → in_progress
          if (b.status === 'confirmed' && startDateTime <= now && endDateTime > now) {
            updates.push({ id: b.id, newStatus: 'in_progress' });
          }

          // Só conclui automaticamente se o atendimento já estava em andamento.
          if (b.status === 'in_progress' && endDateTime <= now) {
            updates.push({ id: b.id, newStatus: 'completed' });
          }
        }

        if (updates.length > 0) {
          // Batch update in parallel
          await Promise.all(
            updates.map(({ id, newStatus }) =>
              (supabase as any)
                .from('bookings')
                .update({ status: newStatus })
                .eq('id', id)
            )
          );
          onStatusChanged?.();
        }
      } catch (err) {
        console.error('Auto-status error:', err);
      } finally {
        processingRef.current = false;
      }
    };

    // Run immediately
    processAutoStatus();

    // Run every 60 seconds
    const interval = setInterval(processAutoStatus, 60000);
    return () => clearInterval(interval);
  }, [bookings, enabled, onStatusChanged]);
}
