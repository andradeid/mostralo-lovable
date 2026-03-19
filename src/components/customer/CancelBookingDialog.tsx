import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CancelBookingDialogProps {
  open: boolean;
  onClose: () => void;
  booking: {
    id: string;
    booking_date: string;
    start_time: string;
    store_id: string;
    booking_services?: { name: string } | null;
  } | null;
  onCancelled: () => void;
}

export default function CancelBookingDialog({
  open,
  onClose,
  booking,
  onCancelled,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancellationLimit, setCancellationLimit] = useState<number | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // Buscar configuração de limite de cancelamento da loja
  useEffect(() => {
    if (!booking?.store_id || !open) return;

    const fetchSettings = async () => {
      setLoadingSettings(true);
      const { data } = await supabase
        .from("booking_settings")
        .select("cancellation_hours_limit")
        .eq("store_id", booking.store_id)
        .maybeSingle();

      const limit = data?.cancellation_hours_limit ?? null;
      setCancellationLimit(limit);

      // Validar se está dentro do prazo
      if (limit && booking) {
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
        const hoursUntil = differenceInHours(bookingDateTime, new Date());
        setBlocked(hoursUntil < limit);
      } else {
        setBlocked(false);
      }

      setLoadingSettings(false);
    };

    fetchSettings();
  }, [booking?.store_id, booking?.booking_date, booking?.start_time, open]);

  const handleCancel = async () => {
    if (!booking) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: reason || "Cancelado pelo cliente",
          cancelled_at: new Date().toISOString(),
          cancelled_by: "customer",
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast({
        title: "Agendamento cancelado",
        description: "Seu agendamento foi cancelado com sucesso",
      });

      onCancelled();
      onClose();
      setReason("");
    } catch (error) {
      console.error("Erro ao cancelar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
  const formattedDate = format(bookingDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Deseja cancelar{" "}
                <strong>{booking.booking_services?.name || "este agendamento"}</strong>{" "}
                agendado para <strong>{formattedDate}</strong>?
              </p>

              {loadingSettings ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando política de cancelamento...
                </div>
              ) : blocked ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">
                    Cancelamento não permitido. Esta loja exige cancelamento com no mínimo{" "}
                    <strong>{cancellationLimit} hora(s)</strong> de antecedência.
                  </p>
                </div>
              ) : (
                <>
                  {cancellationLimit && (
                    <p className="text-xs text-muted-foreground">
                      Política da loja: cancelamento até {cancellationLimit}h antes do horário.
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="cancel-reason">Motivo (opcional)</Label>
                    <Textarea
                      id="cancel-reason"
                      placeholder="Descreva o motivo do cancelamento..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Voltar</AlertDialogCancel>
          {!blocked && !loadingSettings && (
            <AlertDialogAction
              onClick={handleCancel}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
