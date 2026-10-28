// Pagamento das comissões do parceiro: o que entrou no mês é pago no dia 15 do mês seguinte.
// A regra que vale é a do banco (public._partner_payout_date); aqui só exibimos.

export const PAYOUT_DAY = 15;

export type PayoutStatus = 'open' | 'pending' | 'requested' | 'approved' | 'paid' | 'rejected';

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  open: 'Mês em andamento',
  pending: 'A pagar',
  requested: 'Solicitado',
  approved: 'Aprovado',
  paid: 'Pago',
  rejected: 'Rejeitado',
};

export const COMMISSION_STATUS_LABEL: Record<string, string> = {
  pending: 'A receber',
  paid: 'Pago',
  cancelled: 'Cancelada (estorno)',
};

/** Data de pagamento do ciclo (mês/ano em que o dinheiro entrou): dia 15 do mês seguinte, 'AAAA-MM-DD'. */
export function payoutDateForCycle(month: number, year: number): string {
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(PAYOUT_DAY).padStart(2, '0')}`;
}

/** '2026-11-15' (ou timestamp) → '15/11/2026', sem deslocar o dia pelo fuso do navegador. */
export function formatIsoDate(value: string | null | undefined): string {
  if (!value) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m && value.length <= 10) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(d);
}

interface PayoutLike {
  status: string;
  cycle_month: number;
  cycle_year: number;
  scheduled_payment_date?: string | null;
  paid_at?: string | null;
}

/** Frase curta sobre quando o ciclo é (ou foi) pago. */
export function payoutScheduleText(p: PayoutLike): string {
  if (p.status === 'paid') return p.paid_at ? `Pago em ${formatIsoDate(p.paid_at)}` : 'Pago';
  if (p.status === 'rejected') return 'Pagamento recusado';
  const date = formatIsoDate(p.scheduled_payment_date ?? payoutDateForCycle(p.cycle_month, p.cycle_year));
  return `Pagamento em ${date}`;
}

/** Ciclo pronto para o parceiro solicitar (mês fechado e ainda não solicitado). */
export function canRequestPayout(p: { status: string; grand_total: number | string }): boolean {
  return p.status === 'pending' && Number(p.grand_total) > 0;
}
