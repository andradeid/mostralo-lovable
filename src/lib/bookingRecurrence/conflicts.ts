// Marca cada data da série: livre, ocupada, fora do expediente, bloqueada ou já passada.
// Mesma regra de horário do "Novo Agendamento" (expediente, intervalo, bloqueios e reservas,
// com a folga do serviço) e da função create_recurring_bookings no banco.
import { weekdayOfIso } from './weeklyDates.ts';

export type OccurrenceStatus = 'free' | 'busy' | 'off_hours' | 'blocked' | 'past';
export type SkipReason = Exclude<OccurrenceStatus, 'free'>;

export interface ScheduleLike {
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start?: string | null;
  break_end?: string | null;
  is_available?: boolean | null;
}

export interface BlockLike {
  block_date: string;
  start_time?: string | null;
  end_time?: string | null;
  is_all_day?: boolean | null;
}

export interface BookingLike {
  booking_date: string;
  start_time: string;
  end_time: string;
  status?: string | null;
}

export interface Occurrence {
  date: string;
  status: OccurrenceStatus;
}

export interface ClassifyContext {
  /** 'HH:mm' ou 'HH:mm:ss'. */
  startTime: string;
  durationMinutes: number;
  bufferMinutes?: number;
  schedules: ScheduleLike[];
  blocks: BlockLike[];
  bookings: BookingLike[];
  /** "Agora" no fuso da loja (veja nowInTimezone). */
  now?: { date: string; minutes: number } | null;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && aEnd > bStart;

export function classifyOccurrence(date: string, ctx: ClassifyContext): OccurrenceStatus {
  const start = timeToMinutes(ctx.startTime);
  const duration = Math.max(1, ctx.durationMinutes || 30);
  const busyEnd = start + duration + Math.max(0, ctx.bufferMinutes || 0);

  if (ctx.now && (date < ctx.now.date || (date === ctx.now.date && start <= ctx.now.minutes))) return 'past';

  const weekday = weekdayOfIso(date);
  const schedule = ctx.schedules.find(s => s.day_of_week === weekday);
  if (!schedule || !schedule.is_available) return 'off_hours';
  const workStart = timeToMinutes(schedule.start_time);
  const workEnd = timeToMinutes(schedule.end_time);
  if (start < workStart || start + duration > workEnd) return 'off_hours';
  if (schedule.break_start && schedule.break_end
    && overlaps(start, busyEnd, timeToMinutes(schedule.break_start), timeToMinutes(schedule.break_end))) {
    return 'off_hours';
  }

  const dayBlocks = ctx.blocks.filter(b => b.block_date === date);
  if (dayBlocks.some(b => b.is_all_day)) return 'blocked';
  if (dayBlocks.some(b => b.start_time && b.end_time
    && overlaps(start, busyEnd, timeToMinutes(b.start_time), timeToMinutes(b.end_time)))) {
    return 'blocked';
  }

  const busy = ctx.bookings.some(b => b.booking_date === date && b.status !== 'cancelled'
    && overlaps(start, busyEnd, timeToMinutes(b.start_time), timeToMinutes(b.end_time)));
  return busy ? 'busy' : 'free';
}

export function classifyOccurrences(dates: string[], ctx: ClassifyContext): Occurrence[] {
  return dates.map(date => ({ date, status: classifyOccurrence(date, ctx) }));
}
