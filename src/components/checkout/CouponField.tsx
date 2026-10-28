import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FOUNDER_PLAN, FOUNDER_PRICE, normalizeCoupon } from '@/lib/partnerOffer';
import { formatPlanMoney } from '@/lib/mostraloPricing';
import type { PartnerCouponState } from '@/hooks/usePartnerCoupon';

interface CouponFieldProps {
  coupon: PartnerCouponState;
  planName: string | null;
  /** Preço cheio do plano (para mostrar o que o sócio fundador economiza). */
  planPrice?: number | null;
  /** Começa aberto (página do parceiro) ou atrás do link "Tenho cupom" (cadastro normal). */
  defaultOpen?: boolean;
  idPrefix?: string;
}

/** Cupom de indicação: valida o parceiro e mostra a condição que a pessoa ganhou. */
export function CouponField({ coupon, planName, planPrice, defaultOpen = false, idPrefix = 'ck' }: CouponFieldProps) {
  const [open, setOpen] = useState(defaultOpen || !!coupon.applied);
  const [text, setText] = useState(normalizeCoupon(coupon.applied ?? ''));
  const inputId = `${idPrefix}-coupon`;
  const isApplied = !!coupon.applied && normalizeCoupon(text) === normalizeCoupon(coupon.applied);
  const ok = isApplied && coupon.partnerFound;
  const invalid = isApplied && !coupon.checking && !coupon.partnerFound;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="min-h-11 text-sm font-semibold text-primary underline-offset-4 hover:underline">
        Tenho cupom
      </button>
    );
  }

  const apply = () => { if (normalizeCoupon(text)) coupon.apply(text); };

  return (
    <div className={cn('space-y-3 rounded-xl border p-4', ok ? 'border-primary/30 bg-primary/5' : 'bg-background')}>
      <Label htmlFor={inputId} className="font-semibold">Cupom de indicação</Label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          value={text}
          onChange={e => setText(normalizeCoupon(e.target.value))}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
          placeholder="Digite o cupom"
          autoCapitalize="characters"
          className={cn('h-11 font-semibold tracking-wider', invalid && 'border-destructive')}
          aria-invalid={invalid || undefined}
          aria-describedby={`${inputId}-msg`}
        />
        {ok ? (
          <span className="flex h-11 shrink-0 items-center gap-1 rounded-md bg-green-50 px-3 text-sm font-semibold text-green-800 dark:bg-green-950 dark:text-green-300">
            <Check className="h-4 w-4" aria-hidden="true" /> Aplicado
          </span>
        ) : (
          <Button type="button" variant="outline" className="h-11 shrink-0" onClick={apply} disabled={!normalizeCoupon(text) || coupon.checking}>
            {coupon.checking ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Conferindo" /> : 'Aplicar'}
          </Button>
        )}
      </div>
      <div id={`${inputId}-msg`} aria-live="polite" className="text-sm">
        {ok && <CouponMessage coupon={coupon} planName={planName} planPrice={planPrice} />}
        {invalid && <p className="text-destructive">Não encontramos esse cupom. Confira com quem te indicou: você pode continuar sem ele.</p>}
      </div>
    </div>
  );
}

function CouponMessage({ coupon, planName, planPrice }: { coupon: PartnerCouponState; planName: string | null; planPrice?: number | null }) {
  const who = coupon.info?.name;
  if (coupon.founder) {
    return (
      <div className="space-y-0.5">
        <p className="font-semibold">Você ganhou a vaga de sócio fundador</p>
        <p className="text-muted-foreground">
          {formatPlanMoney(FOUNDER_PRICE)} por mês para sempre no plano {FOUNDER_PLAN}
          {planPrice ? `, no lugar de ${formatPlanMoney(planPrice)}` : ''}. Indicação de {who}.
        </p>
      </div>
    );
  }
  const reason = (coupon.info?.founder?.remaining ?? 0) <= 0
    ? 'As vagas de sócio fundador acabaram: você assina pelo preço normal.'
    : planName !== FOUNDER_PLAN ? `A condição de sócio fundador vale no plano ${FOUNDER_PLAN}.` : '';
  return (
    <div className="space-y-0.5">
      <p className="font-semibold">Indicação de {who} registrada</p>
      {reason && <p className="text-muted-foreground">{reason}</p>}
    </div>
  );
}
