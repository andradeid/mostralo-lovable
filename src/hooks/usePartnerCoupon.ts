import { useState } from 'react';
import { founderOfferApplies, normalizeCoupon } from '@/lib/partnerOffer';
import { usePartnerInfo } from '@/hooks/usePartnerInfo';

/** Cupom aplicado no cadastro: quem indicou e se a condição de sócio fundador vale para o plano. */
export function usePartnerCoupon(initial: string | null, planName: string | null) {
  const [applied, setApplied] = useState<string | null>(initial ? initial.trim() : null);
  const query = usePartnerInfo(applied);
  const info = applied ? query.data : undefined;
  const partnerFound = !!info?.found;
  const founder = partnerFound && !!planName && founderOfferApplies({
    hasPartner: true, planName, remaining: info?.founder?.remaining ?? 0,
  });
  return {
    applied,
    apply: (code: string) => setApplied(normalizeCoupon(code) || null),
    clear: () => setApplied(null),
    info,
    checking: !!applied && query.isLoading,
    partnerFound,
    founder,
    /** Código enviado ao checkout: só o que existe de verdade. */
    referral: partnerFound ? (info?.code ?? applied) : null,
  };
}

export type PartnerCouponState = ReturnType<typeof usePartnerCoupon>;
