// Funções que as peças da Agenda recebem da página (buscar nomes, abrir ações, recarregar).
import type { Booking } from '@/hooks/useBooking';
import type { CalendarLookups } from '@/lib/bookingCalendar/calendarGrid';

export type CalendarHelpers = CalendarLookups & {
  getBookingsForDay: (date: Date) => Booking[];
  handleBookingClick: (booking: Booking) => void;
  refetchBookings: () => Promise<void>;
};
