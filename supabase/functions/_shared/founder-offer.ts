// Condição de sócio fundador para quem chega por indicação de parceiro.
// Regra pura, usada pelo checkout (Deno) e espelhada no front (src/lib/partnerOffer.ts).
export const FOUNDER_PRICE = 129;
export const FOUNDER_PLAN = 'Agenda';

export interface FounderOfferInput {
  /** Indicação de um parceiro ativo (cupom ou link). */
  hasPartner: boolean;
  /** Nome do plano escolhido. */
  planName: string;
  /** Vagas de sócio fundador que ainda restam. */
  remaining: number;
}

/** O indicado ganha sócio fundador só no plano Agenda e enquanto houver vaga. */
export function founderOfferApplies({ hasPartner, planName, remaining }: FounderOfferInput): boolean {
  return hasPartner && planName === FOUNDER_PLAN && remaining > 0;
}
