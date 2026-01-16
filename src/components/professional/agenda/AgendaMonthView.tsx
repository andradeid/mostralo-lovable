import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { 
  format, 
  isSameDay, 
  isToday, 
  isSameMonth,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getStatusStyle } from "./AgendaBookingCard";
import { Badge } from "@/components/ui/badge";

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  customer_name: string;
  customer_phone?: string;
  notes?: string;
  booking_services?: {
    name: string;
    duration_minutes: number;
  };
}

interface AgendaMonthViewProps {
  selectedDate: Date;
  bookings: Booking[];
  isLoading: boolean;
  onDayClick: (date: Date) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function AgendaMonthView({ 
  selectedDate, 
  bookings, 
  isLoading, 
  onDayClick 
}: AgendaMonthViewProps) {
  // Get calendar days including padding from previous/next months
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedDate]);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, { count: number; statuses: string[] }>();
    bookings.forEach(booking => {
      const dateKey = booking.booking_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, { count: 0, statuses: [] });
      }
      const dayData = map.get(dateKey)!;
      dayData.count++;
      if (!dayData.statuses.includes(booking.status)) {
        dayData.statuses.push(booking.status);
      }
    });
    return map;
  }, [bookings]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-2 md:p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((day) => (
            <div 
              key={day} 
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = bookingsByDay.get(dateKey);
            const isCurrentMonth = isSameMonth(day, selectedDate);
            const isTodayDate = isToday(day);
            const hasBookings = dayData && dayData.count > 0;

            // Determine day status color
            let statusIndicator = null;
            if (dayData?.statuses.includes('pending')) {
              statusIndicator = 'bg-amber-500';
            } else if (dayData?.statuses.includes('confirmed')) {
              statusIndicator = 'bg-blue-500';
            } else if (dayData?.statuses.includes('completed')) {
              statusIndicator = 'bg-emerald-500';
            }

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDayClick(day)}
                className={cn(
                  "aspect-square p-1 rounded-lg transition-all relative flex flex-col items-center justify-start",
                  "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
                  !isCurrentMonth && "opacity-40",
                  isTodayDate && "ring-2 ring-primary",
                  hasBookings && "bg-muted/30"
                )}
              >
                <span className={cn(
                  "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                  isTodayDate && "bg-primary text-primary-foreground"
                )}>
                  {format(day, "d")}
                </span>
                
                {hasBookings && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {statusIndicator && (
                      <div className={cn("w-1.5 h-1.5 rounded-full", statusIndicator)} />
                    )}
                    <Badge 
                      variant="secondary" 
                      className="text-[10px] px-1 py-0 h-4 min-w-[16px] justify-center"
                    >
                      {dayData.count}
                    </Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Pendente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Confirmado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Concluído</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
