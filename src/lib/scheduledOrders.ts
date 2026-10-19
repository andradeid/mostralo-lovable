import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ScheduledOrder = Database['public']['Tables']['orders']['Row'] & {
  status_label: string; delivery_label: string; payment_label: string;
  local_date: string; local_time: string; day_label: string;
  is_overdue: boolean; minutes_until: number; items_summary: string;
};
export interface ScheduleDay { day: string; is_open: boolean; slots_available: number; orders_count: number }
export interface ScheduleSlot { slot_at: string; slot_time: string; available: boolean; remaining: number }
export interface ScheduleSummary { today: number; tomorrow: number; next_7_days: number; this_week: number; upcoming: number; awaiting_acceptance: number; overdue: number; today_revenue: number }
export interface DayMetrics { orders: number; revenue: number; avg_ticket: number; scheduled: number }

// Existing RPCs may precede generated client types; keep their boundary explicitly typed.
export async function scheduleRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const client = supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> };
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}
export const formatBRL = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
export function paymentLabel(method: string | null, details?: unknown): string {
  const card = details && typeof details === 'object' && 'card_type' in details ? details.card_type : null;
  return method === 'card' ? card === 'debit' ? 'Cartão de débito' : card === 'credit' ? 'Cartão de crédito' : 'Cartão' : method === 'pix' ? 'Pix' : method === 'cash' ? 'Dinheiro' : method === 'credit_card' ? 'Cartão de crédito' : method === 'debit_card' ? 'Cartão de débito' : 'Não informado';
}
export function scheduledLabel(at: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(at)).replace(/\./g, '');
}