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
        const today = now.toISOString().split('T')[0];
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const todayBookings = bookings.filter(b => b.booking_date === today);
        const updates: { id: string; newStatus: string }[] = [];

        for (const b of todayBookings) {
          const startTime = b.start_time.slice(0, 5);
          const endTime = b.end_time.slice(0, 5);

          // Confirmed + past start time + before end time → in_progress
          if (b.status === 'confirmed' && startTime <= currentTime && endTime > currentTime) {
            updates.push({ id: b.id, newStatus: 'in_progress' });
          }

          // Confirmed or in_progress + past end time → completed
          if ((b.status === 'confirmed' || b.status === 'in_progress') && endTime <= currentTime) {
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
