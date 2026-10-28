import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckoutLayout } from '@/components/checkout/CheckoutLayout';
import { CheckoutFields } from '@/components/checkout/CheckoutFields';
import { CouponField } from '@/components/checkout/CouponField';
import { MostraloPlanCard } from '@/components/pricing/MostraloPlanCard';
import { useMostraloPlans } from '@/hooks/useMostraloPlans';
import { useCheckoutForm } from '@/hooks/useCheckoutForm';
import { usePartnerCoupon } from '@/hooks/usePartnerCoupon';
import { calculateAnnualPricing, formatPlanMoney, resolveStoreBilling, type StoreBillingCycle } from '@/lib/mostraloPricing';
import { FOUNDER_PRICE, savedReferral } from '@/lib/partnerOffer';
import { PLAN_PRESENTATION } from '@/lib/planPresentation';
import { GUARANTEE_DAYS, savedCheckoutToken } from '@/lib/checkout';

export default function Assinar() {
  const [params, setParams] = useSearchParams();
  const { plans, isPending } = useMostraloPlans('Essencial');
  const sellable = plans.filter(p => p.name !== 'Sob medida' && Number(p.price) > 0);

  const planId = params.get('plan');
  const plan = sellable.find(p => p.id === planId) ?? null;
  const [cycle, setCycle] = useState<StoreBillingCycle>(params.get('billing_cycle') === 'monthly' ? 'monthly' : 'annual');
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  useEffect(() => { setPendingToken(savedCheckoutToken()); }, []);
  useEffect(() => { document.title = 'Assinar o Mostralo'; }, []);

  // Cupom de indicação (link ?ref=, página do parceiro ou digitado)
  const [initialReferral] = useState(() => params.get('ref') || savedReferral());
  const coupon = usePartnerCoupon(initialReferral, plan?.name ?? null);
  const effectiveCycle: StoreBillingCycle = coupon.founder ? 'monthly' : plan?.annual_enabled ? cycle : 'monthly';
  const checkout = useCheckoutForm({ plan, cycle: effectiveCycle, referral: coupon.referral });

  const price = useMemo(() => {
    if (!plan) return null;
    if (coupon.founder) return { total: FOUNDER_PRICE, monthly: FOUNDER_PRICE, annual: false, savings: 0 };
    const billing = resolveStoreBilling(plan, effectiveCycle, null);
    const values = calculateAnnualPricing(plan.price, Number(plan.annual_discount_percent ?? 0));
    return { total: billing.amount, monthly: billing.annual ? values.monthly : Number(plan.price), annual: billing.annual, savings: values.savings };
  }, [plan, effectiveCycle, coupon.founder]);

  const choosePlan = (id: string, c: StoreBillingCycle) => {
    const next = new URLSearchParams(params);
    next.set('plan', id);
    next.set('billing_cycle', c);
    setParams(next);
    setCycle(c);
    window.scrollTo({ top: 0 });
  };

  const changeCycle = (c: string) => {
    if (c !== 'annual' && c !== 'monthly') return;
    setCycle(c);
    const next = new URLSearchParams(params);
    next.set('billing_cycle', c);
    setParams(next, { replace: true });
  };

  if (isPending) {
    return <CheckoutLayout step={0}><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Carregando" /></div></CheckoutLayout>;
  }

  // Sem plano escolhido: mostra os planos
  if (!plan) {
    return (
      <CheckoutLayout step={0}>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold md:text-3xl">Escolha seu plano</h1>
          <p className="mt-1 text-muted-foreground">Você paga, recebe o acesso na hora e tem {GUARANTEE_DAYS} dias de garantia.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {sellable.map(p => <MostraloPlanCard key={p.id} plan={p} actionLabel="Assinar este plano" onSelect={c => choosePlan(p.id, c)} />)}
        </div>
      </CheckoutLayout>
    );
  }

  return (
    <CheckoutLayout step={0}>
      {pendingToken && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Você tem um pagamento em aberto.{' '}
          <Link className="font-semibold underline" to={`/assinar/${pendingToken}`}>Continuar de onde parou</Link>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Seus dados</CardTitle>
            <p className="text-sm text-muted-foreground">Leva 1 minuto. O resto da loja você configura depois, com calma.</p>
          </CardHeader>
          <CardContent>
            <CheckoutFields
              state={checkout}
              idPrefix="assinar"
              beforeTerms={<CouponField coupon={coupon} planName={plan.name} planPrice={Number(plan.price)} idPrefix="assinar" />}
            />
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="border-primary/40">
            <CardHeader className="pb-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Seu plano</p>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{PLAN_PRESENTATION[plan.name]?.audience}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.annual_enabled && !coupon.founder && (
                <Tabs value={effectiveCycle} onValueChange={changeCycle}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="annual">Anual -{Number(plan.annual_discount_percent ?? 0)}%</TabsTrigger>
                    <TabsTrigger value="monthly">Mensal</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              {price && (
                <div>
                  <p className="text-3xl font-bold text-primary">{formatPlanMoney(price.monthly)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                  {coupon.founder
                    ? <p className="text-sm text-muted-foreground">Sócio fundador: <b>{formatPlanMoney(FOUNDER_PRICE)}</b> por mês, para sempre.</p>
                    : price.annual
                    ? <p className="text-sm text-muted-foreground">Pagamento único de <b>{formatPlanMoney(price.total)}</b> por 12 meses · economia de {formatPlanMoney(price.savings)}</p>
                    : <p className="text-sm text-muted-foreground">Cobrado todo mês. Hoje: <b>{formatPlanMoney(price.total)}</b></p>}
                </div>
              )}
              <ul className="space-y-1 text-sm">
                {(PLAN_PRESENTATION[plan.name]?.highlights ?? []).slice(0, 4).map(h => <li key={h}>✓ {h}</li>)}
              </ul>
              <Link to="/assinar" className="text-xs text-primary underline" onClick={e => { e.preventDefault(); const n = new URLSearchParams(params); n.delete('plan'); setParams(n); }}>Trocar de plano</Link>
            </CardContent>
          </Card>
          <div className="space-y-2 rounded-lg border bg-background p-4 text-sm">
            <p className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-green-600" /> <span><b>{GUARANTEE_DAYS} dias de garantia.</b> Não gostou, devolvemos tudo.</span></p>
            <p className="flex gap-2"><Zap className="h-4 w-4 shrink-0 text-primary" /> <span>Sem comissão por pedido.</span></p>
          </div>
        </aside>
      </div>
    </CheckoutLayout>
  );
}
