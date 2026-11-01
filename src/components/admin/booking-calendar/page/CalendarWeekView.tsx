// Visão Semana (desktop): cabeçalho dos dias e uma coluna de cartões por dia.
// JSX movido da BookingCalendarPage sem mudança.
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarBookingCard } from './CalendarBookingCard';
import type { ViewMode } from '@/lib/bookingCalendar/calendarGrid';
import type { CalendarHelpers } from './calendarHelpers';

interface CalendarWeekViewProps {
  weekDays: Date[];
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  calendar: CalendarHelpers;
}

export function CalendarWeekView({ weekDays, setSelectedDate, setViewMode, calendar }: CalendarWeekViewProps) {
  const { getBookingsForDay } = calendar;

  return (
    <div className="rounded-xl border bg-card overflow-hidden flex-1 flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 divide-x divide-border/50 border-b bg-muted/20">
        {weekDays.map(day => (
          <button
            key={day.toISOString()}
            className={cn(
              "py-3 px-1 text-center cursor-pointer transition-colors hover:bg-muted/40",
              isToday(day) && "bg-primary/5"
            )}
            onClick={() => {
              setSelectedDate(day);
              setViewMode('day');
            }}
          >
            <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
              {format(day, 'EEE', { locale: ptBR })}
            </div>
            <div className={cn(
              "text-lg font-bold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors",
              isToday(day) && "bg-primary text-primary-foreground",
              !isToday(day) && "text-foreground"
            )}>
              {format(day, 'd')}
            </div>
          </button>
        ))}
      </div>

      {/* Booking columns */}
      <div className="grid grid-cols-7 divide-x divide-border/30 flex-1">
        {weekDays.map(day => {
          const dayBookings = getBookingsForDay(day);
          return (
            <div key={day.toISOString()} className="p-1.5 space-y-1.5 overflow-y-auto">
              {dayBookings.length === 0 ? (
                <div className="text-[11px] text-muted-foreground/50 text-center py-6">
                  —
                </div>
              ) : (
                dayBookings.map(booking => (
                  <CalendarBookingCard key={booking.id} booking={booking} compact calendar={calendar} />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
