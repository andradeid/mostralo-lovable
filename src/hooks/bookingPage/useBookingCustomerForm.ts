// Dados do cliente no passo "Confirmar" (nome, WhatsApp, e-mail, observações e erros de validação).
// No reagendamento, já vem com nome e WhatsApp do agendamento original.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatBrazilianPhone } from '@/lib/utils';

export function useBookingCustomerForm(rescheduleToken: string | null) {
  // Customer data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [countryCode, setCountryCode] = useState('+55');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // No reagendamento, já preenche nome e WhatsApp do agendamento original (o cliente não precisa digitar de novo)
  useEffect(() => {
    if (!rescheduleToken) return;
    let cancelled = false;
    supabase.functions
      .invoke('booking-magic-link', { body: { action: 'resolve', token: rescheduleToken } })
      .then(({ data }) => {
        const original = data?.booking;
        if (cancelled || !original) return;
        if (original.customer_name) setCustomerName(prev => prev || original.customer_name);
        if (original.customer_phone) {
          let digits = String(original.customer_phone).replace(/\D/g, '');
          if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) digits = digits.slice(2);
          setCustomerPhone(prev => prev || formatBrazilianPhone(digits));
        }
      })
      .catch(() => { /* sem pré-preenchimento: o cliente digita normalmente */ });
    return () => { cancelled = true; };
  }, [rescheduleToken]);

  return {
    customerName, setCustomerName,
    customerPhone, setCustomerPhone,
    customerEmail, setCustomerEmail,
    notes, setNotes,
    countryCode, setCountryCode,
    errors, setErrors,
  };
}

export type BookingCustomerForm = ReturnType<typeof useBookingCustomerForm>;
