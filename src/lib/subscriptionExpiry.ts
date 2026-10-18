/**
 * Regras de expiração de assinatura (fuso America/Sao_Paulo).
 *
 * A assinatura só é considerada vencida DEPOIS das 23:59:59 do DIA gravado
 * em stores.subscription_expires_at. Ou seja, comparamos apenas o DIA em
 * Brasília: expirado somente se hoje (Brasília) > dia de vencimento (Brasília).
 */

const TIME_ZONE = 'America/Sao_Paulo';

const dayKeyInSaoPaulo = (date: Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // "YYYY-MM-DD"

/**
 * Retorna true se a assinatura já venceu (hoje em Brasília é posterior
 * ao dia de vencimento). Sem data => não expirada por esta regra.
 */
export function isSubscriptionExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const expiration = new Date(expiresAt);
  if (Number.isNaN(expiration.getTime())) return false;
  return dayKeyInSaoPaulo(new Date()) > dayKeyInSaoPaulo(expiration);
}

/**
 * Dias restantes até o vencimento, contando em dias de Brasília.
 * 0 = vence hoje (ainda ativo); negativo = já vencida.
 */
export function daysUntilExpiry(expiresAt: string | null | undefined): number {
  if (!expiresAt) return 0;
  const expiration = new Date(expiresAt);
  if (Number.isNaN(expiration.getTime())) return 0;
  const todayKey = dayKeyInSaoPaulo(new Date());
  const dueKey = dayKeyInSaoPaulo(expiration);
  const today = new Date(`${todayKey}T00:00:00Z`).getTime();
  const due = new Date(`${dueKey}T00:00:00Z`).getTime();
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}
