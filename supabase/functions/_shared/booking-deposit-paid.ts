// Sinal de reserva pago pelo Pix do Mostralo (conferido na EFI): grava pelo banco
// (mark_booking_deposit_paid, atômico) e, se a reserva ficou confirmada, dispara a confirmação
// no WhatsApp (booking-confirmation respeita as configurações da loja).
// Usado por booking-deposit (consulta da página) e efi-pix-webhook.

// deno-lint-ignore no-explicit-any
type Any = any;

export type DepositPaidResult = 'confirmed' | 'paid' | 'paid_after_cancel' | 'already_paid' | 'not_found';

export async function applyBookingDepositPayment(
  admin: Any,
  bookingId: string,
  details: Record<string, unknown>,
): Promise<DepositPaidResult> {
  const { data, error } = await admin.rpc('mark_booking_deposit_paid', { p_booking_id: bookingId, p_details: details });
  if (error) throw new Error(`mark_booking_deposit_paid: ${error.message}`);
  const result = String(data) as DepositPaidResult;
  if (result === 'confirmed') {
    try {
      const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/booking-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      await res.body?.cancel();
    } catch (e) {
      console.error('[booking-deposit] confirmação no WhatsApp falhou (não fatal)', e);
    }
  }
  if (result === 'paid_after_cancel') {
    console.warn(`[booking-deposit] Reserva ${bookingId}: sinal pago depois do prazo com o horário ocupado (devolver)`);
  }
  return result;
}
