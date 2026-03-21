import { supabase } from '@/integrations/supabase/client';

interface ProfessionalRow {
  id: string;
}

interface ScheduleRow {
  professional_id: string;
  start_time: string | null;
  end_time: string | null;
}

interface BlockRow {
  professional_id: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean | null;
}

function toHour(value: string | null) {
  return parseInt(value?.split(':')[0] || '0', 10);
}

function getBlockedHours(block: BlockRow, schedules: ScheduleRow[]) {
  if (block.is_all_day) {
    return schedules.reduce((total, schedule) => {
      return total + Math.max(0, toHour(schedule.end_time) - toHour(schedule.start_time));
    }, 0);
  }

  return Math.max(0, toHour(block.end_time) - toHour(block.start_time));
}

export interface DashboardOccupancyStats {
  occupancy: number;
  freeSlots: number;
  bookedCount: number;
  scheduledProfessionalCount: number;
}

export async function getDashboardOccupancyStats(
  storeId: string,
  referenceDate = new Date(),
): Promise<DashboardOccupancyStats> {
  const date = referenceDate.toISOString().split('T')[0];
  const dayOfWeek = referenceDate.getDay();

  const [
    { data: bookings, error: bookingsError },
    { data: schedules, error: schedulesError },
    { data: professionals, error: professionalsError },
    { data: blocks, error: blocksError },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('start_time, professional_id')
      .eq('store_id', storeId)
      .eq('booking_date', date)
      .not('status', 'in', '("cancelled","no_show")'),
    supabase
      .from('professional_schedules')
      .select('professional_id, start_time, end_time')
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true),
    supabase
      .from('professionals')
      .select('id')
      .eq('store_id', storeId)
      .eq('is_active', true),
    supabase
      .from('professional_blocks')
      .select('professional_id, start_time, end_time, is_all_day')
      .eq('block_date', date),
  ]);

  if (bookingsError) throw bookingsError;
  if (schedulesError) throw schedulesError;
  if (professionalsError) throw professionalsError;
  if (blocksError) throw blocksError;

  const activeProfessionals = (professionals || []) as ProfessionalRow[];
  const dailySchedules = (schedules || []) as ScheduleRow[];
  const dailyBlocks = (blocks || []) as BlockRow[];

  const professionalsWithSchedule = activeProfessionals.filter((professional) =>
    dailySchedules.some((schedule) => schedule.professional_id === professional.id),
  );

  const scheduledProfessionalCount = professionalsWithSchedule.length;

  let totalSlots = 0;
  professionalsWithSchedule.forEach((professional) => {
    const professionalSchedules = dailySchedules.filter((schedule) => schedule.professional_id === professional.id);
    const professionalBlocks = dailyBlocks.filter((block) => block.professional_id === professional.id);

    const scheduledHours = professionalSchedules.reduce((total, schedule) => {
      return total + Math.max(0, toHour(schedule.end_time) - toHour(schedule.start_time));
    }, 0);

    const blockedHours = professionalBlocks.reduce((total, block) => {
      return total + getBlockedHours(block, professionalSchedules);
    }, 0);

    totalSlots += Math.max(0, scheduledHours - blockedHours);
  });

  if (totalSlots === 0 && scheduledProfessionalCount > 0) {
    totalSlots = scheduledProfessionalCount * 8;
  }

  const bookedCount = bookings?.length || 0;
  const occupancy = totalSlots > 0
    ? Math.min(100, Math.round((bookedCount / totalSlots) * 100))
    : 0;

  return {
    occupancy,
    freeSlots: Math.max(0, totalSlots - bookedCount),
    bookedCount,
    scheduledProfessionalCount,
  };
}
