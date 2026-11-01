import { Button } from '@/components/ui/button';
import { Check, Copy, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDepositBRL, pixKeyTypeLabel } from '../../../supabase/functions/_shared/booking-deposit';
import type { BookingDepositStatus, PublicBookingDeposit } from '@/hooks/useBookingDepositStatus';

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto e copie.');
  }
}

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Bloco do sinal na tela de sucesso da página de agendamento. */
export function BookingDepositPanel({
  deposit,
  status,
  onCancelled,
}: {
  deposit: PublicBookingDeposit;
  status: BookingDepositStatus;
  onCancelled?: () => void;
}) {
  const amount = formatDepositBRL(deposit.amount);

  if (status.paid) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800/40 dark:bg-green-900/20 p-3 mb-4 text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
        <Check className="h-4 w-4 shrink-0" />
        <span>Sinal de <strong>{amount}</strong> recebido.</span>
      </div>
    );
  }

  if (status.cancelled || status.expired) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 mb-4 text-sm text-center">
        {status.expired
          ? 'O prazo para pagar o sinal acabou e o horário foi liberado. Se você já pagou, fale com a loja.'
          : 'Reserva cancelada.'}
      </div>
    );
  }

  if (deposit.mode === 'store') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-900/20 p-4 mb-4 space-y-3">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Sinal para confirmar</p>
          <p className="text-2xl font-bold">{amount}</p>
        </div>
        {deposit.pix_key && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Pix ({pixKeyTypeLabel(deposit.pix_key_type)})</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 break-all rounded bg-background border px-2 py-1.5 text-sm">{deposit.pix_key}</code>
              <Button type="button" size="sm" variant="outline" onClick={() => copy(deposit.pix_key!, 'Chave Pix')}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {deposit.pix_recipient_name && (
              <p className="text-xs text-muted-foreground">Favorecido: {deposit.pix_recipient_name}</p>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">
          Depois de pagar, envie o comprovante pelo WhatsApp da loja. Seu horário fica reservado e é confirmado quando a loja conferir o pagamento.
        </p>
      </div>
    );
  }

  // Pix pelo Mostralo
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-900/20 p-4 mb-4 space-y-3">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Pague o sinal pelo Pix</p>
        <p className="text-2xl font-bold">{amount}</p>
        {status.secondsLeft !== null && (
          <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Vence em {mmss(status.secondsLeft)}
          </p>
        )}
      </div>
      {deposit.qrcode && (
        <img src={deposit.qrcode} alt="QR Code do Pix" className="mx-auto h-48 w-48 rounded bg-white p-2" />
      )}
      {deposit.pix_copia_e_cola && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Pix copia e cola</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate rounded bg-background border px-2 py-1.5 text-xs">{deposit.pix_copia_e_cola}</code>
            <Button type="button" size="sm" onClick={() => copy(deposit.pix_copia_e_cola!, 'Código Pix')}>
              <Copy className="h-4 w-4 mr-1" /> Copiar
            </Button>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center inline-flex w-full items-center justify-center gap-1.5">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aguardando o pagamento. A confirmação é automática.
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full text-xs text-muted-foreground"
        disabled={status.cancelling}
        onClick={async () => {
          if (await status.cancel()) onCancelled?.();
        }}
      >
        {status.cancelling && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
        Desistir e liberar o horário
      </Button>
    </div>
  );
}
