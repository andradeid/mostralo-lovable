// Aviso de status do pedido ao cliente, pelo WhatsApp da própria loja (UaZapi).
// Chamado pelo gatilho _order_status_whatsapp (pg_net) com { notification_id }.
// Segurança: só envia se existir o registro em order_schedule_notifications ainda "pending"
// (criado pelo gatilho; ninguém de fora cria). O telefone vem do pedido, nunca do chamador.
// Não espelha no chat ao vivo (sem gravar em whatsapp_chat_messages / whatsapp_conversations).
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  eventFromKind,
  formatEstimatedTime,
  formatOrderItems,
  greetingAt,
  renderOrderMessage,
} from '../_shared/order-status-message.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const body = await req.json().catch(() => ({}));
  const id = typeof body?.notification_id === 'string' ? body.notification_id : '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'bad_request' }, 400);

  // Pega o registro uma vez só (pending → sending)
  const { data: note } = await admin
    .from('order_schedule_notifications')
    .update({ status: 'sending' })
    .eq('id', id)
    .eq('status', 'pending')
    .like('kind', 'status_%')
    .select('id, store_id, order_id, kind, phone')
    .maybeSingle();
  if (!note) return json({ skipped: 'not_pending' });

  const finish = async (status: 'sent' | 'failed' | 'skipped', extra: Record<string, unknown> = {}) => {
    await admin.from('order_schedule_notifications').update({ status, ...extra }).eq('id', note.id);
    return json({ status, ...extra });
  };

  try {
    const event = eventFromKind(note.kind);
    if (!event || !note.order_id) return finish('skipped', { error: 'Evento inválido' });

    const [{ data: cfg }, { data: order }, { data: store }] = await Promise.all([
      admin.from('whatsapp_auto_messages').select('*').eq('store_id', note.store_id).maybeSingle(),
      admin.from('orders')
        .select('id, store_id, order_number, total, customer_name, customer_phone, customer_address, delivery_type, estimated_delivery_minutes, created_at')
        .eq('id', note.order_id).maybeSingle(),
      admin.from('stores').select('name, slug, phone, whatsapp, custom_domain, custom_domain_verified, timezone').eq('id', note.store_id).maybeSingle(),
    ]);
    const enabledKey = `${event}_enabled`;
    const messageKey = `${event}_message`;
    if (!cfg?.is_enabled || !(cfg as Record<string, unknown>)[enabledKey]) return finish('skipped', { error: 'Aviso desligado na loja' });
    const template = String((cfg as Record<string, unknown>)[messageKey] ?? '').trim();
    if (!template) return finish('skipped', { error: 'Modelo vazio' });
    if (!order || order.store_id !== note.store_id || !store) return finish('skipped', { error: 'Pedido não encontrado' });

    const { data: items } = await admin.from('order_items').select('product_name, quantity, subtotal').eq('order_id', order.id);
    const tz = store.timezone || 'America/Sao_Paulo';
    const text = renderOrderMessage(template, {
      customerName: order.customer_name,
      storeName: store.name,
      storeSlug: store.slug,
      storeCustomDomain: store.custom_domain,
      storeCustomDomainVerified: store.custom_domain_verified,
      storePhone: store.whatsapp || store.phone,
      orderId: order.id,
      orderNumber: order.order_number,
      orderTotal: Number(order.total),
      deliveryAddress: order.customer_address,
      deliveryType: order.delivery_type,
      orderItems: formatOrderItems(items ?? []),
      estimatedTime: formatEstimatedTime(order.estimated_delivery_minutes, order.created_at, tz),
      greeting: greetingAt(new Date(), tz),
    });
    if (!text) return finish('skipped', { error: 'Mensagem vazia' });

    // WhatsApp da loja (nunca o master)
    const { data: inst } = await admin
      .from('whatsapp_instances')
      .select('instance_name, api_token')
      .eq('store_id', note.store_id)
      .eq('provider', 'uazapi')
      .eq('status', 'connected')
      .neq('instance_name', 'master-whatsapp-instance')
      .not('api_token', 'is', null)
      .order('last_connected_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    if (!inst?.api_token) return finish('skipped', { error: 'Loja sem WhatsApp conectado', message: text });
    const { data: ua } = await admin.from('uazapi_config').select('api_url').order('is_active', { ascending: false }).limit(1).maybeSingle();
    if (!ua?.api_url) return finish('skipped', { error: 'UaZapi não configurada', message: text });

    const phone = note.phone;
    if (!phone) return finish('skipped', { error: 'Telefone inválido', message: text });

    const res = await fetch(`${String(ua.api_url).replace(/\/+$/, '')}/send/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token: inst.api_token },
      body: JSON.stringify({ number: phone, text }),
    });
    const data = await res.json().catch(() => ({}));
    const messageId = data?.messageid || data?.id || data?.key?.id || null;

    await admin.from('whatsapp_messages').insert({
      store_id: note.store_id,
      phone_number: phone,
      message_type: 'text',
      content: text,
      status: res.ok ? 'sent' : 'failed',
      evolution_message_id: messageId,
      error_message: res.ok ? null : JSON.stringify(data).slice(0, 1000),
      sent_at: res.ok ? new Date().toISOString() : null,
      failed_at: res.ok ? null : new Date().toISOString(),
    });

    if (!res.ok) {
      console.error('[order-status-whatsapp] falha UaZapi', res.status, JSON.stringify(data).slice(0, 300));
      return finish('failed', { error: `UaZapi ${res.status}`, message: text, channel: 'text' });
    }
    return finish('sent', { message: text, channel: 'text', sent_at: new Date().toISOString() });
  } catch (e) {
    console.error('[order-status-whatsapp]', (e as Error)?.message);
    return finish('failed', { error: (e as Error)?.message?.slice(0, 300) ?? 'erro' });
  }
});
