// Regras de data dos avisos de fatura (mesma regra do aviso por WhatsApp), no fuso de São Paulo.
import type { PlatformMailKind } from "./messages.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const TZ = "America/Sao_Paulo";

/** AAAA-MM-DD no fuso de São Paulo. */
export function ymdSP(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
export function hourSP(d: Date): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(d));
}
function daysBetween(fromYmd: string, toYmd: string): number {
  return Math.round((Date.parse(`${toYmd}T00:00:00Z`) - Date.parse(`${fromYmd}T00:00:00Z`)) / 86400000);
}

/** Qual aviso de fatura cabe hoje (mesma regra do aviso por WhatsApp). */
export function invoiceNotice(config: Any, todayYmd: string, dueYmd: string): { kind: PlatformMailKind; seq: number; daysBefore: number } | null {
  if (!config?.auto_send_enabled) return null;
  const diff = daysBetween(todayYmd, dueYmd);
  if (diff > 0 && diff === Number(config.notify_days_before)) return { kind: "invoice_before", seq: 0, daysBefore: diff };
  if (diff === 0 && config.notify_on_due_date) return { kind: "invoice_due", seq: 0, daysBefore: 0 };
  if (diff < 0) {
    const late = -diff;
    const interval = Number(config.overdue_notify_interval_days) || 3;
    const max = Number(config.overdue_notify_count) || 3;
    if (late % interval === 0) {
      const seq = Math.floor(late / interval);
      if (seq <= max) return { kind: "invoice_overdue", seq, daysBefore: 0 };
    }
  }
  return null;
}

