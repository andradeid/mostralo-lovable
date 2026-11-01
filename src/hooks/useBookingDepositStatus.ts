import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Sinal devolvido pela create-public-booking (mais o id da reserva). */
export interface PublicBookingDeposit {
  booking_id: string;
  mode: 'store' | 'mostralo';
  amount: number;
  paid: boolean;
  // Pix da loja
  pix_key?: string;
  pix_key_type?: string;
  pix_recipient_name?: string | null;
  // Pix pelo Mostralo
  expires_at?: string | null;
  txid?: string;
  qrcode?: string | null;
  pix_copia_e_cola?: string | null;
}

export interface BookingDepositStatus {
  paid: boolean;
  cancelled: boolean;
  /** Prazo do Pix do Mostralo acabou (ou a reserva foi cancelada por isso) */
  expired: boolean;
  confirmationSent: boolean;
  /** Segundos até o Pix vencer (modo Mostralo) */
  secondsLeft: number | null;
  cancelling: boolean;
  cancel: () => Promise<boolean>;
}

const POLL_MOSTRALO_MS = 4000;
const POLL_STORE_MS = 20000;
const STORE_POLL_LIMIT_MS = 30 * 60_000;

/** Acompanha o sinal na tela de sucesso: consulta booking-deposit até pagar, vencer ou cancelar. */
export function useBookingDepositStatus(deposit: PublicBookingDeposit | null | undefined): BookingDepositStatus {
  const [paid, setPaid] = useState(!!deposit?.paid);
  const [cancelled, setCancelled] = useState(false);
  const [expired, setExpired] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [cancelling, setCancelling] = useState(false);
  const startedAt = useRef(Date.now());

  const bookingId = deposit?.booking_id;
  const mode = deposit?.mode;
  const expiresAt = deposit?.expires_at ? new Date(deposit.expires_at).getTime() : null;
  const done = !deposit || paid || cancelled;

  useEffect(() => {
    setPaid(!!deposit?.paid);
    setCancelled(false);
    setExpired(false);
    setConfirmationSent(false);
    startedAt.current = Date.now();
  }, [bookingId, deposit?.paid]);

  // Relógio do prazo (modo Mostralo)
  useEffect(() => {
    if (done || mode !== 'mostralo' || !expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [done, mode, expiresAt]);

  // Consulta do status
  useEffect(() => {
    if (done || !bookingId) return;
    let stop = false;
    const check = async () => {
      if (mode === 'store' && Date.now() - startedAt.current > STORE_POLL_LIMIT_MS) return;
      try {
        const { data } = await supabase.functions.invoke('booking-deposit', { body: { action: 'status', booking_id: bookingId } });
        if (stop || !data) return;
        if (data.paid) setPaid(true);
        if (data.cancelled) setCancelled(true);
        if (data.expired) setExpired(true);
        if (data.confirmation_sent) setConfirmationSent(true);
      } catch (err) {
        console.error('[deposit-status]', err);
      }
    };
    const t = setInterval(check, mode === 'mostralo' ? POLL_MOSTRALO_MS : POLL_STORE_MS);
    return () => { stop = true; clearInterval(t); };
  }, [done, bookingId, mode]);

  // Depois de pago, mais algumas consultas para saber se a confirmação saiu no WhatsApp
  useEffect(() => {
    if (!paid || confirmationSent || !bookingId || mode !== 'mostralo') return;
    let tries = 0;
    const t = setInterval(async () => {
      tries += 1;
      try {
        const { data } = await supabase.functions.invoke('booking-deposit', { body: { action: 'status', booking_id: bookingId } });
        if (data?.confirmation_sent) { setConfirmationSent(true); clearInterval(t); }
      } catch { /* tenta de novo */ }
      if (tries >= 5) clearInterval(t);
    }, 3000);
    return () => clearInterval(t);
  }, [paid, confirmationSent, bookingId, mode]);

  const cancel = useCallback(async () => {
    if (!bookingId) return false;
    setCancelling(true);
    try {
      const { data } = await supabase.functions.invoke('booking-deposit', { body: { action: 'cancel', booking_id: bookingId } });
      if (data?.cancelled) setCancelled(true);
      return !!data?.cancelled;
    } catch (err) {
      console.error('[deposit-cancel]', err);
      return false;
    } finally {
      setCancelling(false);
    }
  }, [bookingId]);

  const secondsLeft = mode === 'mostralo' && expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : null;
  const timedOut = mode === 'mostralo' && !paid && secondsLeft === 0;

  return {
    paid,
    cancelled,
    expired: expired || timedOut,
    confirmationSent,
    secondsLeft,
    cancelling,
    cancel,
  };
}
