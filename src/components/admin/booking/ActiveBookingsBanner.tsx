import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Clock, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Booking } from '@/hooks/useBooking';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ActiveBookingsBannerProps {
  bookings: Booking[];
  getProfessionalName: (id: string) => string;
  getProfessionalPhoto: (id: string) => string | null;
  getProfessionalInitials: (id: string) => string;
  getServiceName: (id: string) => string;
  onSuccess?: () => void;
  onBookingClick?: (booking: Booking) => void;
}

export function ActiveBookingsBanner({
  bookings,
  getProfessionalName,
  getProfessionalPhoto,
  getProfessionalInitials,
  getServiceName,
  onSuccess,
  onBookingClick,
}: ActiveBookingsBannerProps) {
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Find bookings that are currently in progress
  const activeBookings = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return bookings.filter(b => {
      if (b.booking_date !== today) return false;
      return b.status === 'in_progress';
    });
  }, [bookings]);

  // Find bookings that SHOULD be in progress (time-based detection)
  const autoDetectedActive = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return bookings.filter(b => {
      if (b.booking_date !== today) return false;
      if (b.status !== 'confirmed') return false;
      // Check if current time is past start_time
      return b.start_time.slice(0, 5) <= currentTime && b.end_time.slice(0, 5) > currentTime;
    });
  }, [bookings]);

  const allActive = [...activeBookings, ...autoDetectedActive];

  if (allActive.length === 0) return null;

  const handleComplete = async (bookingId: string) => {
    setCompletingId(bookingId);
    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);
      if (error) throw error;
      toast.success('Atendimento concluído!');
      onSuccess?.();
    } catch {
      toast.error('Erro ao concluir atendimento');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-semibold text-foreground">
          Atendimento em andamento
        </span>
        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
          {allActive.length}
        </Badge>
      </div>

      {allActive.map((booking) => {
        const isAutoDetected = booking.status === 'confirmed';
        return (
          <div
            key={booking.id}
            onClick={() => onBookingClick?.(booking)}
            className={cn(
              "flex items-center gap-3 rounded-lg p-2.5 cursor-pointer transition-all",
              "bg-white/70 dark:bg-white/5 border border-blue-100 dark:border-blue-900",
              "hover:shadow-sm"
            )}
          >
            <Avatar className="h-8 w-8 border border-border/50">
              <AvatarImage src={getProfessionalPhoto(booking.professional_id) || undefined} />
              <AvatarFallback className="text-[9px] bg-muted">
                {getProfessionalInitials(booking.professional_id)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground truncate">
                  {booking.customer_name}
                </span>
                {isAutoDetected && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                    auto
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
                <span>•</span>
                <span className="truncate">{getProfessionalName(booking.professional_id)}</span>
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              className="h-7 px-2.5 text-[10px] gap-1 shrink-0"
              onClick={(e) => { e.stopPropagation(); handleComplete(booking.id); }}
              disabled={completingId === booking.id}
            >
              {completingId === booking.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Square className="h-3 w-3" />
              )}
              Finalizar
            </Button>
          </div>
        );
      })}
    </div>
  );
}
