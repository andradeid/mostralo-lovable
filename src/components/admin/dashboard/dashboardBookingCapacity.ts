import { supabase } from '@/integrations/supabase/client';

interface ProfessionalScheduleRow {
  professional_id: string;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean | null;
}

interface ProfessionalRow {
  id: string;
}

export interface DashboardBookingCapacity {
  scheduledProfessionalIds: string[];
  scheduledProfessionalCount: number;
  totalSlots: number;
}

function timeToMinutes(value: string | null) {
  if (!value) return 0;

  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
}

export async function getDashboardBookingCapacity(
  storeId: string,
  referenceDate = new Date(),
): Promise<DashboardBookingCapacity> {
  const dayOfWeek = referenceDate.getDay();

  const [{ data: professionals, error: professionalsError }, { data: schedules, error: schedulesError }] = await Promise.all([
    supabase
      .from('professionals')
      .select('id')
      .eq('store_id', storeId)
      .eq('is_active', true),
    supabase
      .from('professional_schedules')
      .select('professional_id, start_time, end_time, is_available')
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true),
  ]);

  if (professionalsError) throw professionalsError;
  if (schedulesError) throw schedulesError;

  const activeProfessionalIds = new Set((professionals as ProfessionalRow[] | null)?.map((professional) => professional.id) || []);
  const validSchedules = ((schedules as ProfessionalScheduleRow[] | null) || []).filter((schedule) =>
    activeProfessionalIds.has(schedule.professional_id),
  );

  const scheduledProfessionalIds = Array.from(new Set(validSchedules.map((schedule) => schedule.professional_id)));

  let totalSlots = validSchedules.reduce((sum, schedule) => {
    const durationInMinutes = Math.max(0, timeToMinutes(schedule.end_time) - timeToMinutes(schedule.start_time));
    return sum + Math.round(durationInMinutes / 60);
  }, 0);

  if (totalSlots === 0 && scheduledProfessionalIds.length > 0) {
    totalSlots = scheduledProfessionalIds.length * 8;
  }

  return {
    scheduledProfessionalIds,
    scheduledProfessionalCount: scheduledProfessionalIds.length,
    totalSlots,
  };
}
