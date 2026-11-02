// Textos da série: rótulos, resumo depois de salvar e leitura da resposta do banco.
import type { Occurrence, OccurrenceStatus, SkipReason } from './conflicts.ts';
import { formatDdMm } from './weeklyDates.ts';

export const STATUS_LABEL: Record<OccurrenceStatus, string> = {
  free: 'livre',
  busy: 'ocupado',
  off_hours: 'fora do expediente',
  blocked: 'bloqueado',
  past: 'horário já passou',
};

const REASON_ORDER: SkipReason[] = ['busy', 'off_hours', 'blocked', 'past'];
const SKIP_REASONS = new Set<string>(REASON_ORDER);

export interface SkippedDate { date: string; reason: SkipReason }
export interface CreatedDate { date: string; booking_id: string }

export interface RecurrenceResult {
  recurrenceGroupId: string | null;
  created: CreatedDate[];
  skipped: SkippedDate[];
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "ocupado em 10/11, 17/11; bloqueado em 24/11" */
export function describeSkipped(skipped: SkippedDate[]): string {
  return REASON_ORDER
    .map(reason => {
      const dates = skipped.filter(s => s.reason === reason).map(s => s.date).sort();
      return dates.length ? `${STATUS_LABEL[reason]} em ${dates.map(formatDdMm).join(', ')}` : '';
    })
    .filter(Boolean)
    .join('; ');
}

/** "3 reservas criadas; 1 data pulada (ocupado em 10/11)" */
export function buildRecurrenceSummary(result: Pick<RecurrenceResult, 'created' | 'skipped'>): string {
  const created = plural(result.created.length, 'reserva criada', 'reservas criadas');
  if (!result.skipped.length) return created;
  const skipped = plural(result.skipped.length, 'data pulada', 'datas puladas');
  return `${created}; ${skipped} (${describeSkipped(result.skipped)})`;
}

/** Resumo antes de salvar: quantas serão criadas e quantas serão puladas. */
export function previewCounts(occurrences: Occurrence[]): { free: number; skipped: number; total: number } {
  const free = occurrences.filter(o => o.status === 'free').length;
  return { free, skipped: occurrences.length - free, total: occurrences.length };
}

/** Lê o jsonb de create_recurring_bookings, tolerando formatos inesperados. */
export function normalizeRecurrenceResult(raw: unknown): RecurrenceResult {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? v : []) as Record<string, unknown>[];
  const created = list(obj.created)
    .filter(c => typeof c?.date === 'string' && typeof c?.booking_id === 'string')
    .map(c => ({ date: String(c.date), booking_id: String(c.booking_id) }));
  const skipped = list(obj.skipped)
    .filter(s => typeof s?.date === 'string')
    .map(s => ({ date: String(s.date), reason: (SKIP_REASONS.has(String(s.reason)) ? s.reason : 'busy') as SkipReason }));
  const group = typeof obj.recurrence_group_id === 'string' ? obj.recurrence_group_id : null;
  return { recurrenceGroupId: created.length ? group : null, created, skipped };
}

/** Texto extra do aviso de cancelamento da série (vai junto do motivo no WhatsApp). */
export function seriesCancelNotice(reason: string | null | undefined, otherDates: string[]): string | null {
  const others = [...otherDates].sort();
  if (!others.length) return (reason || '').trim() || null;
  const base = (reason || '').trim().replace(/[.!\s]+$/, '');
  const extra = `Também cancelamos ${others.length === 1 ? 'o horário de' : 'os horários de'} ${others.map(formatDdMm).join(', ')}.`;
  return (base ? `${base}. ${extra}` : extra).slice(0, 300);
}
