// Visão Dia (desktop): linhas de 30 em 30 minutos com os agendamentos de cada horário.
// JSX movido da BookingCalendarPage sem mudança.
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusStyles, slotBookingsFor, timeSlotsForDay } from '@/lib/bookingCalendar/calendarGrid';
import type { CalendarHelpers } from './calendarHelpers';

interface CalendarDayViewProps {
  selectedDate: Date;
  timeSlots: string[];
  collapsedSlots: Record<string, boolean>;
  toggleSlotCollapse: (slotKey: string) => void;
  calendar: CalendarHelpers;
}

export function CalendarDayView({ selectedDate, timeSlots, collapsedSlots, toggleSlotCollapse, calendar }: CalendarDayViewProps) {
  const { getBookingsForDay, handleBookingClick, getProfessionalPhoto, getProfessionalInitials, getServiceName } = calendar;
  const dayBookings = getBookingsForDay(selectedDate);
  const daySlots = timeSlotsForDay(timeSlots, dayBookings);
  
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="divide-y divide-border/30">
        {daySlots.map((time) => {
          const slotBookings = slotBookingsFor(dayBookings, time);
          const hasMultiple = slotBookings.length > 1;
          const isCollapsed = hasMultiple && collapsedSlots[time];

          return (
            <div key={time} className="flex">
              {/* Time label */}
              <div className="w-[72px] flex-shrink-0 px-2 py-2 text-[11px] text-muted-foreground/70 text-right pr-3 pt-3 border-r border-border/50">
                {time}
              </div>

              {/* Bookings area */}
              <div className="flex-1 min-h-[56px] p-1.5">
                {slotBookings.length === 0 ? null : hasMultiple ? (
                  <div className="space-y-1.5">
                    {/* Collapse toggle header */}
                    <button
                      onClick={() => toggleSlotCollapse(time)}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
                    >
                      <ChevronDown className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        isCollapsed && "-rotate-90"
                      )} />
                      <span className="font-medium">{slotBookings.length} atendimentos</span>
                    </button>

                    {/* First booking always visible */}
                    {(() => {
                      const booking = slotBookings[0];
                      const styles = getStatusStyles(booking.status);
                      return (
                        <div
                          key={booking.id}
                          onClick={() => handleBookingClick(booking)}
                          className={cn(
                            "rounded-lg border-l-[3px] p-2 cursor-pointer",
                            "transition-all duration-200 hover:shadow-md",
                            styles.bg, styles.border, "border border-border/30"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-border/50 flex-shrink-0">
                              <AvatarImage src={getProfessionalPhoto(booking.professional_id) || undefined} />
                              <AvatarFallback className="text-[8px] bg-muted">
                                {getProfessionalInitials(booking.professional_id)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-foreground truncate">{booking.customer_name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {getServiceName(booking.service_id)} • {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Remaining bookings - collapsible */}
                    {!isCollapsed && slotBookings.slice(1).map(booking => {
                      const styles = getStatusStyles(booking.status);
                      return (
                        <div
                          key={booking.id}
                          onClick={() => handleBookingClick(booking)}
                          className={cn(
                            "rounded-lg border-l-[3px] p-2 cursor-pointer",
                            "transition-all duration-200 hover:shadow-md",
                            styles.bg, styles.border, "border border-border/30"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-border/50 flex-shrink-0">
                              <AvatarImage src={getProfessionalPhoto(booking.professional_id) || undefined} />
                              <AvatarFallback className="text-[8px] bg-muted">
                                {getProfessionalInitials(booking.professional_id)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-foreground truncate">{booking.customer_name}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {getServiceName(booking.service_id)} • {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Single booking
                  (() => {
                    const booking = slotBookings[0];
                    const styles = getStatusStyles(booking.status);
                    return (
                      <div
                        onClick={() => handleBookingClick(booking)}
                        className={cn(
                          "rounded-lg border-l-[3px] p-2 cursor-pointer",
                          "transition-all duration-200 hover:shadow-md",
                          styles.bg, styles.border, "border border-border/30"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-border/50 flex-shrink-0">
                            <AvatarImage src={getProfessionalPhoto(booking.professional_id) || undefined} />
                            <AvatarFallback className="text-[8px] bg-muted">
                              {getProfessionalInitials(booking.professional_id)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-foreground truncate">{booking.customer_name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {getServiceName(booking.service_id)} • {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
