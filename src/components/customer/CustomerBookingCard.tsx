import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Scissors, MapPin, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BookingData {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  cancellation_reason?: string | null;
  booking_services: {
    name: string;
    duration_minutes: number;
  } | null;
  professionals: {
    name: string;
    avatar_url?: string | null;
  } | null;
  stores: {
    name: string;
    slug: string;
  } | null;
}

interface CustomerBookingCardProps {
  booking: BookingData;
  onCancel?: (booking: BookingData) => void;
  showStoreName?: boolean;
}

// Estilos de status reutilizando paleta do AgendaBookingCard
const statusStyles: Record<string, { bg: string; text: string; label: string; border: string }> = {
  pending: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    label: "Pendente",
    border: "border-amber-500/30",
  },
  confirmed: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    label: "Confirmado",
    border: "border-blue-500/30",
  },
  completed: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "Concluído",
    border: "border-emerald-500/30",
  },
  cancelled: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    label: "Cancelado",
    border: "border-red-500/30",
  },
  no_show: {
    bg: "bg-gray-500/10",
    text: "text-gray-600 dark:text-gray-400",
    label: "Não Compareceu",
    border: "border-gray-500/30",
  },
};

function getStatusStyle(status: string) {
  return statusStyles[status] || statusStyles.pending;
}

export default function CustomerBookingCard({ booking, onCancel, showStoreName = false }: CustomerBookingCardProps) {
  const style = getStatusStyle(booking.status);
  const isFuture = new Date(`${booking.booking_date}T${booking.start_time}`) > new Date();
  const canCancel = isFuture && ["pending", "confirmed"].includes(booking.status);

  return (
    <Card className={cn("transition-all hover:shadow-md", style.bg, style.border)}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          {/* Header: data + status */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-semibold text-sm">
                {format(new Date(booking.booking_date), "dd/MM/yyyy", { locale: ptBR })}
                {" · "}
                {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
              </span>
            </div>
            <Badge variant="outline" className={cn("text-xs", style.text)}>
              {style.label}
            </Badge>
          </div>

          {/* Serviço */}
          {booking.booking_services && (
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate">
                {booking.booking_services.name}
              </span>
              <span className="text-xs text-muted-foreground">
                ({booking.booking_services.duration_minutes}min)
              </span>
            </div>
          )}

          {/* Profissional */}
          {booking.professionals && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                {booking.professionals.name}
              </span>
            </div>
          )}

          {/* Loja (multi-loja) */}
          {showStoreName && booking.stores && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                {booking.stores.name}
              </span>
            </div>
          )}

          {/* Preço + Ações */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-semibold text-primary">
              R$ {booking.price.toFixed(2)}
            </span>

            {canCancel && onCancel && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel(booking);
                }}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            )}
          </div>

          {/* Motivo cancelamento */}
          {booking.status === "cancelled" && booking.cancellation_reason && (
            <p className="text-xs text-muted-foreground italic mt-1">
              Motivo: {booking.cancellation_reason}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
