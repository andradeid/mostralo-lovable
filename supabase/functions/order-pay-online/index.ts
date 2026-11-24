// Pagamento online do pedido da loja pelo Mercado Pago (Checkout Pro: Pix e cartão).
// POST { action: 'pay' | 'check', store_id, order_id, customer_token, return_url? }
//  - pay:   devolve o link de pagamento (reaproveita o link ainda válido do mesmo pedido)
//  - check: confere no Mercado Pago se o pedido já foi pago (caso o aviso do webhook atrase)
// Só o cliente do pedido (customer_token da customer-auth-v2) chama. O valor vem do pedido gravado.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  MP_API,
  MP_GATEWAY,
  buildOrderPreference,
  isMercadoPagoOrder,
  orderExternalReference,
  paymentSettlesOrder,
  safeReturnUrl,
} from '../_shared/mercadopago-order.ts';
import { searchOrderPayments, settleOrderPayment } from '../_shared/mercadopago-settle.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = await req.json().catch(() => ({}));
    const { action = 'pay', store_id, order_id, customer_token, return_url } = body ?? {};
    if (!store_id || !order_id || !customer_token) return json({ error: 'Dados incompletos', code: 'bad_request' }, 400);

    const { data: tokenRow } = await admin
      .from('customer_tokens')
      .select('customer_id')
      .eq('token', customer_token)
      .eq('store_id', store_id)
      .maybeSingle();
    if (!tokenRow) return json({ error: 'Sessão expirada. Entre de novo.', code: 'invalid_token' }, 401);

    const { data: order } = await admin
      .from('orders')
      .select('id, store_id, customer_id, order_number, total, status, payment_status, payment_details, customer_name, customer_email, customer_phone')
      .eq('id', order_id)
      .eq('store_id', store_id)
      .maybeSingle();
    if (!order || order.customer_id !== tokenRow.customer_id) return json({ error: 'Pedido não encontrado', code: 'not_found' }, 404);
    if (order.payment_status === 'paid') return json({ paid: true });
    if (!isMercadoPagoOrder(order.payment_details)) return json({ error: 'Este pedido não é pago online', code: 'not_online' }, 400);
    if (order.status === 'cancelado') return json({ error: 'Pedido cancelado', code: 'cancelled' }, 409);

    const { data: gateway } = await admin
      .from('store_payment_gateways')
      .select('access_token, environment')
      .eq('store_id', store_id)
      .eq('gateway', MP_GATEWAY)
      .eq('is_active', true)
      .maybeSingle();
    if (!gateway?.access_token) return json({ error: 'A loja não está recebendo pagamento online agora.', code: 'gateway_off' }, 409);

    // Conferir no Mercado Pago (vale para 'check' e antes de gerar novo link)
    const payments = await searchOrderPayments(gateway.access_token, order.id);
    const approved = payments.find((p) => paymentSettlesOrder(p, order.id, Number(order.total)));
    if (approved) {
      await settleOrderPayment(admin, store_id, order.id, approved);
      return json({ paid: true });
    }
    if (action === 'check') {
      const last = payments[0];
      return json({ paid: false, status: last?.status ?? null, status_detail: last?.status_detail ?? null });
    }

    // Link ainda válido do mesmo pedido
    const ref = orderExternalReference(order.id);
    const soon = new Date(Date.now() + 10 * 60_000).toISOString();
    const { data: existing } = await admin
      .from('store_payment_transactions')
      .select('checkout_url, expires_at, amount')
      .eq('store_id', store_id)
      .eq('external_reference', ref)
      .eq('status', 'pending')
      .gt('expires_at', soon)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.checkout_url && Number(existing.amount) === Number(order.total)) {
      return json({ paid: false, checkout_url: existing.checkout_url });
    }

    const { data: store } = await admin.from('stores').select('name, slug, custom_domain, custom_domain_verified').eq('id', store_id).single();
    const returnUrl = safeReturnUrl(return_url, store.slug, store.custom_domain_verified ? store.custom_domain : null);
    const expiresAt = new Date(Date.now() + 24 * 3600_000).toISOString();
    const preference = buildOrderPreference({
      order,
      storeName: store.name,
      returnUrl,
      notificationUrl: `${supabaseUrl}/functions/v1/mercadopago-webhook?store_id=${store_id}`,
      expiresAt,
    });

    const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gateway.access_token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${ref}_${Date.now()}`,
      },
      body: JSON.stringify(preference),
    });
    const mp = await mpRes.json().catch(() => ({}));
    if (!mpRes.ok) {
      console.error('[order-pay-online] erro MP', mpRes.status, JSON.stringify({ message: mp?.message, cause: mp?.cause }));
      return json({ error: 'Não foi possível abrir o pagamento agora. Tente de novo em instantes.', code: 'mp_error' }, 502);
    }
    const checkoutUrl = gateway.environment === 'sandbox' ? mp.sandbox_init_point || mp.init_point : mp.init_point;

    await admin.from('store_payment_transactions').insert({
      store_id,
      gateway: MP_GATEWAY,
      gateway_payment_id: mp.id,
      module: 'order',
      reference_id: order.id,
      amount: Number(order.total),
      currency: 'BRL',
      status: 'pending',
      external_reference: ref,
      checkout_url: checkoutUrl,
      payer_email: order.customer_email ?? null,
      payer_name: order.customer_name ?? null,
      gateway_response: { preference_id: mp.id },
      expires_at: expiresAt,
    });

    return json({ paid: false, checkout_url: checkoutUrl });
  } catch (e) {
    console.error('[order-pay-online]', (e as Error)?.message);
    return json({ error: 'Erro interno', code: 'internal' }, 500);
  }
});
