// Agendamentos do período visível na Agenda: busca ao trocar data/visão e a cada 15 s
// com a aba visível. Código movido da BookingCalendarPage sem mudança
// (mesma busca, mesmas dependências, mesma ordem dos efeitos).
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import type { Booking, useBooking } from '@/hooks/useBooking';
import { useBookingAutoStatus } from '@/hooks/useBookingAutoStatus';
import { bookingRangeForView, type ViewMode } from '@/lib/bookingCalendar/calendarGrid';

interface Params {
  storeId: string | null;
  bookingEnabled: boolean;
  isMobile: boolean;
  isPageVisible: boolean;
  fetchBookings: ReturnType<typeof useBooking>['fetchBookings'];
  selectedDate: Date;
  viewMode: ViewMode;
  mobileViewMode: ViewMode;
}

export function useCalendarBookings({ storeId, bookingEnabled, isMobile, isPageVisible, fetchBookings, selectedDate, viewMode, mobileViewMode }: Params) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const refetchBookings = useCallback(async () => {
    if (!storeId) return;
    
    setLoadingBookings(true);
    try {
      // Determine effective view mode (mobile uses its own toggle)
      const effectiveMode = isMobile ? mobileViewMode : viewMode;
      
      const { start, end } = bookingRangeForView(effectiveMode, selectedDate);
      
      const data = await fetchBookings(
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  }, [storeId, selectedDate, viewMode, mobileViewMode, isMobile, fetchBookings]);

  // Auto-update booking statuses based on time (confirmed→in_progress→completed)
  // Status automático agora roda no servidor (rotina booking-auto-status, a cada 5 min).
  // A agenda só atualiza a tela pelo polling abaixo.
  useBookingAutoStatus(bookings, false, refetchBookings);

  // Fetch bookings when date/view changes
  useEffect(() => {
    refetchBookings();
  }, [refetchBookings]);

  // Polling setorial da agenda administrativa
  useEffect(() => {
    if (!storeId || !bookingEnabled || !isPageVisible) return;

    const interval = window.setInterval(() => {
      refetchBookings();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [storeId, bookingEnabled, isPageVisible, refetchBookings]);

  return { bookings, loadingBookings, refetchBookings };
}
