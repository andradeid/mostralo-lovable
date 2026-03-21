import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarIcon,
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
  getStatusStyles,
  getStatusLabel,
  getProfessionalName,
  getProfessionalPhoto,
  getProfessionalInitials,
  getServiceName,
  onBookingClick,
}: MobileWeekViewProps) {
  // Week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { locale: ptBR });
    const end = endOfWeek(selectedDate, { locale: ptBR });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach(b => {
      if (!map[b.booking_date]) map[b.booking_date] = [];
      map[b.booking_date].push(b);
    });
    // Sort each day's bookings by time
    Object.values(map).forEach(arr => arr.sort((a, b) => a.start_time.localeCompare(b.start_time)));
    return map;
  }, [bookings]);

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

      {/* Days list */}
      <div className="space-y-3">
        {weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDate[dateStr] || [];
          const today = isToday(day);

          return (
            <div key={dateStr}>
              {/* Day header - clickable to go to day view */}
              <button
                onClick={() => onDayClick(day)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg mb-1.5 transition-colors",
                  today
                    ? "bg-primary/8"
                    : "hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "h-9 w-9 rounded-lg flex flex-col items-center justify-center shrink-0",
                  today ? "bg-primary text-primary-foreground" : "bg-muted/50"
                )}>
                  <span className="text-[8px] uppercase font-bold leading-none">
                    {format(day, 'EEE', { locale: ptBR })}
                  </span>
                  <span className="text-sm font-bold leading-tight">
                    {format(day, 'dd')}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className={cn(
                    "text-sm font-semibold capitalize",
                    today ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, "EEEE", { locale: ptBR })}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {dayBookings.length > 0
                      ? `${dayBookings.length} agendamento${dayBookings.length > 1 ? 's' : ''}`
                      : 'Sem agendamentos'}
                  </p>
                </div>
                {today && (
                  <Badge variant="outline" className="text-[9px] h-5 px-1.5 border-primary/30 text-primary font-bold shrink-0">
                    Hoje
                  </Badge>
                )}
              </button>

              {/* Bookings for this day */}
              {dayBookings.length > 0 && (
                <div className="space-y-1.5 pl-2">
                  {dayBookings.map(booking => {
                    const styles = getStatusStyles(booking.status);
                    return (
                      <div
                        key={booking.id}
                        onClick={() => onBookingClick(booking)}
                        className={cn(
                          "rounded-lg border-l-[3px] p-2.5 cursor-pointer",
                          "transition-all active:scale-[0.98]",
                          "bg-card border border-border/30 shadow-sm",
                          styles.border
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-bold text-foreground">
                              {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] h-4 px-1.5 font-semibold border-0", styles.bg, styles.text)}
                          >
                            {getStatusLabel(booking.status)}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-foreground">{booking.customer_name}</p>
                        <p className="text-[11px] text-muted-foreground">{getServiceName(booking.service_id)}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-border/20">
                          <Avatar className="h-5 w-5 border border-border/40">
                            <AvatarImage src={getProfessionalPhoto(booking.professional_id) || undefined} />
                            <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                              {getProfessionalInitials(booking.professional_id)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] text-muted-foreground">{getProfessionalName(booking.professional_id)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state for days without bookings */}
              {dayBookings.length === 0 && (
                <div className="pl-2 py-2">
                  <p className="text-[11px] text-muted-foreground/60 italic">Nenhum agendamento</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
