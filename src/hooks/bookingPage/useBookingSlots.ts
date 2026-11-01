// Horários do passo "Data/Hora": expediente, bloqueios e agendamentos do(s) profissional(is)
// no dia, dias da semana atendidos (calendário), horários livres e o motivo de não haver horário.
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { BookingService, Professional } from '@/lib/bookingPage/types';
import {
  computeSlotsByTime,
  getNoSlotsMessage as noSlotsMessageFor,
  getNoSlotsReason,
  pickProfessionalForTimeFrom,
} from '@/lib/bookingPage/rules';
import type { PublicBookingSettings } from './useBookingSettings';

interface Params {
  storeId: string | undefined;
  businessHours: any;
  bookingSettings: PublicBookingSettings;
  selectedService: BookingService | null;
  selectedProfessional: Professional | null;
  anyProfessional: boolean;
  eligibleProfessionals: Professional[];
  selectedDate: Date | undefined;
}

export function useBookingSlots({
  storeId,
  businessHours,
  bookingSettings,
  selectedService,
  selectedProfessional,
  anyProfessional,
  eligibleProfessionals,
  selectedDate,
}: Params) {
  // Profissionais cujos horários entram no cálculo (um só, ou todos no "qualquer profissional")
  const targetProfIds = useMemo(
    () => (anyProfessional ? eligibleProfessionals.map(p => p.id) : selectedProfessional ? [selectedProfessional.id] : []),
    [anyProfessional, eligibleProfessionals, selectedProfessional]
  );
  const targetKey = targetProfIds.join(',');
  const hasTarget = targetProfIds.length > 0;

  // Horário de trabalho do(s) profissional(is) no dia da semana escolhido
  const { data: schedulesForDay = [], isLoading: loadingSchedule } = useQuery({
    queryKey: ['professional-schedule-public', targetKey, selectedDate?.getDay()],
    queryFn: async () => {
      if (!hasTarget || selectedDate === undefined) return [];
      const { data, error } = await supabase
        .from('professional_schedules')
        .select('*')
        .in('professional_id', targetProfIds)
        .eq('day_of_week', selectedDate.getDay());
      if (error) {
        console.error('Error fetching professional schedule:', error);
        return [];
      }
      return data || [];
    },
    enabled: hasTarget && !!selectedDate,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  // Dias da semana em que o(s) profissional(is) atendem (para desabilitar no calendário)
  const { data: workingWeekdays } = useQuery({
    queryKey: ['professional-weekdays-public', targetKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_schedules')
        .select('day_of_week, is_available')
        .in('professional_id', targetProfIds);
      if (error) return null;
      return new Set((data || []).filter((r: any) => r.is_available).map((r: any) => r.day_of_week as number));
    },
    enabled: hasTarget,
    staleTime: 5 * 60_000,
  });

  // Bloqueios do(s) profissional(is) na data
  const { data: blocksForDay = [] } = useQuery({
    queryKey: ['professional-blocks-public', targetKey, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!hasTarget || !selectedDate) return [];
      const { data, error } = await supabase
        .from('professional_blocks')
        .select('*')
        .in('professional_id', targetProfIds)
        .eq('block_date', format(selectedDate, 'yyyy-MM-dd'))
        .limit(200);
      if (error) {
        console.error('Error fetching professional blocks:', error);
        return [];
      }
      return data || [];
    },
    enabled: hasTarget && !!selectedDate,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  // Agendamentos existentes do(s) profissional(is) na data
  const { data: bookingsForDay = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['bookings-public', storeId, targetKey, selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      if (!storeId || !hasTarget || !selectedDate) return [];
      const { data, error } = await (supabase as any)
        .from('booking_availability')
        .select('professional_id, start_time, end_time, status')
        .eq('store_id', storeId)
        .in('professional_id', targetProfIds)
        .eq('booking_date', format(selectedDate, 'yyyy-MM-dd'))
        .neq('status', 'cancelled')
        .limit(500);
      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!storeId && hasTarget && !!selectedDate,
    staleTime: 30_000,
    gcTime: 120_000,
  });

  // Visão de um profissional só (mensagens de "não atende" etc.)
  const professionalSchedule = anyProfessional ? null : (schedulesForDay[0] ?? null);
  const professionalBlocks = anyProfessional ? [] : blocksForDay;

  // Calculate max date based on booking settings
  const maxDate = useMemo(() => {
    if (bookingSettings?.max_advance_days) {
      return addDays(new Date(), bookingSettings.max_advance_days);
    }
    return undefined;
  }, [bookingSettings?.max_advance_days]);

  // Determine no slots reason
  const noSlotsReason = useMemo(
    () => getNoSlotsReason({
      businessHours, anyProfessional, schedulesForDay, selectedProfessional, selectedDate, professionalSchedule, professionalBlocks,
    }),
    [businessHours, anyProfessional, schedulesForDay, selectedProfessional, selectedDate, professionalSchedule, professionalBlocks]
  );

  // Get no slots message
  const getNoSlotsMessage = () => noSlotsMessageFor(noSlotsReason, selectedProfessional, businessHours, selectedDate);

  // Horários livres por profissional (mesma lógica do painel). Retorna horário → profissionais livres.
  const slotsByTime = useMemo(
    () => computeSlotsByTime({
      businessHours,
      selectedDate,
      selectedService,
      targetProfIds,
      schedulesForDay,
      blocksForDay,
      bookingsForDay,
      slotIntervalMinutes: bookingSettings?.slot_interval_minutes,
      minAdvanceHours: bookingSettings?.min_advance_hours,
    }),
    [businessHours, selectedDate, selectedService, targetProfIds, schedulesForDay, blocksForDay, bookingsForDay, bookingSettings?.slot_interval_minutes, bookingSettings?.min_advance_hours]
  );

  const availableSlots = useMemo(() => Array.from(slotsByTime.keys()).sort(), [slotsByTime]);

  // No "qualquer profissional", atribui quem estiver livre no horário e com menos atendimentos no dia
  const pickProfessionalForTime = useCallback(
    (time: string): Professional | null => pickProfessionalForTimeFrom(time, slotsByTime, bookingsForDay, eligibleProfessionals),
    [slotsByTime, bookingsForDay, eligibleProfessionals]
  );

  // Loading state for slots
  const loadingSlots = loadingSchedule || loadingBookings;

  return {
    workingWeekdays,
    maxDate,
    getNoSlotsMessage,
    availableSlots,
    pickProfessionalForTime,
    loadingSlots,
  };
}
