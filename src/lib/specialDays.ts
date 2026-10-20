/**
 * Dias especiais (feriados, véspera de Natal...) gravados em stores.business_hours.special_days.
 * Têm prioridade sobre o horário da semana: fechado o dia todo, ou com horário próprio.
 */
export interface SpecialDay {
  id: string;
  date: string; // AAAA-MM-DD
  name: string;
  open: string; // HH:MM
  close: string; // HH:MM
  closed: boolean;
}

const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function getSpecialDays(businessHours: any): SpecialDay[] {
  const list = businessHours?.special_days;
  return Array.isArray(list) ? list.filter((d: any) => d && typeof d.date === 'string') : [];
}

export function toDateKey(date: Date | string): string {
  if (typeof date === 'string') return date.slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getSpecialDayFor(businessHours: any, date: Date | string): SpecialDay | null {
  const key = toDateKey(date);
  return getSpecialDays(businessHours).find((d) => d.date === key) || null;
}

/** Horário que vale no dia (dia especial > horário da semana). null = sem horário cadastrado. */
export function effectiveDayHours(
  businessHours: any,
  date: Date
): { open: string; close: string; closed: boolean; specialName?: string } | null {
  const special = getSpecialDayFor(businessHours, date);
  if (special) return { open: special.open, close: special.close, closed: special.closed, specialName: special.name };
  const day = businessHours?.[WEEKDAY_KEYS[date.getDay()]];
  return day ? { open: day.open, close: day.close, closed: !!day.closed } : null;
}
