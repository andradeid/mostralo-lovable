import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  AlertTriangle,
  CalendarIcon,
  TrendingUp,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Booking } from '@/hooks/useBooking';

interface MobileMonthViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  bookings: Booking[];
  onDayClick: (date: Date) => void;
}

export function MobileMonthView({
  selectedDate,
  onDateChange,
  bookings,
  onDayClick,
}: MobileMonthViewProps) {
  // Get all days of the current month
  const monthDays = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
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

  // Find max bookings in a single day for intensity calculation
  const maxBookings = useMemo(() => {
    const values = Object.values(dayBookingCounts);
    return values.length > 0 ? Math.max(...values) : 1;
  }, [dayBookingCounts]);

  // Month summary stats
  const monthStats = useMemo(() => {
    const totalBookings = bookings.length;

    // Find busiest and quietest days (only days with bookings)
    let busiestDay = '';
    let busiestCount = 0;
    let quietestDay = '';
    let quietestCount = Infinity;

    Object.entries(dayBookingCounts).forEach(([dateStr, count]) => {
      if (count > busiestCount) {
        busiestCount = count;
        busiestDay = dateStr;
      }
      if (count < quietestCount) {
        quietestCount = count;
        quietestDay = dateStr;
      }
    });

    return {
      totalBookings,
      busiestDay,
      busiestCount,
      quietestDay: quietestCount < Infinity ? quietestDay : '',
      quietestCount: quietestCount < Infinity ? quietestCount : 0,
    };
  }, [dayBookingCounts, bookings]);

  // Intensity: 0-1 scale based on max bookings
  const getIntensity = (count: number) => {
    if (maxBookings === 0) return 0;
    return count / maxBookings;
  };

  // Intensity color: uses primary/orange tones
  const getIntensityClasses = (intensity: number) => {
    if (intensity === 0) return 'bg-muted/30';
    if (intensity <= 0.25) return 'bg-primary/15';
    if (intensity <= 0.5) return 'bg-primary/30';
    if (intensity <= 0.75) return 'bg-primary/50';
    return 'bg-primary/70';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    onDateChange(direction === 'prev' ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1));
  };

  const goToCurrentMonth = () => {
    onDateChange(new Date());
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Month Navigator */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <button onClick={goToCurrentMonth} className="text-[10px] text-primary font-bold uppercase tracking-wider">
                {isSameMonth(selectedDate, new Date()) ? 'Este mês' : 'Ir para mês atual'}
              </button>
              <p className="text-sm font-bold text-foreground capitalize">
                {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Month Summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <CalendarIcon className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{monthStats.totalBookings}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Total</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <Flame className="h-4 w-4 mx-auto text-rose-500 mb-1" />
            <p className="text-lg font-bold text-foreground">{monthStats.busiestCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
              {monthStats.busiestDay
                ? format(new Date(monthStats.busiestDay + 'T12:00:00'), 'EEE dd', { locale: ptBR })
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <AlertTriangle className="h-4 w-4 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold text-foreground">{monthStats.quietestCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
              {monthStats.quietestDay
                ? format(new Date(monthStats.quietestDay + 'T12:00:00'), 'EEE dd', { locale: ptBR })
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Intensity Legend */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] text-muted-foreground font-medium">Menos</span>
        <div className="flex gap-1">
          {[0, 0.25, 0.5, 0.75, 1].map((level, i) => (
            <div key={i} className={cn("h-3 w-6 rounded-sm", getIntensityClasses(level))} />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">Mais</span>
      </div>

      {/* Days List */}
      <div className="space-y-1.5">
        {monthDays.map(day => {
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
