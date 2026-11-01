// Envio do agendamento público, nesta ordem:
// create-public-booking → (em segundo plano) booking-confirmation e booking-magic-link "create"
// → no reagendamento, booking-magic-link "cancel_for_reschedule" (com sinal pendente o horário
// antigo fica até o pagamento: waiting_deposit) → tela de sucesso.
import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { PublicBookingDeposit } from '@/hooks/useBookingDepositStatus';
import type { BookingService, Professional, StoreInfo } from '@/lib/bookingPage/types';
import { calculateEndTime, validateBookingForm } from '@/lib/bookingPage/rules';
import type { BookingCustomerForm } from './useBookingCustomerForm';

interface Params {
  store: StoreInfo | null;
  selectedService: BookingService | null;
  effectiveProfessional: Professional | null;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  rescheduleToken: string | null;
  form: BookingCustomerForm;
}

export function useBookingSubmit({
  store,
  selectedService,
  effectiveProfessional,
  selectedDate,
  selectedTime,
  rescheduleToken,
  form,
}: Params) {
  const { customerName, customerPhone, customerEmail, notes, setErrors } = form;
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [manageToken, setManageToken] = useState<string | null>(null);
  // Sinal da reserva (só quando a loja exige; calculado no servidor)
  const [deposit, setDeposit] = useState<PublicBookingDeposit | null>(null);
  const [confirmationWhatsappSent, setConfirmationWhatsappSent] = useState(false);
  const [showConfirmationAnimation, setShowConfirmationAnimation] = useState(false);

  const handleSubmit = async () => {
    if (!store || !selectedService || !effectiveProfessional || !selectedDate || !selectedTime) {
      return;
    }

    const fieldErrors = validateBookingForm({ customerName, customerPhone, customerEmail, notes });
    if (fieldErrors) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      // 1. Animação enquanto o agendamento é criado (antes eram 3 s parados ANTES de criar)
      setShowConfirmationAnimation(true);
      const minAnimation = new Promise(resolve => setTimeout(resolve, 700));

      const endTime = calculateEndTime(selectedTime, selectedService.duration_minutes);

      // 3. Criar agendamento via Edge Function segura
      const { data: bookingResponse, error } = await supabase.functions.invoke('create-public-booking', {
        body: {
          store_id: store.id,
          professional_id: effectiveProfessional.id,
          service_id: selectedService.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim() || null,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedTime + ':00',
          end_time: endTime + ':00',
          price: selectedService.price,
          notes: notes.trim() || null,
          status: 'confirmed',
          reschedule_token: rescheduleToken || undefined
        }
      });

      await minAnimation;
      setShowConfirmationAnimation(false);

      if (error) {
        // Mostra o motivo que o servidor deu (ex.: "Fechado nesta data (Natal).")
        let serverMessage: string | undefined;
        try { serverMessage = (await (error as any).context?.json?.())?.error; } catch { /* sem corpo */ }
        throw new Error(serverMessage || 'Erro ao criar agendamento. Tente novamente.');
      }

      const bookingData = bookingResponse?.booking;
      if (!bookingData?.id) {
        throw new Error('Agendamento não retornado pela função');
      }
      const bookingDeposit = bookingResponse?.deposit ? { ...bookingResponse.deposit, booking_id: bookingData.id } as PublicBookingDeposit : null;
      setDeposit(bookingDeposit);

      // 6 e 7. Confirmação no WhatsApp e link de gestão em segundo plano: a tela de sucesso
      // aparece na hora e o texto "enviamos no seu WhatsApp" atualiza quando a mensagem sair.
      (async () => {
        try {
          const { data: confirmData, error: confirmError } = await supabase.functions.invoke('booking-confirmation', {
            body: { booking_id: bookingData.id, is_reschedule: !!rescheduleToken }
          });
          setConfirmationWhatsappSent(
            !confirmError && (confirmData?.whatsapp_sent === true || confirmData?.message === 'Confirmação enviada com sucesso')
          );
          if (confirmError) console.error('[BookingPage] Erro ao enviar confirmação:', confirmError);
        } catch (confirmErr) {
          console.error('[BookingPage] Erro na chamada de confirmação:', confirmErr);
        }
      })();
      (async () => {
        try {
          const { data: magicData, error: magicError } = await supabase.functions.invoke('booking-magic-link', {
            body: { action: 'create', booking_id: bookingData.id, skip_whatsapp: true }
          });
          if (magicError) {
            console.error('[BookingPage] Erro ao gerar magic link:', magicError);
            return;
          }
          if (magicData?.token) setManageToken(magicData.token);
        } catch (magicErr) {
          console.error('[BookingPage] Erro no magic link:', magicErr);
        }
      })();

      // 8. Fluxo de reagendamento: liberar o horário antigo só após o novo estar confirmado (com sinal, só após o pagamento)
      if (rescheduleToken) {
        try {
          const { data: cancelOld, error: cancelOldError } = await supabase.functions.invoke('booking-magic-link', {
            body: { action: 'cancel_for_reschedule', token: rescheduleToken, new_booking_id: bookingData.id }
          });
          // Novo horário esperando sinal: o antigo só é liberado quando o sinal for pago
          if (cancelOld?.waiting_deposit) setDeposit((d) => (d ? { ...d, keeps_previous: true } : d));
          if (cancelOldError) {
            console.error('[BookingPage] Falha ao cancelar agendamento anterior (reagendamento):', cancelOldError);
          }
        } catch (rescheduleErr) {
          console.error('[BookingPage] Erro no cancelamento do reagendamento:', rescheduleErr);
        }
      }

      setSuccess(true);

      toast.success(bookingDeposit && !bookingDeposit.paid ? 'Horário reservado! Falta o sinal.' : 'Agendamento realizado com sucesso!');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error instanceof Error && error.message ? error.message : 'Erro ao criar agendamento. Tente novamente.');
    } finally {
      setShowConfirmationAnimation(false);
      setSubmitting(false);
    }
  };

  return {
    handleSubmit,
    submitting,
    success,
    manageToken,
    deposit,
    confirmationWhatsappSent,
    showConfirmationAnimation,
  };
}
