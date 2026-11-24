// Baixa do pedido pago pelo Mercado Pago (webhook e conferência pela página do cliente).
// Confere valor e referência antes de marcar como pago; pedido "aguardando_pagamento" vai
// para "entrada" (o gatilho de aceite automático da loja segue valendo).
import {
  MP_API,
  type MpPayment,
  orderExternalReference,
  orderPaymentMethodFrom,
  paidDetails,
  paymentSettlesOrder,
} from './mercadopago-order.ts';

// deno-lint-ignore no-explicit-any
type Admin = any;

export async function fetchMpPayment(accessToken: string, paymentId: string): Promise<MpPayment | null> {
  const r = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return r.ok ? ((await r.json()) as MpPayment) : null;
}

/** Pagamentos do pedido no Mercado Pago (mais recentes primeiro). */
export async function searchOrderPayments(accessToken: string, orderId: string): Promise<MpPayment[]> {
  const q = new URLSearchParams({
    external_reference: orderExternalReference(orderId),
    sort: 'date_created',
    criteria: 'desc',
    limit: '10',
  });
  const r = await fetch(`${MP_API}/v1/payments/search?${q}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) return [];
  const data = (await r.json()) as { results?: MpPayment[] };
  return data.results ?? [];
}

export type SettleResult = 'paid' | 'already_paid' | 'not_settled' | 'order_not_found';

export async function settleOrderPayment(admin: Admin, storeId: string, orderId: string, payment: MpPayment): Promise<SettleResult> {
  const { data: order } = await admin
    .from('orders')
    .select('id, store_id, total, status, payment_status, payment_details')
    .eq('id', orderId)
    .eq('store_id', storeId)
    .maybeSingle();
  if (!order) return 'order_not_found';
  if (order.payment_status === 'paid') return 'already_paid';
  if (!paymentSettlesOrder(payment, order.id, Number(order.total))) return 'not_settled';

  const update: Record<string, unknown> = {
    payment_status: 'paid',
    payment_method: orderPaymentMethodFrom(payment),
    payment_details: { ...(order.payment_details ?? {}), ...paidDetails(payment) },
    updated_at: new Date().toISOString(),
  };
  if (order.status === 'aguardando_pagamento') update.status = 'entrada';

  const { error } = await admin.from('orders').update(update).eq('id', order.id).eq('payment_status', 'pending');
  if (error) throw new Error(error.message);

  await admin
    .from('store_payment_transactions')
    .update({
      status: 'approved',
      gateway_payment_id: payment.id != null ? String(payment.id) : null,
      payment_method: payment.payment_method_id ?? null,
      webhook_received_at: new Date().toISOString(),
    })
    .eq('store_id', storeId)
    .eq('external_reference', orderExternalReference(order.id));
  return 'paid';
}
