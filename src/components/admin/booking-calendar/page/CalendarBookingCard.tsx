// Cartão de agendamento da Agenda (compacto na visão Semana).
// JSX movido da BookingCalendarPage sem mudança.
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DepositBadge } from '@/components/admin/booking/DepositBadge';
import { BookingInlineActions } from '@/components/admin/booking/BookingInlineActions';
import { getStatusStyles, getStatusLabel } from '@/lib/bookingCalendar/calendarGrid';
import type { Booking } from '@/hooks/useBooking';
import type { CalendarHelpers } from './calendarHelpers';

interface CalendarBookingCardProps {
  booking: Booking;
  compact?: boolean;
  calendar: CalendarHelpers;
}

export const CalendarBookingCard = ({ booking, compact = false, calendar }: CalendarBookingCardProps) => {
  const { handleBookingClick, getProfessionalName, getProfessionalPhoto, getProfessionalInitials, getServiceName, refetchBookings } = calendar;
  const styles = getStatusStyles(booking.status);

  if (compact) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); handleBookingClick(booking); }}
        className={cn(
          "rounded-lg border-l-[3px] px-2 py-1.5 cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:scale-[1.02]",
          styles.bg, styles.border
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-foreground">{booking.start_time.slice(0, 5)}</span>
          <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", styles.dot)} />
        </div>
        <div className="text-xs font-medium text-foreground truncate mt-0.5">{booking.customer_name}</div>
        <div className="text-[10px] text-muted-foreground truncate">{getProfessionalName(booking.professional_id)}</div>
        <DepositBadge booking={booking} className="mt-0.5 h-4 px-1 text-[9px]" />
      </div>
    );
  }

  const isFinished = booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no_show';
  const isActive = booking.status === 'in_progress';

  return (
    <div
      onClick={() => handleBookingClick(booking)}
      className={cn(
        "group rounded-xl border-l-[3px] p-3 cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:scale-[1.01] bg-card border border-border/50",
        styles.border,
        isActive && "ring-2 ring-blue-200 dark:ring-blue-800",
        isFinished && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-semibold text-foreground">
              {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
            </span>
            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-medium", styles.text)}>
              {getStatusLabel(booking.status)}
            </Badge>
            <DepositBadge booking={booking} />
          </div>
          <p className="text-sm font-medium text-foreground truncate">{booking.customer_name}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{getServiceName(booking.service_id)}</p>
        </div>
        <Avatar className="h-8 w-8 border border-border flex-shrink-0">
          <AvatarImage src={getProfessionalPhoto(booking.professional_id) || undefined} />
          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
            {getProfessionalInitials(booking.professional_id)}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{getProfessionalName(booking.professional_id)}</span>
        </div>
        {!isFinished && (
          <BookingInlineActions booking={booking} onSuccess={refetchBookings} compact />
        )}
      </div>
    </div>
  );
};
