import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Booking } from '@/hooks/useBooking';

interface MobileWeekViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  bookings: Booking[];
  onDayClick: (date: Date) => void;
  getStatusStyles: (status: Booking['status']) => { bg: string; border: string; text: string; dot: string };
  getStatusLabel: (status: Booking['status']) => string;
  getProfessionalName: (id: string) => string;
  getProfessionalPhoto: (id: string) => string | null;
  getProfessionalInitials: (id: string) => string;
  getServiceName: (id: string) => string;
  onBookingClick: (booking: Booking) => void;
}

export function MobileWeekView({
  selectedDate,
  onDateChange,
  bookings,
  onDayClick,
}: MobileWeekViewProps) {
  // Week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { locale: ptBR });
    const end = endOfWeek(selectedDate, { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Count bookings per day
  const dayBookingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      const key = b.booking_date;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [bookings]);

  // Max for intensity calculation
  const maxBookings = useMemo(() => {
    const values = Object.values(dayBookingCounts);
    return values.length > 0 ? Math.max(...values) : 1;
  }, [dayBookingCounts]);

  const getIntensity = (count: number) => {
    if (maxBookings === 0) return 0;
    return count / maxBookings;
  };

  const getIntensityClasses = (intensity: number) => {
    if (intensity === 0) return 'bg-muted/30';
    if (intensity <= 0.25) return 'bg-primary/15';
    if (intensity <= 0.5) return 'bg-primary/30';
    if (intensity <= 0.75) return 'bg-primary/50';
    return 'bg-primary/70';
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    onDateChange(direction === 'prev' ? subWeeks(selectedDate, 1) : addWeeks(selectedDate, 1));
  };

  const goToCurrentWeek = () => onDateChange(new Date());

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  return (
    <div className="space-y-3 pb-20">
      {/* Week Navigator */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <button onClick={goToCurrentWeek} className="text-[10px] text-primary font-bold uppercase tracking-wider">
                {isSameWeek(selectedDate, new Date(), { locale: ptBR }) ? 'Esta semana' : 'Ir para semana atual'}
              </button>
              <p className="text-sm font-bold text-foreground">
                {format(weekStart, "dd MMM", { locale: ptBR })} — {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Days list - same style as month view */}
      <div className="space-y-1.5">
        {weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const count = dayBookingCounts[dateStr] || 0;
          const intensity = getIntensity(count);
          const today = isToday(day);

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(day)}
              className={cn(
                "w-full rounded-xl p-3 flex items-center gap-3 transition-all active:scale-[0.98]",
                "border",
                today
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/30 bg-card hover:bg-muted/30"
              )}
            >
              {/* Day info */}
              <div className="w-12 shrink-0 text-center">
                <p className={cn(
                  "text-[9px] uppercase font-semibold tracking-wider",
                  today ? "text-primary" : "text-muted-foreground"
                )}>
                  {format(day, 'EEE', { locale: ptBR })}
                </p>
                <p className={cn(
                  "text-lg font-bold leading-tight",
                  today ? "text-primary" : "text-foreground"
                )}>
                  {format(day, 'dd')}
                </p>
              </div>

              {/* Intensity bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-xs font-medium",
                    count > 0 ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {count > 0 ? `${count} agendamento${count > 1 ? 's' : ''}` : 'Sem agendamentos'}
                  </span>
                  {today && (
                    <span className="text-[9px] text-primary font-bold uppercase">Hoje</span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      count > 0 ? getIntensityClasses(intensity) : ""
                    )}
                    style={{ width: count > 0 ? `${Math.max(intensity * 100, 8)}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
