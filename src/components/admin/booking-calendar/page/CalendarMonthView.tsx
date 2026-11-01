// Visão Mês (desktop): grade do mês com até 3 agendamentos por dia.
// JSX movido da BookingCalendarPage sem mudança.
import { format, isSameMonth, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { getStatusStyles } from '@/lib/bookingCalendar/calendarGrid';
import type { ViewMode } from '@/lib/bookingCalendar/calendarGrid';
import type { CalendarHelpers } from './calendarHelpers';

interface CalendarMonthViewProps {
  monthDays: Date[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  setViewMode: (mode: ViewMode) => void;
  calendar: CalendarHelpers;
}

export function CalendarMonthView({ monthDays, selectedDate, setSelectedDate, setViewMode, calendar }: CalendarMonthViewProps) {
  const { getBookingsForDay, handleBookingClick } = calendar;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 divide-x divide-border/30 border-b bg-muted/20">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="py-2.5 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 divide-x divide-border/20">
        {monthDays.map((day) => {
          const dayBookings = getBookingsForDay(day);
          const isCurrentMonth = isSameMonth(day, selectedDate);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[90px] p-1.5 border-b border-border/20 cursor-pointer transition-colors hover:bg-muted/30",
                !isCurrentMonth && "opacity-40"
              )}
              onClick={() => {
                setSelectedDate(day);
                setViewMode('day');
              }}
            >
              <div className={cn(
                "text-xs font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full",
                isToday(day) && "bg-primary text-primary-foreground",
                !isToday(day) && isCurrentMonth && "text-foreground"
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map(booking => {
                  const styles = getStatusStyles(booking.status);
                  return (
                    <div
                      key={booking.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookingClick(booking);
                      }}
                      className={cn(
                        "rounded-md px-1 py-0.5 text-[10px] cursor-pointer hover:opacity-80 flex items-center gap-1 border-l-2",
                        styles.bg, styles.border
                      )}
                    >
                      <span className="font-medium text-foreground truncate">
                        {booking.start_time.slice(0, 5)} {booking.customer_name}
                      </span>
                    </div>
                  );
                })}
                {dayBookings.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1 font-medium">
                    +{dayBookings.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
