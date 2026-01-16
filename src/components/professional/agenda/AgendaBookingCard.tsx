import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface AgendaBookingCardProps {
  booking: Booking;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
  compact?: boolean;
}

const statusStyles: Record<string, { bg: string; text: string; label: string; border: string }> = {
  pending: { 
    bg: "bg-amber-500/10", 
    text: "text-amber-600 dark:text-amber-400", 
    label: "Pendente",
    border: "border-amber-500/30"
  },
  confirmed: { 
    bg: "bg-blue-500/10", 
    text: "text-blue-600 dark:text-blue-400", 
    label: "Confirmado",
    border: "border-blue-500/30"
  },
  completed: { 
    bg: "bg-emerald-500/10", 
    text: "text-emerald-600 dark:text-emerald-400", 
    label: "Concluído",
    border: "border-emerald-500/30"
  },
  cancelled: { 
    bg: "bg-red-500/10", 
    text: "text-red-600 dark:text-red-400", 
    label: "Cancelado",
    border: "border-red-500/30"
  },
  no_show: { 
    bg: "bg-gray-500/10", 
    text: "text-gray-600 dark:text-gray-400", 
    label: "Não Compareceu",
    border: "border-gray-500/30"
  },
};

export function getStatusStyle(status: string) {
  return statusStyles[status] || statusStyles.pending;
}

export function AgendaBookingCard({ 
  booking, 
  onConfirm, 
  onCancel, 
  onComplete,
  compact = false 
}: AgendaBookingCardProps) {
  const statusStyle = getStatusStyle(booking.status);

  if (compact) {
    return (
      <div
        className={cn(
          "px-2 py-1 rounded text-xs border-l-2 truncate cursor-pointer hover:opacity-80 transition-opacity",
          statusStyle.bg,
          statusStyle.border
        )}
        title={`${booking.start_time?.slice(0, 5)} - ${booking.customer_name} - ${booking.booking_services?.name}`}
      >
        <span className="font-medium">{booking.start_time?.slice(0, 5)}</span>
        <span className="ml-1 text-muted-foreground">{booking.customer_name}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all hover:shadow-md",
        statusStyle.bg,
        statusStyle.border
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Clock className="w-4 h-4 shrink-0" />
            <span className="font-semibold">
              {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
            </span>
            <Badge variant="outline" className={cn("text-xs", statusStyle.text)}>
              {statusStyle.label}
            </Badge>
          </div>
          
          <p className="font-medium truncate">{booking.booking_services?.name}</p>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="truncate">{booking.customer_name}</span>
          </div>
          
          {booking.customer_phone && (
            <a 
              href={`tel:${booking.customer_phone}`}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
            >
              <Phone className="w-3 h-3" />
              {booking.customer_phone}
            </a>
          )}
          
          {booking.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
              Obs: {booking.notes}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {booking.status === "pending" && (
            <>
              {onCancel && (
                <Button size="sm" variant="outline" onClick={() => onCancel(booking.id)}>
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              )}
              {onConfirm && (
                <Button size="sm" onClick={() => onConfirm(booking.id)}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Confirmar
                </Button>
              )}
            </>
          )}
          {booking.status === "confirmed" && (
            <>
              {onCancel && (
                <Button size="sm" variant="outline" onClick={() => onCancel(booking.id)}>
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              )}
              {onComplete && (
                <Button size="sm" variant="default" onClick={() => onComplete(booking.id)}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Concluir
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
