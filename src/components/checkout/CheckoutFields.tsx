import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { CheckoutFormState } from '@/hooks/useCheckoutForm';

interface CheckoutFieldsProps {
  state: CheckoutFormState;
  /** Prefixo dos ids (duas telas não se confundem). */
  idPrefix?: string;
  companyPlaceholder?: string;
  /** Conteúdo entre os dados e o aceite dos termos (cupom, resumo do plano). */
  beforeTerms?: ReactNode;
}

/** Campos do cadastro com pagamento antes: dados, aceite, erro e botão do Pix. */
export function CheckoutFields({ state, idPrefix = 'ck', companyPlaceholder = 'Ex.: Pizzaria da Maria', beforeTerms }: CheckoutFieldsProps) {
  const { form, setField, acceptTerms, setAcceptTerms, website, setWebsite, errors, submitError, loading, submit } = state;
  const id = (k: string) => `${idPrefix}-${k}`;
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <input type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <FieldBox id={id('full_name')} label="Seu nome completo" error={errors.full_name}>
        <Input id={id('full_name')} autoComplete="name" value={form.full_name} onChange={setField('full_name')} placeholder="Maria da Silva" />
      </FieldBox>
      <FieldBox id={id('company_name')} label="Nome do seu negócio" error={errors.company_name}>
        <Input id={id('company_name')} autoComplete="organization" value={form.company_name} onChange={setField('company_name')} placeholder={companyPlaceholder} />
      </FieldBox>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldBox id={id('phone')} label="WhatsApp" error={errors.phone}>
          <Input id={id('phone')} inputMode="tel" autoComplete="tel" value={form.phone} onChange={setField('phone')} placeholder="(61) 99999-9999" />
        </FieldBox>
        <FieldBox id={id('document')} label="CPF ou CNPJ" error={errors.document}>
          <Input id={id('document')} inputMode="numeric" value={form.document} onChange={setField('document')} placeholder="000.000.000-00" />
        </FieldBox>
      </div>
      <FieldBox id={id('email')} label="E-mail" hint="Será o seu login no Mostralo." error={errors.email}>
        <Input id={id('email')} type="email" autoComplete="email" value={form.email} onChange={setField('email')} placeholder="voce@email.com" />
      </FieldBox>
      {beforeTerms}
      <div className="space-y-1">
        <div className="flex items-start gap-2">
          <Checkbox id={id('accept_terms')} checked={acceptTerms} onCheckedChange={v => setAcceptTerms(v === true)} className="mt-0.5" />
          <Label htmlFor={id('accept_terms')} className="text-sm font-normal leading-snug">
            Li e aceito os <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-primary underline">Termos de Uso</a> e a{' '}
            <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary underline">Política de Privacidade</a>.
          </Label>
        </div>
        {errors.accept_terms && <p className="text-xs text-destructive">{errors.accept_terms}</p>}
      </div>
      {submitError && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {submitError}{submitError.includes('já tem conta') && <> <Link to="/auth" className="font-semibold underline">Entrar</Link></>}
        </p>
      )}
      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={loading}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando seu Pix...</> : <><Lock className="mr-2 h-4 w-4" /> Ir para o pagamento</>}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Pagamento por Pix. A loja é liberada assim que o pagamento cai.</p>
    </form>
  );
}

function FieldBox({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
