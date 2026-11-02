// Datas da repetição semanal. Tudo em texto 'AAAA-MM-DD' (data de calendário da loja):
// a conta usa Date.UTC só como calculadora de dias, nunca o fuso do navegador.

export const MIN_WEEKS = 2;
export const MAX_WEEKS = 12;
export const DEFAULT_WEEKS = 4;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

function toUtc(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysIso(iso: string, days: number): string {
  const d = toUtc(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** Dia da semana (0 = domingo), igual a `Date.getDay()` e ao `extract(dow)` do Postgres. */
export function weekdayOfIso(iso: string): number {
  return toUtc(iso).getUTCDay();
}

/** 'AAAA-MM-DD' → 'dd/mm'. */
export function formatDdMm(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/** Data local (y/m/d do objeto Date, como o calendário do diálogo entrega) → 'AAAA-MM-DD'. */
export function isoFromLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function clampWeeks(weeks: unknown): number {
  const n = Math.floor(Number(weeks));
  if (!Number.isFinite(n)) return DEFAULT_WEEKS;
  return Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, n));
}

export interface WeeklyDatesInput {
  /** Primeira data (a escolhida no diálogo). */
  startDate: string;
  /** Quantidade de datas, contando a primeira (2 a 12). */
  weeks?: number | null;
  /** Última data aceita (inclusive). Opcional; vale junto com `weeks`. */
  untilDate?: string | null;
}

/**
 * Gera as datas semanais a partir da primeira: até `weeks` datas e, se houver `untilDate`,
 * só as que caem até ela. Nunca passa de 12.
 */
export function generateWeeklyDates({ startDate, weeks, untilDate }: WeeklyDatesInput): string[] {
  if (!isIsoDate(startDate)) return [];
  const count = clampWeeks(weeks ?? DEFAULT_WEEKS);
  const limit = isIsoDate(untilDate) ? untilDate : null;
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    const date = addDaysIso(startDate, i * 7);
    if (limit && date > limit) break;
    dates.push(date);
  }
  return dates;
}

/** "Hoje" e minutos do dia no fuso da loja (ex.: America/Sao_Paulo). */
export function nowInTimezone(timezone: string | null | undefined, now: Date = new Date()): { date: string; minutes: number } {
  const tz = timezone || 'America/Sao_Paulo';
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(now);
  }
  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')),
  };
}
