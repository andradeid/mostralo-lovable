import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AgendaBookingCard } from "./AgendaBookingCard";

interface Booking {
  id: string;
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

interface AgendaDayViewProps {
  date: Date;
  bookings: Booking[];
  isLoading: boolean;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
}

export function AgendaDayView({ 
  date, 
  bookings, 
  isLoading, 
  onConfirm, 
  onCancel, 
  onComplete 
}: AgendaDayViewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg capitalize">
          {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <AgendaBookingCard
                key={booking.id}
                booking={booking}
                onConfirm={onConfirm}
                onCancel={onCancel}
                onComplete={onComplete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum agendamento para esta data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
