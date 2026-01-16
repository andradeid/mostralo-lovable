import { useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format, isSameDay, isToday, parse, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AgendaBookingCard, getStatusStyle } from "./AgendaBookingCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

interface AgendaWeekViewProps {
  weekDays: Date[];
  bookings: Booking[];
  isLoading: boolean;
  onDayClick: (date: Date) => void;
  selectedDate: Date;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00
const HOUR_HEIGHT = 60; // pixels per hour

export function AgendaWeekView({ 
  weekDays, 
  bookings, 
  isLoading, 
  onDayClick,
  selectedDate 
}: AgendaWeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<HTMLDivElement>(null);

  // Scroll to current time on mount
  useEffect(() => {
    if (currentTimeRef.current) {
      currentTimeRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, []);

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach(booking => {
      const dateKey = booking.booking_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(booking);
    });
    return map;
  }, [bookings]);

  const getBookingPosition = (booking: Booking) => {
    const startTime = parse(booking.start_time, 'HH:mm:ss', new Date());
    const endTime = parse(booking.end_time, 'HH:mm:ss', new Date());
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const duration = differenceInMinutes(endTime, startTime);
    
    return {
      top: (startHour - 7) * HOUR_HEIGHT,
      height: (duration / 60) * HOUR_HEIGHT,
    };
  };

  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    if (hour >= 7 && hour <= 21) {
      return (hour - 7) * HOUR_HEIGHT;
    }
    return null;
  }, []);

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
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <ScrollArea className="w-full" ref={scrollRef}>
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 border-b bg-muted/30 sticky top-0 z-10">
              <div className="p-2 text-center text-xs font-medium text-muted-foreground border-r">
                Horário
              </div>
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onDayClick(day)}
                    className={cn(
                      "p-2 text-center transition-colors border-r last:border-r-0",
                      isSelected && "bg-primary/10",
                      isTodayDate && "bg-primary/5"
                    )}
                  >
                    <div className="text-xs font-medium text-muted-foreground uppercase">
                      {format(day, "EEE", { locale: ptBR })}
                    </div>
                    <div className={cn(
                      "text-lg font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full",
                      isTodayDate && "bg-primary text-primary-foreground"
                    )}>
                      {format(day, "d")}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="relative">
              {/* Hour rows */}
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b" style={{ height: HOUR_HEIGHT }}>
                  <div className="p-1 text-xs text-muted-foreground border-r flex items-start justify-center pt-1">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {weekDays.map((day) => (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="border-r last:border-r-0 relative"
                    />
                  ))}
                </div>
              ))}

              {/* Current time indicator */}
              {currentTimePosition !== null && weekDays.some(day => isToday(day)) && (
                <div
                  ref={currentTimeRef}
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: currentTimePosition }}
                >
                  <div className="flex items-center">
                    <div className="w-[calc(12.5%)] flex justify-end pr-1">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <div className="flex-1 h-0.5 bg-red-500" />
                  </div>
                </div>
              )}

              {/* Bookings overlay */}
              <div className="absolute inset-0 grid grid-cols-8">
                <div className="border-r" /> {/* Time column spacer */}
                {weekDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayBookings = bookingsByDay.get(dateKey) || [];
                  
                  return (
                    <div key={day.toISOString()} className="relative border-r last:border-r-0">
                      {dayBookings.map((booking) => {
                        const { top, height } = getBookingPosition(booking);
                        const statusStyle = getStatusStyle(booking.status);
                        
                        return (
                          <div
                            key={booking.id}
                            className={cn(
                              "absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-xs overflow-hidden cursor-pointer",
                              "hover:opacity-90 transition-opacity border-l-2",
                              statusStyle.bg,
                              statusStyle.border
                            )}
                            style={{ top, height: Math.max(height, 24) }}
                            title={`${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)}\n${booking.customer_name}\n${booking.booking_services?.name}`}
                            onClick={() => onDayClick(day)}
                          >
                            <div className="font-medium truncate">
                              {booking.start_time?.slice(0, 5)}
                            </div>
                            {height >= 40 && (
                              <div className="text-muted-foreground truncate">
                                {booking.customer_name}
                              </div>
                            )}
                            {height >= 60 && (
                              <div className="text-muted-foreground truncate text-[10px]">
                                {booking.booking_services?.name}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
