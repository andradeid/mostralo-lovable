import { useState } from 'react';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName?: string | null;
  onConfirm: (reason: string, notify: boolean) => Promise<void> | void;
}

/** Confirmação de cancelamento pelo painel, com motivo e a opção de avisar o cliente. */
export function CancelBookingConfirmDialog({ open, onOpenChange, customerName, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(reason.trim(), notify);
      setReason('');
      setNotify(true);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar agendamento{customerName ? ` de ${customerName}` : ''}?</AlertDialogTitle>
          <AlertDialogDescription>O horário fica livre para outros clientes.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Motivo (opcional)</Label>
            <Textarea id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              placeholder="Ex.: profissional indisponível" />
          </div>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(v === true)} className="mt-0.5" />
            <span>Avisar o cliente pelo WhatsApp<span className="block text-xs text-muted-foreground">O motivo vai na mensagem só se você preencher.</span></span>
          </label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Voltar</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Confirmar cancelamento
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
