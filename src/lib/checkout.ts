import { supabase } from '@/integrations/supabase/client';

export const CHECKOUT_TOKEN_KEY = 'mostralo_checkout_token';
export const GUARANTEE_DAYS = 7;
export const GUARANTEE_TEXT = `Garantia de ${GUARANTEE_DAYS} dias: se não gostar, devolvemos 100% do valor pago.`;

export interface CheckoutStartInput {
  plan_id: string;
  billing_cycle: 'monthly' | 'annual';
  full_name: string;
  email: string;
  phone: string;
  document: string;
  company_name: string;
  accept_terms: boolean;
  accept_marketing?: boolean;
  referral_code?: string | null;
  website?: string;
}

export interface CheckoutStatus {
  status: 'pending' | 'paid' | 'cancelled';
  plan_name: string;
  billing_cycle: 'monthly' | 'annual';
  amount: number;
  company_name: string;
  email: string | null;
  needs_password?: boolean;
  store_slug?: string;
  pix_copia_cola?: string | null;
  pix_qrcode_base64?: string | null;
  pix_expires_at?: string | null;
}

export class CheckoutError extends Error {
  constructor(message: string, public field?: string, public code?: string) {
    super(message);
  }
}

async function call<T>(fn: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    // Respostas 4xx trazem a mensagem no corpo
    let payload: { error?: string; field?: string; code?: string } | null = null;
    try {
      payload = await (error as { context?: Response }).context?.json();
    } catch {
      payload = null;
    }
    throw new CheckoutError(payload?.error ?? 'Não foi possível concluir. Verifique sua internet e tente novamente.', payload?.field, payload?.code);
  }
  return data as T;
}

export const startCheckout = (input: CheckoutStartInput) => call<{ token: string; resumed?: boolean }>('checkout-start', input);
export const getCheckoutStatus = (token: string, check = false) => call<CheckoutStatus>('checkout-status', { token, check });
export const setCheckoutPassword = (token: string, password: string) =>
  call<{ ok: true; email: string }>('checkout-status', { token, action: 'set_password', password });

export const onlyDigits = (v: string) => v.replace(/\D/g, '');

export function maskPhone(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskDocument(v: string) {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}

export function validCpf(cpf: string) {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const calc = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(cpf[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export function validCnpj(cnpj: string) {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = (n: number) => {
    const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = w.reduce((acc, x, i) => acc + Number(cnpj[i]) * x, 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}

export function rememberCheckoutToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CHECKOUT_TOKEN_KEY, token);
    else localStorage.removeItem(CHECKOUT_TOKEN_KEY);
  } catch {
    /* navegação privada */
  }
}

export function savedCheckoutToken(): string | null {
  try {
    return localStorage.getItem(CHECKOUT_TOKEN_KEY);
  } catch {
    return null;
  }
}
