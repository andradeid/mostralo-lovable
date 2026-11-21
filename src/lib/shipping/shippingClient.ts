/**
 * Frete por CEP (Melhor Envio) no navegador: configuração pública da loja, cotação pela função
 * shipping-quote (o token fica no servidor) e endereço pelo CEP (ViaCEP).
 * Regras puras compartilhadas com o servidor: supabase/functions/_shared/shipping.ts.
 */
import { supabase } from '@/integrations/supabase/client';
import { resilientEdgeFetch } from '@/lib/resilientFetch';
import type { ShippingOption, ShippingSettings } from '../../../supabase/functions/_shared/shipping.ts';

export {
  SHIPPING_SERVICES, addressLine, formatCep, normalizeCep, optionLabel, parseShippingAddress,
} from '../../../supabase/functions/_shared/shipping.ts';
export type { ShippingAddress, ShippingOption, ShippingSettings } from '../../../supabase/functions/_shared/shipping.ts';

export const SHIPPING_QUOTE_FUNCTION = 'shipping-quote';

export type StoreShippingSettings = ShippingSettings & { store_id: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Configuração pública (sem token). null = loja sem envio configurado. */
export async function fetchShippingSettings(storeId: string): Promise<StoreShippingSettings | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tabela nova (tipos gerados ainda não têm)
  const { data, error } = await (supabase as any)
    .from('store_shipping_settings')
    .select('*')
    .eq('store_id', storeId)
    .maybeSingle();
  if (error) {
    console.error('[frete] Erro ao ler configuração de envio:', error);
    return null;
  }
  return (data as StoreShippingSettings) ?? null;
}

/** Item do carrinho → produto e variação (id "produto_variação_adicionais~f:sabores"). */
export function cartLineForQuote(item: { id: string; quantity: number }) {
  const base = String(item.id ?? '').split('~f:')[0];
  const [productId, maybeVariant] = base.split('_');
  return {
    product_id: productId,
    variant_id: maybeVariant && UUID_RE.test(maybeVariant) ? maybeVariant : null,
    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
  };
}

export type QuoteResult =
  | { ok: true; options: ShippingOption[] }
  | { ok: false; message: string; code: string | null };

export async function quoteShipping(params: {
  storeId: string;
  postalCode: string;
  items?: { product_id: string; variant_id?: string | null; quantity: number }[];
  test?: boolean;
}): Promise<QuoteResult> {
  const body: Record<string, unknown> = { store_id: params.storeId, postal_code: params.postalCode };
  if (params.test) {
    // Teste do painel: precisa do login do lojista (invoke manda o token da sessão)
    const { data, error } = await supabase.functions.invoke(SHIPPING_QUOTE_FUNCTION, { body: { ...body, test: true } });
    if (data?.options) return { ok: true, options: data.options as ShippingOption[] };
    let detail: { error?: string; code?: string } | null = null;
    try {
      detail = await (error as { context?: Response } | null)?.context?.json?.();
    } catch { /* sem corpo */ }
    return { ok: false, message: detail?.error || 'Não foi possível calcular o frete.', code: detail?.code ?? null };
  }
  body.items = (params.items ?? []).filter((i) => UUID_RE.test(i.product_id));
  const { data, error, code } = await resilientEdgeFetch<{ options: ShippingOption[] }>(SHIPPING_QUOTE_FUNCTION, body, {
    timeoutMs: 20000,
    maxRetries: 1,
  });
  if (data?.options && !error) return { ok: true, options: data.options };
  return { ok: false, message: error || 'Não foi possível calcular o frete.', code: code ?? null };
}

export interface CepAddress { street: string; district: string; city: string; state: string }

/** Endereço pelo CEP (ViaCEP). null = CEP não encontrado ou serviço fora. */
export async function lookupCep(cep: string): Promise<CepAddress | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const j = await res.json();
    if (!j || j.erro) return null;
    return { street: j.logradouro ?? '', district: j.bairro ?? '', city: j.localidade ?? '', state: j.uf ?? '' };
  } catch {
    return null;
  }
}

/** "até 9 dias úteis" */
export function deliveryDaysText(days: number | null): string {
  if (!days) return 'prazo informado na confirmação';
  return `até ${days} dia${days > 1 ? 's' : ''} út${days > 1 ? 'eis' : 'il'}`;
}

/** Página pública de rastreio (Melhor Rastreio aceita Correios e transportadoras). */
export function trackingUrl(code: string): string {
  return `https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(code)}`;
}
