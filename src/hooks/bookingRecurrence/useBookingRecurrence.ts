// Repetição semanal do "Novo Agendamento": estado (chave, semanas, até a data), prévia das
// datas com conflitos e gravação da série pela função create_recurring_bookings.
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useStoreTimezone } from '@/hooks/useStoreTimezone';
import {
  DEFAULT_WEEKS, clampWeeks, generateWeeklyDates, isoFromLocalDate, nowInTimezone,
} from '@/lib/bookingRecurrence/weeklyDates';
import {
  classifyOccurrences, type BlockLike, type BookingLike, type ScheduleLike,
} from '@/lib/bookingRecurrence/conflicts';
import {
  buildRecurrenceSummary, describeSkipped, normalizeRecurrenceResult, previewCounts, type RecurrenceResult,
} from '@/lib/bookingRecurrence/summary';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface ServiceLike {
  id: string;
  duration_minutes: number;
  buffer_minutes?: number | null;
}

interface Params {
  open: boolean;
  storeId: string | null;
  professionalId: string;
  service?: ServiceLike | null;
  date?: Date;
  /** 'HH:mm' */
  time: string;
}

export interface RecurrenceCustomer {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
}

export const recurrenceKeys = {
  all: ['booking-recurrence'] as const,
  schedules: (professionalId: string) => ['booking-recurrence', 'schedules', professionalId] as const,
  blocks: (professionalId: string, from: string, to: string) => ['booking-recurrence', 'blocks', professionalId, from, to] as const,
  bookings: (storeId: string, professionalId: string, dates: string[]) => ['booking-recurrence', 'bookings', storeId, professionalId, dates.join(',')] as const,
};

export function useBookingRecurrence({ open, storeId, professionalId, service, date, time }: Params) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(false);
  const [weeks, setWeeksState] = useState(DEFAULT_WEEKS);
  const [untilDate, setUntilDate] = useState('');

  useEffect(() => {
    if (open) {
      setEnabled(false);
      setWeeksState(DEFAULT_WEEKS);
      setUntilDate('');
    }
  }, [open]);

  const setWeeks = (value: number) => setWeeksState(clampWeeks(value));

  const startDate = date ? isoFromLocalDate(date) : '';
  const dates = useMemo(
    () => (enabled && startDate ? generateWeeklyDates({ startDate, weeks, untilDate: untilDate || null }) : []),
    [enabled, startDate, weeks, untilDate],
  );
  const ready = enabled && !!storeId && !!professionalId && !!service && !!time && dates.length > 0;
  const firstDate = dates[0] || '';
  const lastDate = dates[dates.length - 1] || '';

  const { data: timezone } = useStoreTimezone(enabled ? storeId : null);

  const schedulesQuery = useQuery({
    queryKey: recurrenceKeys.schedules(professionalId),
    enabled: ready,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_schedules')
        .select('day_of_week, start_time, end_time, break_start, break_end, is_available')
        .eq('professional_id', professionalId);
      if (error) throw error;
      return (data || []) as ScheduleLike[];
    },
  });

  const blocksQuery = useQuery({
    queryKey: recurrenceKeys.blocks(professionalId, firstDate, lastDate),
    enabled: ready,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_blocks')
        .select('block_date, start_time, end_time, is_all_day')
        .eq('professional_id', professionalId)
        .gte('block_date', firstDate)
        .lte('block_date', lastDate);
      if (error) throw error;
      return (data || []) as BlockLike[];
    },
  });

  const bookingsQuery = useQuery({
    queryKey: recurrenceKeys.bookings(storeId || '', professionalId, dates),
    enabled: ready,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date, start_time, end_time, status')
        .eq('store_id', storeId as string)
        .eq('professional_id', professionalId)
        .in('booking_date', dates)
        .neq('status', 'cancelled');
      if (error) throw error;
      return (data || []) as BookingLike[];
    },
  });

  const occurrences = useMemo(() => {
    if (!ready) return [];
    return classifyOccurrences(dates, {
      startTime: time,
      durationMinutes: service?.duration_minutes || 30,
      bufferMinutes: service?.buffer_minutes || 0,
      schedules: schedulesQuery.data || [],
      blocks: blocksQuery.data || [],
      bookings: bookingsQuery.data || [],
      now: nowInTimezone(timezone),
    });
  }, [ready, dates, time, service, schedulesQuery.data, blocksQuery.data, bookingsQuery.data, timezone]);

  const loading = ready && (schedulesQuery.isLoading || blocksQuery.isLoading || bookingsQuery.isLoading);
  const counts = previewCounts(occurrences);

  const createMutation = useMutation({
    mutationFn: async (customer: RecurrenceCustomer): Promise<RecurrenceResult> => {
      if (!storeId || !service || !professionalId || !time || dates.length === 0) {
        throw new Error('Preencha serviço, profissional, data e horário');
      }
      const { data, error } = await db.rpc('create_recurring_bookings', {
        p_store_id: storeId,
        p_professional_id: professionalId,
        p_service_id: service.id,
        p_customer_name: customer.customerName.trim(),
        p_customer_phone: customer.customerPhone.trim(),
        p_customer_email: customer.customerEmail?.trim() || null,
        p_notes: customer.notes?.trim() || null,
        p_start_time: `${time}:00`,
        p_dates: dates,
      });
      if (error) throw error;
      return normalizeRecurrenceResult(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', storeId] });
      queryClient.invalidateQueries({ queryKey: ['bookings-for-slot'] });
      queryClient.invalidateQueries({ queryKey: recurrenceKeys.all });
      if (!result.created.length) {
        toast.error('Nenhuma reserva criada', { description: `Todas as datas estavam indisponíveis (${describeSkipped(result.skipped)}).` });
        return;
      }
      const summary = buildRecurrenceSummary(result);
      if (result.skipped.length) toast.warning(summary);
      else toast.success(summary);
      // Google Agenda do profissional, como na reserva única (em segundo plano)
      void (async () => {
        for (const c of result.created) {
          try {
            await supabase.functions.invoke('google-calendar-sync', { body: { action: 'create', booking_id: c.booking_id } });
          } catch (err) {
            console.error('Falha na sincronização com Google Calendar:', err);
          }
        }
      })();
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar a série: ${error.message}`);
    },
  });

  return {
    enabled,
    setEnabled,
    weeks,
    setWeeks,
    untilDate,
    setUntilDate,
    startDate,
    time,
    dates,
    occurrences,
    counts,
    loading,
    /** Repetição ligada com pelo menos 2 datas e alguma livre. */
    canSave: enabled && dates.length >= 2 && !loading && counts.free > 0,
    creating: createMutation.isPending,
    createSeries: createMutation.mutateAsync,
  };
}

export type BookingRecurrenceState = ReturnType<typeof useBookingRecurrence>;
