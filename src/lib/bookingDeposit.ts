import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { isDepositPending, hasDepositFlow, type DepositBookingLike } from '../../supabase/functions/_shared/booking-deposit';

export { isDepositPending, hasDepositFlow };

/** Situação do sinal para o selo do painel/agenda (null = reserva sem sinal). */
export function depositBadgeState(b: DepositBookingLike | null | undefined): 'pending' | 'paid' | null {
  if (!hasDepositFlow(b)) return null;
  if (b!.deposit_paid) return 'paid';
  return b!.status === 'cancelled' ? null : 'pending';
}

/**
 * Lojista confirma o sinal à mão (Pix da própria loja, ou recebido por fora):
 * sinal pago + reserva confirmada; depois sai a confirmação no WhatsApp (respeita as configurações).
 */
export async function confirmBookingDeposit(bookingId: string): Promise<boolean> {
  const { data, error } = await (supabase as any)
    .from('bookings')
    .update({ deposit_paid: true, deposit_paid_at: new Date().toISOString(), status: 'confirmed' })
    .eq('id', bookingId)
    .eq('deposit_paid', false)
    .in('status', ['pending', 'confirmed'])
    .select('id');
  if (error) {
    console.error('[confirm-deposit]', error);
    toast.error('Erro ao confirmar o sinal');
    return false;
  }
  if (!data?.length) {
    toast.info('Este sinal já estava confirmado ou a reserva foi cancelada');
    return false;
  }
  toast.success('Sinal confirmado! Reserva confirmada.');
  supabase.functions
    .invoke('booking-confirmation', { body: { booking_id: bookingId } })
    .then(({ data: res, error: err }) => {
      if (err) console.error('[confirm-deposit] confirmação no WhatsApp', err);
      else if (res?.message === 'Confirmação enviada com sucesso') toast.success('Confirmação enviada ao cliente pelo WhatsApp');
    })
    .catch((err) => console.error('[confirm-deposit]', err));
  return true;
}
