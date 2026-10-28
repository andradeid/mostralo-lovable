// Programa de parceria: cupom do parceiro e condição de sócio fundador para o indicado.
// A regra de preço é a mesma do checkout (supabase/functions/_shared/founder-offer.ts).
export { FOUNDER_PRICE, FOUNDER_PLAN, founderOfferApplies } from '../../supabase/functions/_shared/founder-offer';

export const REFERRAL_STORAGE_KEY = 'mostralo_referral_code';

/** Cupom digitado: só letras e números, maiúsculo, até 15. */
export function normalizeCoupon(value: string): string {
  return value.toUpperCase().normalize('NFD').replace(/[^A-Z0-9]/g, '').slice(0, 15);
}

/** Guarda o código de quem indicou para o cadastro (mesma chave do link ?ref=). */
export function rememberReferral(code: string) {
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, code);
    localStorage.setItem('mostralo_referral_timestamp', Date.now().toString());
  } catch { /* navegador sem armazenamento */ }
}

export function savedReferral(): string | null {
  try { return localStorage.getItem(REFERRAL_STORAGE_KEY); } catch { return null; }
}

/** Link da página do parceiro. */
export function partnerPageUrl(origin: string, code: string) {
  return `${origin}/parceiro/${encodeURIComponent(code.toLowerCase())}`;
}
