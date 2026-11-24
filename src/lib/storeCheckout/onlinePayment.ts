// Pagamento online do pedido (Mercado Pago, Checkout Pro). O servidor (order-pay-online)
// confere o cliente pelo customer_token e cobra o total gravado no pedido.
import { supabase } from '@/integrations/supabase/client';

export const MP_GATEWAY = 'mercado_pago';

export function isOnlinePaymentOrder(details: unknown): boolean {
  return !!details && typeof details === 'object' && (details as { gateway?: unknown }).gateway === MP_GATEWAY;
}

export type OnlinePaymentResult =
  | { kind: 'redirect'; url: string }
  | { kind: 'paid' }
  | { kind: 'pending'; status: string | null }
  | { kind: 'failed'; message: string };

interface Params {
  storeId: string;
  orderId: string;
  customerToken: string;
  /** Página para onde o Mercado Pago devolve o cliente (Meus pedidos da loja) */
  returnUrl?: string;
}

async function call(action: 'pay' | 'check', p: Params): Promise<OnlinePaymentResult> {
  const { data, error } = await supabase.functions.invoke('order-pay-online', {
    body: { action, store_id: p.storeId, order_id: p.orderId, customer_token: p.customerToken, return_url: p.returnUrl },
  });
  if (data?.paid === true) return { kind: 'paid' };
  if (data?.checkout_url) return { kind: 'redirect', url: String(data.checkout_url) };
  if (!error && data && action === 'check') return { kind: 'pending', status: data.status ?? null };
  let message = data?.error as string | undefined;
  if (!message && error) {
    try {
      const body = await (error as { context?: Response }).context?.json();
      message = body?.error;
    } catch { /* corpo indisponível */ }
  }
  return { kind: 'failed', message: message || 'Não foi possível abrir o pagamento agora.' };
}

/** Link de pagamento do pedido (ou "paid" se já foi pago). */
export const startOrderPayment = (p: Params) => call('pay', p);

/** Confere no Mercado Pago se o pedido já foi pago. */
export const checkOrderPayment = (p: Params) => call('check', p);
