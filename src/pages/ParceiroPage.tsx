import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, ShieldCheck, Zap } from 'lucide-react';
import { CheckoutFields } from '@/components/checkout/CheckoutFields';
import { CouponField } from '@/components/checkout/CouponField';
import { PartnerBenefits, PartnerHero } from '@/components/partner/PartnerHero';
import { useMostraloPlans } from '@/hooks/useMostraloPlans';
import { useCheckoutForm } from '@/hooks/useCheckoutForm';
import { usePartnerCoupon } from '@/hooks/usePartnerCoupon';
import { trackPartnerPageView } from '@/hooks/usePartnerInfo';
import { formatPlanMoney } from '@/lib/mostraloPricing';
import { FOUNDER_PLAN, FOUNDER_PRICE, rememberReferral } from '@/lib/partnerOffer';
import { GUARANTEE_DAYS } from '@/lib/checkout';

/** Página do parceiro (/parceiro/:codigo): fotos do sistema, quem indicou, cupom aplicado e cadastro com Pix. */
export default function ParceiroPage() {
  const { codigo = '' } = useParams();
  const { plans, isPending } = useMostraloPlans('Agenda');
  const plan = plans.find(p => p.name === FOUNDER_PLAN) ?? null;
  const coupon = usePartnerCoupon(codigo, plan?.name ?? FOUNDER_PLAN);
  const checkout = useCheckoutForm({ plan, cycle: 'monthly', referral: coupon.referral });

  const partnerName = coupon.partnerFound ? coupon.info?.name ?? null : null;
  const price = coupon.founder ? FOUNDER_PRICE : plan ? Number(plan.price) : null;

  useEffect(() => {
    if (!codigo) return;
    trackPartnerPageView(codigo).catch(() => {});
  }, [codigo]);

  useEffect(() => {
    if (coupon.partnerFound && coupon.info?.code) rememberReferral(coupon.info.code);
  }, [coupon.partnerFound, coupon.info?.code]);

  useEffect(() => {
    document.title = partnerName ? `Indicação de ${partnerName} | Mostralo` : 'Cadastre seu negócio | Mostralo';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, [partnerName]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-stone-900">
      <header className="flex h-14 items-center justify-between border-b border-stone-200 px-4 md:h-16 md:px-8">
        <Link to="/" className="flex items-center gap-2" aria-label="Mostralo, página inicial">
          <img src="/mostralo-icon.png" alt="" className="h-7 w-7 object-contain md:h-8 md:w-8" />
          <span className="font-display text-lg font-extrabold tracking-tight md:text-xl">mostralo</span>
        </Link>
        <p className="text-sm text-stone-600">
          <span className="hidden sm:inline">Já usa o Mostralo? </span>
          <Link to="/auth" className="inline-flex min-h-11 items-center font-semibold text-[#B8541A] hover:underline">Entrar</Link>
        </p>
      </header>

      <main className="grid flex-1 grid-cols-1 [grid-template-areas:'hero'_'form'_'proof'] md:grid-cols-2 md:grid-rows-[auto_1fr] md:[grid-template-areas:'hero_form'_'proof_form']">
        <PartnerHero
          className="[grid-area:hero]"
          partnerName={partnerName}
          partnerPhoto={coupon.info?.photo_url}
          offerText={coupon.founder ? `a vaga de sócio fundador: ${formatPlanMoney(FOUNDER_PRICE)} por mês para sempre` : null}
        />

        <section className="flex justify-center px-4 py-8 [grid-area:form] md:px-8 md:py-12">
          <div className="w-full max-w-[460px] space-y-5">
            <div className="space-y-1 text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Cadastre seu negócio</h2>
              <p className="text-stone-600">Leva 1 minuto. O resto você configura depois, com calma.</p>
            </div>

            {isPending || !plan ? (
              <div className="flex justify-center py-16">
                {isPending ? <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Carregando" /> : <p className="text-sm text-stone-600">Plano indisponível no momento.</p>}
              </div>
            ) : (
              <CheckoutFields
                state={checkout}
                idPrefix="parceiro"
                companyPlaceholder="Ex.: Studio Bella"
                beforeTerms={
                  <>
                    <CouponField coupon={coupon} planName={plan.name} planPrice={Number(plan.price)} defaultOpen idPrefix="parceiro" />
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-stone-600">Plano</span>
                        <span className="font-bold">{plan.name}</span>
                        <Link to={`/assinar${coupon.referral ? `?ref=${encodeURIComponent(coupon.referral)}` : ''}`} className="text-sm text-[#B8541A] underline-offset-4 hover:underline">Trocar de plano</Link>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-stone-600">Hoje no Pix</span>
                        <span className="font-display text-2xl font-extrabold text-[#B8541A]">{price != null ? formatPlanMoney(price) : '—'}</span>
                        <span className="text-xs text-stone-600">{coupon.founder ? 'por mês, para sempre' : 'cobrado todo mês'}</span>
                      </div>
                    </div>
                  </>
                }
              />
            )}

            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-stone-600">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-green-700" aria-hidden="true" />{GUARANTEE_DAYS} dias de garantia</span>
              <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-[#B8541A]" aria-hidden="true" />Acesso liberado na hora</span>
              <span>Sem comissão por agendamento</span>
            </div>
          </div>
        </section>

        <PartnerBenefits className="[grid-area:proof]" />
      </main>
    </div>
  );
}
