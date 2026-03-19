import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import CustomerBookingCard from "./CustomerBookingCard";
import CancelBookingDialog from "./CancelBookingDialog";

interface CustomerBookingsProps {
  customerId: string;
  storeSlug?: string;
}

export default function CustomerBookings({ customerId, storeSlug }: CustomerBookingsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelBooking, setCancelBooking] = useState<any>(null);

  // Query lazy — só executa quando componente é montado (tab ativa)
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["customer-bookings", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          price,
          cancellation_reason,
          store_id,
          booking_services:service_id (
            name,
            duration_minutes
          ),
          professionals:professional_id (
            name,
            avatar_url
          ),
          stores:store_id (
            name,
            slug
          )
        `)
        .eq("customer_id", customerId)
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
    staleTime: 2 * 60 * 1000, // 2 min cache
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Separar próximos e histórico
  const now = new Date();
  const upcoming = bookings.filter((b: any) => {
    const dt = new Date(`${b.booking_date}T${b.start_time}`);
    return dt >= now && !["cancelled", "completed", "no_show"].includes(b.status);
  });
  const history = bookings.filter((b: any) => {
    const dt = new Date(`${b.booking_date}T${b.start_time}`);
    return dt < now || ["cancelled", "completed", "no_show"].includes(b.status);
  });

  // Multi-loja: verificar se tem bookings em mais de uma loja
  const uniqueStores = new Set(bookings.map((b: any) => b.store_id));
  const isMultiStore = uniqueStores.size > 1;

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarX className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">
          Você ainda não tem agendamentos
        </p>
        {storeSlug && (
          <Button onClick={() => navigate(`/agendar/${storeSlug}`)}>
            Agendar Agora
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Próximos Agendamentos */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Próximos Agendamentos
          </h3>
          <div className="space-y-3">
            {upcoming.map((booking: any) => (
              <CustomerBookingCard
                key={booking.id}
                booking={booking}
                showStoreName={isMultiStore}
                onCancel={(b) => setCancelBooking(b)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Histórico
          </h3>
          <div className="space-y-3">
            {history.map((booking: any) => (
              <CustomerBookingCard
                key={booking.id}
                booking={booking}
                showStoreName={isMultiStore}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dialog de Cancelamento */}
      <CancelBookingDialog
        open={!!cancelBooking}
        onClose={() => setCancelBooking(null)}
        booking={cancelBooking}
        onCancelled={() => {
          queryClient.invalidateQueries({ queryKey: ["customer-bookings", customerId] });
        }}
      />
    </div>
  );
}
