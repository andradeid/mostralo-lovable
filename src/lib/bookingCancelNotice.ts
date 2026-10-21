import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/** Avisa o cliente pelo WhatsApp que a loja cancelou o agendamento (função booking-cancel-notify). */
export async function notifyCustomerOfCancellation(bookingId: string, reason?: string | null): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('booking-cancel-notify', {
      body: { booking_id: bookingId, reason: reason || null },
    });
    if (error) throw error;
    if (data?.sent) toast.success('Cliente avisado pelo WhatsApp');
    else if (data?.skipped) toast.info(`Cliente não foi avisado: ${data.skipped}`);
    else toast.error('Não foi possível avisar o cliente pelo WhatsApp');
  } catch (err) {
    console.error('[cancel-notice]', err);
    toast.error('Agendamento cancelado, mas o aviso pelo WhatsApp falhou');
  }
}
