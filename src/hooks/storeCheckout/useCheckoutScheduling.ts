import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduledSlot {
  slot_at: string;
  slot_time: string;
  available: boolean;
  remaining: number | null;
}

export type CalendarDays = Record<string, { is_open: boolean; slots_available: number }>;

interface Params {
  storeId: string;
  /** Agendamento ligado na loja */
  enabled: boolean;
  deliveryType: string;
  selectedDate?: Date;
  /** Buscar horários só quando o cliente escolheu agendar (página /checkout); o diálogo busca sempre */
  slotsActive?: boolean;
  /** Muda para forçar recarregar dias e horários (ex.: horário recusado no envio) */
  refreshKey?: number;
}

/**
 * Dias do mês e horários do dia para pedido agendado. Fuso e regras ficam no banco
 * (RPCs get_scheduled_days e get_scheduled_slots); a tela só mostra o que vier.
 */
export function useCheckoutScheduling({ storeId, enabled, deliveryType, selectedDate, slotsActive = true, refreshKey = 0 }: Params) {
  const [availableSlots, setAvailableSlots] = useState<ScheduledSlot[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDays>({});
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [calendarLoading, setCalendarLoading] = useState(false);
  const mappedType = deliveryType === 'pickup' ? 'pickup' : 'delivery';

  useEffect(() => {
    if (!slotsActive || !selectedDate || !storeId || !enabled) {
      setAvailableSlots([]);
      return;
    }
    let cancelled = false;
    (supabase as any)
      .rpc('get_scheduled_slots', { p_store_id: storeId, p_date: format(selectedDate, 'yyyy-MM-dd'), p_delivery_type: mappedType })
      .then(({ data, error }: any) => {
        if (cancelled) return;
        if (error) {
          console.error('[checkout] get_scheduled_slots:', error);
          setAvailableSlots([]);
          return;
        }
        setAvailableSlots((data ?? []) as ScheduledSlot[]);
      });
    return () => { cancelled = true; };
  }, [slotsActive, selectedDate, storeId, mappedType, enabled, refreshKey]);

  useEffect(() => {
    if (!storeId || !enabled) return;
    let cancelled = false;
    setCalendarLoading(true);
    (supabase as any)
      .rpc('get_scheduled_days', {
        p_store_id: storeId,
        p_from: format(startOfMonth(calendarMonth), 'yyyy-MM-dd'),
        p_to: format(endOfMonth(calendarMonth), 'yyyy-MM-dd'),
        p_delivery_type: mappedType,
      })
      .then(({ data, error }: any) => {
        if (cancelled) return;
        setCalendarLoading(false);
        if (error) {
          console.error('[checkout] get_scheduled_days:', error);
          setCalendarDays({});
          return;
        }
        const map: CalendarDays = {};
        (data ?? []).forEach((d: any) => { map[d.day] = { is_open: d.is_open, slots_available: d.slots_available }; });
        setCalendarDays(map);
      });
    return () => { cancelled = true; };
  }, [calendarMonth, mappedType, storeId, enabled, refreshKey]);

  return { availableSlots, calendarDays, calendarMonth, setCalendarMonth, calendarLoading };
}
