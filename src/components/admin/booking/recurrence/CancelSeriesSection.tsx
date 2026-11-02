import { useEffect, useState } from 'react';
import { Loader2, Repeat, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDdMm } from '@/lib/bookingRecurrence/weeklyDates';
import { useCancelBookingSeries } from '@/hooks/bookingRecurrence/useCancelBookingSeries';

interface Props {
  booking: {
    id: string;
    booking_date: string;
    status: string;
    recurrence_group_id?: string | null;
  };
  /** Chamado depois de cancelar (recarregar a agenda e fechar o detalhe). */
  onDone: () => void;
}

/** Detalhe da reserva: "Cancelar esta e as próximas da série", com confirmação no próprio diálogo. */
export function CancelSeriesSection({ booking, onDone }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);
  const cancelSeries = useCancelBookingSeries();

  useEffect(() => {
    setConfirming(false);
    setReason('');
    setNotify(true);
  }, [booking.id]);

  if (!booking.recurrence_group_id) return null;
  const canCancel = ['pending', 'confirmed', 'in_progress'].includes(booking.status);

  const handleConfirm = async () => {
    try {
      await cancelSeries.mutateAsync({ bookingId: booking.id, reason, notify });
      onDone();
    } catch {
      // toast já mostrado pelo hook
    }
  };

  return (
    <div className="rounded-lg border p-3 space-y-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Repeat className="h-4 w-4" />
        <span>Faz parte de uma série semanal</span>
      </div>

      {canCancel && !confirming && (
        <Button variant="outline" size="sm" className="w-full sm:w-auto text-destructive border-destructive/40" onClick={() => setConfirming(true)}>
          <X className="h-4 w-4 mr-2" />
          Cancelar esta e as próximas da série
        </Button>
      )}

      {canCancel && confirming && (
        <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p>
            Cancela este agendamento ({formatDdMm(booking.booking_date)}) e todos os próximos da série que estão
            pendentes ou confirmados. Os anteriores não mudam.
          </p>
          <div>
            <Label htmlFor="series-cancel-reason">Motivo (opcional)</Label>
            <Textarea
              id="series-cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: cliente encerrou o mensal"
              rows={2}
              maxLength={250}
            />
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} className="mt-0.5" />
            <span>
              Avisar o cliente pelo WhatsApp
              <span className="block text-xs text-muted-foreground">Uma mensagem só, citando as datas canceladas.</span>
            </span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={cancelSeries.isPending}>
              Voltar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={cancelSeries.isPending}>
              {cancelSeries.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar cancelamento da série
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
