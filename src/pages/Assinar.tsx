import { useEffect, useMemo, useState } from 'react';
import { trackMostraloLead } from '@/lib/mostraloPixel';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Lock, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckoutLayout } from '@/components/checkout/CheckoutLayout';
import { MostraloPlanCard } from '@/components/pricing/MostraloPlanCard';
import { useMostraloPlans } from '@/hooks/useMostraloPlans';
import { calculateAnnualPricing, formatPlanMoney, resolveStoreBilling, type StoreBillingCycle } from '@/lib/mostraloPricing';
import { PLAN_PRESENTATION } from '@/lib/planPresentation';
import {
  CheckoutError, GUARANTEE_DAYS, maskDocument, maskPhone, onlyDigits, rememberCheckoutToken, savedCheckoutToken,
  startCheckout, validCnpj, validCpf,
} from '@/lib/checkout';

type Field = 'full_name' | 'email' | 'phone' | 'document' | 'company_name' | 'accept_terms';

export default function Assinar() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { plans, isPending } = useMostraloPlans('Essencial');
  const sellable = plans.filter(p => p.name !== 'Sob medida' && Number(p.price) > 0);

  const planId = params.get('plan');
  const plan = sellable.find(p => p.id === planId) ?? null;
  const [cycle, setCycle] = useState<StoreBillingCycle>(params.get('billing_cycle') === 'monthly' ? 'monthly' : 'annual');
  const effectiveCycle: StoreBillingCycle = plan?.annual_enabled ? cycle : 'monthly';

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', document: '', company_name: '' });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  useEffect(() => { setPendingToken(savedCheckoutToken()); }, []);
  useEffect(() => { document.title = 'Assinar o Mostralo'; }, []);

  const referral = useMemo(() => {
    const fromUrl = params.get('ref');
    if (fromUrl) return fromUrl;
    try { return localStorage.getItem('mostralo_referral_code'); } catch { return null; }
  }, [params]);

  const price = useMemo(() => {
    if (!plan) return null;
    const billing = resolveStoreBilling(plan, effectiveCycle, null);
    const values = calculateAnnualPricing(plan.price, Number(plan.annual_discount_percent ?? 0));
    return { total: billing.amount, monthly: billing.annual ? values.monthly : Number(plan.price), annual: billing.annual, savings: values.savings };
  }, [plan, effectiveCycle]);

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

  const validate = () => {
    const e: Partial<Record<Field, string>> = {};
    const name = form.full_name.trim();
    if (name.split(/\s+/).length < 2 || name.length < 5) e.full_name = 'Digite nome e sobrenome.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = 'E-mail inválido.';
    const phone = onlyDigits(form.phone);
    if (phone.length < 10) e.phone = 'WhatsApp com DDD.';
    const doc = onlyDigits(form.document);
    if (!(doc.length === 11 ? validCpf(doc) : doc.length === 14 ? validCnpj(doc) : false)) e.document = 'CPF ou CNPJ inválido.';
    if (form.company_name.trim().length < 2) e.company_name = 'Como seu negócio se chama?';
    if (!acceptTerms) e.accept_terms = 'Marque para continuar.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    if (!plan || !validate()) return;
    setLoading(true);
    try {
      const { token } = await startCheckout({
        plan_id: plan.id,
        billing_cycle: effectiveCycle,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: onlyDigits(form.phone),
        document: onlyDigits(form.document),
        company_name: form.company_name.trim(),
        accept_terms: acceptTerms,
        referral_code: referral,
        website,
      });
      rememberCheckoutToken(token);
      trackMostraloLead({ plan: plan.name, cycle: effectiveCycle });
      navigate(`/assinar/${token}`);
    } catch (err) {
      const e = err as CheckoutError;
      if (e.field && e.field in form) setErrors(prev => ({ ...prev, [e.field as Field]: e.message }));
      setSubmitError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof form) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    let v = ev.target.value;
    if (k === 'phone') v = maskPhone(v);
    if (k === 'document') v = maskDocument(v);
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
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
            <form onSubmit={submit} noValidate className="space-y-4">
              <input type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <FieldBox id="full_name" label="Seu nome completo" error={errors.full_name}>
                <Input id="full_name" autoComplete="name" value={form.full_name} onChange={set('full_name')} placeholder="Maria da Silva" />
              </FieldBox>
              <FieldBox id="company_name" label="Nome do seu negócio" error={errors.company_name}>
                <Input id="company_name" autoComplete="organization" value={form.company_name} onChange={set('company_name')} placeholder="Ex.: Pizzaria da Maria" />
              </FieldBox>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldBox id="phone" label="WhatsApp" error={errors.phone}>
                  <Input id="phone" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="(61) 99999-9999" />
                </FieldBox>
                <FieldBox id="document" label="CPF ou CNPJ" error={errors.document}>
                  <Input id="document" inputMode="numeric" value={form.document} onChange={set('document')} placeholder="000.000.000-00" />
                </FieldBox>
              </div>
              <FieldBox id="email" label="E-mail" hint="Será o seu login no Mostralo." error={errors.email}>
                <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="voce@email.com" />
              </FieldBox>
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <Checkbox id="accept_terms" checked={acceptTerms} onCheckedChange={v => { setAcceptTerms(v === true); setErrors(p => ({ ...p, accept_terms: undefined })); }} className="mt-0.5" />
                  <Label htmlFor="accept_terms" className="text-sm font-normal leading-snug">
                    Li e aceito os <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-primary underline">Termos de Uso</a> e a{' '}
                    <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary underline">Política de Privacidade</a>.
                  </Label>
                </div>
                {errors.accept_terms && <p className="text-xs text-destructive">{errors.accept_terms}</p>}
              </div>
              {submitError && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{submitError}{submitError.includes('já tem conta') && <> <Link to="/auth" className="font-semibold underline">Entrar</Link></>}</p>}
              <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando seu Pix...</> : <><Lock className="mr-2 h-4 w-4" /> Ir para o pagamento</>}
              </Button>
              <p className="text-center text-xs text-muted-foreground">Pagamento por Pix. A loja é liberada assim que o pagamento cai.</p>
            </form>
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
              {plan.annual_enabled && (
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
                  {price.annual
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

function FieldBox({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
