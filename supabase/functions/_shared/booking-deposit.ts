/**
 * Sinal das reservas (agendamento) — regra única, sem dependências.
 * O servidor (create-public-booking, booking-deposit, efi-pix-webhook, booking-confirmation)
 * e o navegador (painel e página pública) importam este mesmo arquivo pelo caminho relativo.
 */

/** Como a loja recebe o sinal. */
export type BookingDepositMode = 'store' | 'mostralo';

export const DEPOSIT_TIMEOUT_DEFAULT = 15;
export const DEPOSIT_TIMEOUT_MIN = 5;
export const DEPOSIT_TIMEOUT_MAX = 60;
/** Comissão padrão do Mostralo sobre pagamentos online (stores.online_payment_commission). */
export const DEFAULT_ONLINE_COMMISSION = 7;
/** Motivo gravado quando o prazo do Pix do sinal acaba (mesmo texto da função SQL). */
export const DEPOSIT_EXPIRED_REASON = 'Sinal não pago a tempo';

type Num = number | string | null | undefined;

export interface DepositSettingsInput {
  require_deposit?: boolean | null;
  default_deposit_percentage?: Num;
}

export interface DepositServiceInput {
  price?: Num;
  requires_deposit?: boolean | null;
  deposit_amount?: Num;
  deposit_percentage?: Num;
}

const toNumber = (v: Num): number => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const toCents = (v: number) => Math.round(v * 100 + (v >= 0 ? 1e-7 : -1e-7));

/**
 * Valor do sinal em reais (2 casas). 0 = sem sinal.
 * Ordem: valor fixo do serviço → % do serviço → % padrão da loja, sempre sobre o preço do catálogo.
 * Os valores do serviço só valem quando o serviço tem "sinal próprio" (requires_deposit).
 * Loja com sinal desligado, serviço grátis ou resultado 0 → sem sinal. Nunca passa do preço.
 */
export function calculateBookingDeposit(settings: DepositSettingsInput | null | undefined, service: DepositServiceInput | null | undefined): number {
  if (!settings?.require_deposit || !service) return 0;
  const priceCents = toCents(toNumber(service.price));
  if (priceCents <= 0) return 0;

  const pct = (v: Num) => Math.min(Math.max(toNumber(v), 0), 100);
  let cents = 0;
  const fixed = toNumber(service.deposit_amount);
  const servicePct = pct(service.deposit_percentage);
  if (service.requires_deposit && fixed > 0) {
    cents = toCents(fixed);
  } else if (service.requires_deposit && servicePct > 0) {
    cents = Math.round((priceCents * servicePct) / 100);
  } else {
    cents = Math.round((priceCents * pct(settings.default_deposit_percentage)) / 100);
  }
  cents = Math.min(Math.max(cents, 0), priceCents);
  return cents / 100;
}

export function normalizeDepositMode(v: unknown): BookingDepositMode {
  return v === 'mostralo' ? 'mostralo' : 'store';
}

/** Prazo para pagar o sinal no modo Mostralo, em minutos (5 a 60, padrão 15). */
export function normalizeDepositTimeout(v: unknown): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n <= 0) return DEPOSIT_TIMEOUT_DEFAULT;
  return Math.min(Math.max(n, DEPOSIT_TIMEOUT_MIN), DEPOSIT_TIMEOUT_MAX);
}

/** Taxa do Mostralo (%) sobre o sinal recebido pelo Pix do Mostralo. */
export function depositCommissionPercent(v: unknown): number {
  if (v === null || v === undefined || v === '') return DEFAULT_ONLINE_COMMISSION;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : DEFAULT_ONLINE_COMMISSION;
}

export interface DepositBookingLike {
  status?: string | null;
  deposit_mode?: string | null;
  deposit_amount?: Num;
  deposit_paid?: boolean | null;
}

/** Reserva que entrou no fluxo de sinal (criada pela página pública com o sinal ligado). */
export function hasDepositFlow(b: DepositBookingLike | null | undefined): boolean {
  return !!b && (b.deposit_mode === 'store' || b.deposit_mode === 'mostralo') && toNumber(b.deposit_amount) > 0;
}

/** Reserva segurando o horário enquanto o sinal não chega (não recebe confirmação nem lembrete). */
export function isDepositPending(b: DepositBookingLike | null | undefined): boolean {
  return hasDepositFlow(b) && !b!.deposit_paid && b!.status !== 'cancelled';
}

/** Valor recebido cobre o sinal? (tolerância de 1 centavo, como nos pedidos). */
export function depositPaidEnough(received: Num, expected: Num): boolean {
  return toCents(toNumber(received)) + 1 >= toCents(toNumber(expected));
}

/** Quanto falta cobrar na cobrança Pix do valor do serviço depois do sinal pago. */
export function remainingAfterDeposit(price: Num, b: DepositBookingLike | null | undefined): number {
  const priceCents = toCents(toNumber(price));
  const paid = b?.deposit_paid ? toCents(toNumber(b.deposit_amount)) : 0;
  return Math.max(priceCents - paid, 0) / 100;
}

export function formatDepositBRL(v: Num): string {
  return toNumber(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const PIX_KEY_TYPE_LABEL: Record<string, string> = {
  cpf: 'CPF', cnpj: 'CNPJ', email: 'E-mail', phone: 'Telefone', random: 'Chave aleatória',
};

export function pixKeyTypeLabel(t: unknown): string {
  return PIX_KEY_TYPE_LABEL[String(t ?? '')] ?? 'Chave Pix';
}

export interface StoreDepositMessageInput {
  customerName?: string | null;
  serviceName?: string | null;
  professionalName?: string | null;
  /** AAAA-MM-DD */
  date?: string | null;
  /** HH:MM[:SS] */
  time?: string | null;
  amount: Num;
  pixKey: string;
  pixKeyType?: string | null;
  recipientName?: string | null;
  storeName?: string | null;
}

/** Mensagem do WhatsApp do modo "Pix da própria loja": chave Pix + valor do sinal. */
export function buildStoreDepositMessage(d: StoreDepositMessageInput): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d.date ?? '');
  const date = m ? `${m[3]}/${m[2]}/${m[1]}` : (d.date ?? '');
  const time = (d.time ?? '').substring(0, 5);
  const lines: (string | null)[] = [
    `*Falta só o sinal para confirmar seu horário*`,
    '',
    `Olá${d.customerName ? ` *${d.customerName}*` : ''}! Seu horário está reservado:`,
    d.serviceName ? `Serviço: ${d.serviceName}` : null,
    d.professionalName ? `Profissional: ${d.professionalName}` : null,
    date || time ? `Data: ${date}${time ? ` às ${time}` : ''}` : null,
    '',
    `Sinal: *${formatDepositBRL(d.amount)}*`,
    `Pix (${pixKeyTypeLabel(d.pixKeyType)}): *${d.pixKey}*`,
    d.recipientName ? `Favorecido: ${d.recipientName}` : null,
    '',
    `Depois de pagar, envie o comprovante por aqui. Assim que ${d.storeName || 'a loja'} conferir, seu horário fica confirmado.`,
  ];
  return lines.filter((l): l is string => l !== null).join('\n');
}
