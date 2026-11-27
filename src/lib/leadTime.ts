// Prazo de produção em dias úteis (encomendas). Puro; testado em leadTime.test.ts.
//
// A loja define delivery_config.lead_time_business_days (ex.: 5). Ao aceitar o pedido, o prazo
// vira a data limite: fim do N-ésimo dia útil (seg–sex) depois do aceite, no fuso da loja.
// Gravamos em orders.estimated_delivery_minutes os minutos entre a criação do pedido e essa data,
// assim o resto do sistema continua funcionando; prazos de 1 dia ou mais são mostrados como data.

export const LONG_ESTIMATE_MINUTES = 24 * 60;
export const MAX_LEAD_DAYS = 60;
const DEFAULT_TZ = 'America/Sao_Paulo';

/** Dias úteis configurados na loja (1 a 60) ou null. */
export function leadDaysFromConfig(config: unknown): number | null {
  if (!config || typeof config !== 'object') return null;
  const n = Number((config as { lead_time_business_days?: unknown }).lead_time_business_days);
  return Number.isInteger(n) && n >= 1 && n <= MAX_LEAD_DAYS ? n : null;
}

/** "até 5 dias úteis" / "até 1 dia útil". */
export function leadTimeText(days: number): string {
  return `até ${days} ${days === 1 ? 'dia útil' : 'dias úteis'}`;
}

/** Texto do checkout para loja com prazo em dias úteis. */
export function leadTimeCheckoutText(days: number): string {
  return `Pronto em ${leadTimeText(days)} após a confirmação do pagamento`;
}

/** Ano, mês (1-12), dia e dia da semana (0=dom) da data no fuso informado. */
function localParts(d: Date, timeZone: string): { y: number; m: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), day: get('day') };
}

/** Diferença (ms) entre o horário local do fuso e o UTC naquele instante. */
function tzOffsetMs(d: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(d.getTime() / 1000) * 1000;
}

/**
 * Data limite: fim (23:59) do N-ésimo dia útil depois de `from`, no fuso da loja.
 * Sábado e domingo não contam (feriados não são considerados).
 */
export function businessDeadline(from: Date, days: number, timeZone: string = DEFAULT_TZ): Date {
  const { y, m, day } = localParts(from, timeZone);
  const cursor = new Date(Date.UTC(y, m - 1, day));
  let left = Math.max(0, Math.floor(days));
  while (left > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const wd = cursor.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  const localEnd = Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(), 23, 59, 0);
  return new Date(localEnd - tzOffsetMs(new Date(localEnd), timeZone));
}

/** Minutos entre a criação do pedido e a data limite contada a partir do aceite (`now`). */
export function leadMinutesFromCreation(createdAt: string | Date, days: number, now: Date = new Date(), timeZone: string = DEFAULT_TZ): number {
  const deadline = businessDeadline(now, days, timeZone);
  // para baixo: arredondar para cima podia passar da meia-noite e mostrar o dia seguinte
  return Math.max(1, Math.floor((deadline.getTime() - new Date(createdAt).getTime()) / 60000));
}

/** Estimativa longa (1 dia ou mais): mostrar como data, não como contagem em minutos. */
export function isLongEstimate(minutes: number | null | undefined): boolean {
  return typeof minutes === 'number' && minutes >= LONG_ESTIMATE_MINUTES;
}

/** "qui., 03/12" no fuso da loja. */
export function deadlineLabel(date: Date, timeZone: string = DEFAULT_TZ): string {
  const wd = new Intl.DateTimeFormat('pt-BR', { timeZone, weekday: 'short' }).format(date);
  const dm = new Intl.DateTimeFormat('pt-BR', { timeZone, day: '2-digit', month: '2-digit' }).format(date);
  return `${wd} ${dm}`;
}

/** Data limite a partir da criação + minutos estimados. */
export function estimateDeadline(createdAt: string | Date, minutes: number): Date {
  return new Date(new Date(createdAt).getTime() + minutes * 60000);
}
