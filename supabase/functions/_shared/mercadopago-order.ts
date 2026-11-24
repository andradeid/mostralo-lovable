// Pagamento online do pedido da loja pelo Mercado Pago (Checkout Pro: Pix e cartão).
// Regras puras, usadas pelas funções order-pay-online e mercadopago-webhook e testadas
// em src/lib/payments/mercadoPagoOrder.test.ts. Sem dependências.

export const MP_GATEWAY = 'mercado_pago';
export const MP_API = 'https://api.mercadopago.com';

export interface OrderForPayment {
  id: string;
  order_number: string | number;
  total: number;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
}

/** Pedido marcado no checkout para pagar online pelo Mercado Pago. */
export function isMercadoPagoOrder(details: unknown): boolean {
  return !!details && typeof details === 'object' && (details as { gateway?: unknown }).gateway === MP_GATEWAY;
}

export function orderExternalReference(orderId: string): string {
  return `order_${orderId}`;
}

function hostOf(domain: string | null | undefined): string | null {
  if (!domain) return null;
  const h = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return h || null;
}

/**
 * Endereço de volta depois do pagamento. Só aceita o próprio Mostralo (e prévias) ou o
 * domínio da loja; qualquer outro vira a página "Meus pedidos" no mostralo.com.br.
 */
export function safeReturnUrl(requested: unknown, slug: string, customDomain?: string | null): string {
  const fallback = `https://mostralo.com.br/loja/${encodeURIComponent(slug)}/meus-pedidos`;
  if (typeof requested !== 'string' || requested.length > 500) return fallback;
  let u: URL;
  try {
    u = new URL(requested);
  } catch {
    return fallback;
  }
  if (u.protocol !== 'https:') return fallback;
  const host = u.hostname.toLowerCase();
  const store = hostOf(customDomain);
  const ok =
    host === 'mostralo.com.br' ||
    host === 'www.mostralo.com.br' ||
    host.endsWith('.mostralo.pages.dev') ||
    (!!store && (host === store || host === store.replace(/^www\./, '')));
  return ok ? u.toString() : fallback;
}

function onlyDigits(v: string | null | undefined): string {
  return (v ?? '').replace(/\D/g, '');
}

/** Corpo da preferência (Checkout Pro). O valor vem sempre do pedido gravado no servidor. */
export function buildOrderPreference(opts: {
  order: OrderForPayment;
  storeName: string;
  returnUrl: string;
  notificationUrl: string;
  expiresAt: string;
}): Record<string, unknown> {
  const { order, storeName, returnUrl, notificationUrl, expiresAt } = opts;
  const amount = Math.round(Number(order.total) * 100) / 100;
  const sep = returnUrl.includes('?') ? '&' : '?';
  const back = `${returnUrl}${sep}pedido=${encodeURIComponent(order.id)}`;
  const body: Record<string, unknown> = {
    external_reference: orderExternalReference(order.id),
    items: [
      {
        id: order.id,
        title: `Pedido #${order.order_number} - ${storeName}`.slice(0, 250),
        quantity: 1,
        unit_price: amount,
        currency_id: 'BRL',
      },
    ],
    notification_url: notificationUrl,
    back_urls: { success: back, pending: back, failure: back },
    auto_return: 'approved',
    statement_descriptor: storeName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 ]/g, '').slice(0, 22) || undefined,
    expires: true,
    expiration_date_to: expiresAt,
    // boleto fora: o pedido precisa de confirmação na hora
    payment_methods: { excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }], installments: 12 },
  };
  const payer: Record<string, unknown> = {};
  if (order.customer_name) payer.name = order.customer_name;
  if (order.customer_email) payer.email = order.customer_email;
  const phone = onlyDigits(order.customer_phone).replace(/^55(?=\d{10,11}$)/, '');
  if (phone.length >= 10) payer.phone = { area_code: phone.slice(0, 2), number: phone.slice(2) };
  if (Object.keys(payer).length) body.payer = payer;
  return body;
}

export interface MpPayment {
  id?: number | string;
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
  payment_type_id?: string;
  payment_method_id?: string;
  external_reference?: string;
  date_approved?: string | null;
  installments?: number;
}

/** Pagamento aprovado e com valor que cobre o pedido (tolerância de 1 centavo). */
export function paymentSettlesOrder(payment: MpPayment, orderId: string, orderTotal: number): boolean {
  return (
    payment.status === 'approved' &&
    payment.external_reference === orderExternalReference(orderId) &&
    Number(payment.transaction_amount ?? 0) + 0.01 >= Number(orderTotal)
  );
}

/** Forma de pagamento do pedido a partir do pagamento aprovado. */
export function orderPaymentMethodFrom(payment: MpPayment): 'pix' | 'card' {
  return payment.payment_type_id === 'credit_card' || payment.payment_type_id === 'debit_card' ? 'card' : 'pix';
}

/** Detalhes gravados no pedido depois de pago (sem dados do cartão). */
export function paidDetails(payment: MpPayment): Record<string, unknown> {
  return {
    gateway: MP_GATEWAY,
    mp_payment_id: payment.id != null ? String(payment.id) : null,
    payment_type: payment.payment_type_id ?? null,
    payment_method: payment.payment_method_id ?? null,
    installments: payment.installments ?? null,
    amount: payment.transaction_amount ?? null,
    paid_at: payment.date_approved ?? null,
    ...(payment.payment_type_id === 'credit_card' ? { card_type: 'credit' } : {}),
    ...(payment.payment_type_id === 'debit_card' ? { card_type: 'debit' } : {}),
  };
}
