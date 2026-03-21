import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock, User, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Booking } from '@/hooks/useBooking';
import { BookingInlineActions } from './BookingInlineActions';

interface MobileBookingsListProps {
  bookings: Booking[];
  getStatusStyles: (status: Booking['status']) => { bg: string; border: string; text: string; dot: string };
  getStatusLabel: (status: Booking['status']) => string;
  getProfessionalName: (id: string) => string;
  getProfessionalPhoto: (id: string) => string | null;
  getProfessionalInitials: (id: string) => string;
  getServiceName: (id: string) => string;
  onBookingClick: (booking: Booking) => void;
  onActionSuccess?: () => void;
}

export function MobileBookingsList({
  bookings,
  getStatusStyles,
  getStatusLabel,
  getProfessionalName,
  getProfessionalPhoto,
  getProfessionalInitials,
  getServiceName,
  onBookingClick,
  onActionSuccess,
}: MobileBookingsListProps) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <CalendarIcon className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">Nenhum agendamento</p>
        <p className="text-xs mt-1">Toque no + para criar um novo</p>
      </div>
    );
  }

  // Sort by start_time
  const sorted = [...bookings].sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="space-y-2 pb-20">
      {sorted.map((booking) => {
        const styles = getStatusStyles(booking.status);
        const isActive = booking.status === 'in_progress';
        const isFinished = booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no_show';
        
        return (
          <div
            key={booking.id}
            onClick={() => onBookingClick(booking)}
            className={cn(
              "rounded-xl border-l-[4px] p-3.5 cursor-pointer",
              "transition-all duration-200 active:scale-[0.98]",
              "bg-card border border-border/40 shadow-sm",
              styles.border,
              isActive && "ring-2 ring-blue-200 dark:ring-blue-800 shadow-md",
              isFinished && "opacity-70"
            )}
          >
            {/* Top row: time + status */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">
                  {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                </span>
              </div>
              <Badge 
                variant="outline" 
                className={cn("text-[10px] h-5 px-2 font-semibold border-0", styles.bg, styles.text)}
              >
                {getStatusLabel(booking.status)}
              </Badge>
            </div>

            {/* Client name */}
            <p className="text-sm font-semibold text-foreground">{booking.customer_name}</p>

            {/* Service */}
            <p className="text-xs text-muted-foreground mt-0.5">{getServiceName(booking.service_id)}</p>

            {/* Professional row */}
            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/30">
              <Avatar className="h-6 w-6 border border-border/50">
                <AvatarImage src={getProfessionalPhoto(booking.professional_id) || undefined} />
                <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                  {getProfessionalInitials(booking.professional_id)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{getProfessionalName(booking.professional_id)}</span>
            </div>

            {/* Inline actions - always visible, no modal needed */}
            {!isFinished && (
              <div className="mt-2.5 pt-2 border-t border-border/30">
                <BookingInlineActions
                  booking={booking}
                  onSuccess={onActionSuccess}
                  compact
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
