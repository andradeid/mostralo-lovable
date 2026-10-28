import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackMostraloLead } from '@/lib/mostraloPixel';
import type { StoreBillingCycle } from '@/lib/mostraloPricing';
import {
  CheckoutError, maskDocument, maskPhone, onlyDigits, rememberCheckoutToken, startCheckout, validCnpj, validCpf,
} from '@/lib/checkout';

export type CheckoutField = 'full_name' | 'email' | 'phone' | 'document' | 'company_name' | 'accept_terms';
type FormKey = Exclude<CheckoutField, 'accept_terms'>;

export interface UseCheckoutFormOptions {
  plan: { id: string; name: string } | null;
  cycle: StoreBillingCycle;
  /** Cupom do parceiro ou código do link (?ref=). */
  referral: string | null;
}

/** Estado, validação e envio do cadastro com pagamento antes (usado em /assinar e /parceiro/:cupom). */
export function useCheckoutForm({ plan, cycle, referral }: UseCheckoutFormOptions) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<FormKey, string>>({ full_name: '', email: '', phone: '', document: '', company_name: '' });
  const [acceptTerms, setAcceptTermsState] = useState(false);
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<Partial<Record<CheckoutField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Partial<Record<CheckoutField, string>> = {};
    const name = form.full_name.trim();
    if (name.split(/\s+/).length < 2 || name.length < 5) e.full_name = 'Digite nome e sobrenome.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = 'E-mail inválido.';
    if (onlyDigits(form.phone).length < 10) e.phone = 'WhatsApp com DDD.';
    const doc = onlyDigits(form.document);
    if (!(doc.length === 11 ? validCpf(doc) : doc.length === 14 ? validCnpj(doc) : false)) e.document = 'CPF ou CNPJ inválido.';
    if (form.company_name.trim().length < 2) e.company_name = 'Como seu negócio se chama?';
    if (!acceptTerms) e.accept_terms = 'Marque para continuar.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (k: FormKey) => (ev: ChangeEvent<HTMLInputElement>) => {
    let v = ev.target.value;
    if (k === 'phone') v = maskPhone(v);
    if (k === 'document') v = maskDocument(v);
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const setAcceptTerms = (v: boolean) => {
    setAcceptTermsState(v);
    setErrors(p => ({ ...p, accept_terms: undefined }));
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSubmitError(null);
    if (!plan || !validate()) return;
    setLoading(true);
    try {
      const { token } = await startCheckout({
        plan_id: plan.id,
        billing_cycle: cycle,
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
      trackMostraloLead({ plan: plan.name, cycle });
      navigate(`/assinar/${token}`);
    } catch (err) {
      const e = err as CheckoutError;
      if (e.field && e.field in form) setErrors(prev => ({ ...prev, [e.field as CheckoutField]: e.message }));
      setSubmitError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { form, setField, acceptTerms, setAcceptTerms, website, setWebsite, errors, submitError, loading, submit };
}

export type CheckoutFormState = ReturnType<typeof useCheckoutForm>;
