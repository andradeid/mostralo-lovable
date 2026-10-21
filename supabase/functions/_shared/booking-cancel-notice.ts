import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { normalizePhoneCanonical } from './phoneUtils.ts';
import { buttonVariables, hasWhiteLabelButtons, usesBookingButtons } from './booking-buttons.ts';

// Aviso de cancelamento de agendamento (cliente pelo link ou loja pelo painel).
// O lojista edita o texto em Agendamento → Comunicação; o rodapé do Mostralo é fixo.
export const DEFAULT_CANCELLATION_TEMPLATE =
  '❌ *Agendamento cancelado*\n\n' +
  'Olá *{cliente}*, seu agendamento foi cancelado:\n\n' +
  '👤 Profissional: {profissional}\n' +
  '💇 Serviço: {servico}\n' +
  '📅 Data: {data}\n' +
  '🕐 Horário: {horario}\n' +
  '{motivo}\n' +
  'Quer marcar outro horário?\n' +
  '🔗 {link}\n\n' +
  '_{loja} agradece a preferência! 💙_';

export const CANCELLATION_FOOTER = 'Agende online pelo Mostralo · mostralo.com.br';

export interface CancelNoticeResult { sent: boolean; skipped?: string; method?: 'buttons' | 'text'; error?: string }

function storeBase(store: { custom_domain?: string | null; custom_domain_verified?: boolean | null } | null): string | null {
  const d = store?.custom_domain?.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return d && store?.custom_domain_verified ? `https://${d}` : null;
}

/** Monta o texto. Com botões, a linha com {link} sai (o link vai no botão). */
export function renderCancellationText(template: string, vars: Record<string, string>, buttons: boolean): string {
  let t = template || DEFAULT_CANCELLATION_TEMPLATE;
  if (buttons) t = t.split('\n').filter((line) => !/\{link\}/i.test(line)).join('\n');
  return t
    .replace(/\{(cliente|profissional|servico|data|horario|motivo|link|loja)\}/gi, (m, k: string) => vars[k.toLowerCase()] ?? m)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function sendCancellationNotice(
  supabase: SupabaseClient,
  bookingId: string,
  opts: { reason?: string | null; sendMethod: 'automatic' | 'manual'; sentBy?: string | null },
): Promise<CancelNoticeResult> {
  const { data: booking } = await supabase
    .from('bookings')
    .select(`id, store_id, customer_name, customer_phone, booking_date, start_time, price, status,
      professional:professionals(name), service:booking_services(name),
      store:stores(id, name, slug, logo_url, custom_domain, custom_domain_verified)`)
    .eq('id', bookingId)
    .single();
  if (!booking) return { sent: false, skipped: 'Agendamento não encontrado' };
  const b = booking as any;
  if (b.status !== 'cancelled') return { sent: false, skipped: 'Agendamento não está cancelado' };

  const log = async (status: 'sent' | 'failed', error?: string) => {
    await supabase.from('booking_notification_logs').insert({
      booking_id: b.id, store_id: b.store_id, notification_type: 'cancellation',
      send_method: opts.sendMethod, status, error_message: error ?? null, sent_by: opts.sentBy ?? null,
    });
  };

  const [{ data: settings }, { data: config }, { data: instance }] = await Promise.all([
    supabase.from('booking_settings')
      .select('send_cancellation_message, cancellation_message_template, use_interactive_buttons, interactive_test_phones')
      .eq('store_id', b.store_id).maybeSingle(),
    supabase.from('uazapi_config').select('api_url').order('is_active', { ascending: false }).limit(1).single(),
    supabase.from('whatsapp_instances').select('instance_name, status, api_token')
      .eq('store_id', b.store_id).eq('provider', 'uazapi').limit(1).maybeSingle(),
  ]);
  if (settings && settings.send_cancellation_message === false) return { sent: false, skipped: 'Aviso de cancelamento desligado' };
  if (!config?.api_url || !instance?.api_token || instance.status !== 'connected' || instance.instance_name === 'master-whatsapp-instance') {
    return { sent: false, skipped: 'WhatsApp da loja não conectado' };
  }

  const phoneCanonical = normalizePhoneCanonical(b.customer_phone || '');
  if (phoneCanonical.length < 10) { await log('failed', 'Telefone do cliente inválido'); return { sent: false, error: 'Telefone inválido' }; }
  const number = `55${phoneCanonical}`;

  const base = storeBase(b.store);
  const link = base ? `${base}/agendar` : `https://mostralo.com.br/agendar/${b.store?.slug || ''}`;
  const v = buttonVariables({ ...b, price: Number(b.price || 0) }, link, '');
  const reason = (opts.reason || '').trim();
  const vars: Record<string, string> = {
    cliente: v.cliente, profissional: v.profissional, servico: v.servico, data: v.data, horario: v.horario,
    motivo: reason ? `\n📝 Motivo: ${reason}\n` : '', link, loja: b.store?.name || 'Equipe',
  };
  const template = settings?.cancellation_message_template?.trim() || DEFAULT_CANCELLATION_TEMPLATE;
  const apiUrl = config.api_url.replace(/\/$/, '');
  const headers = { 'Content-Type': 'application/json', token: instance.api_token };
  const logo: string | null = b.store?.logo_url || null;
  const redact = (s: string) => s.split(instance.api_token).join('[redacted]');

  let buttonError = '';
  if (usesBookingButtons(settings || {}, b.customer_phone || '')) {
    try {
      const payload = {
        type: 'button', number, ...(logo ? { file: logo } : {}),
        text: renderCancellationText(template, vars, true),
        choices: [`📅 Agendar novamente|${link}`],
        ...(!hasWhiteLabelButtons(b.store_id) ? { footerText: CANCELLATION_FOOTER } : {}),
      };
      const r = await fetch(`${apiUrl}/send/menu`, { method: 'POST', headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
      if (r.ok) { await log('sent'); return { sent: true, method: 'buttons' }; }
      buttonError = `/send/menu [${r.status}]: ${redact(await r.text()).slice(0, 300)}`;
    } catch (e) {
      buttonError = e instanceof Error ? e.message : 'Erro no envio com botões';
    }
    console.error('[cancel-notice] botões falharam, enviando texto:', buttonError);
  }

  try {
    const text = renderCancellationText(template, vars, false);
    const r = logo
      ? await fetch(`${apiUrl}/send/media`, { method: 'POST', headers, body: JSON.stringify({ number, file: logo, text, type: 'image' }), signal: AbortSignal.timeout(15000) })
      : await fetch(`${apiUrl}/send/text`, { method: 'POST', headers, body: JSON.stringify({ number, text }), signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`[${r.status}] ${redact(await r.text()).slice(0, 300)}`);
    await log('sent', buttonError ? `Enviado em texto (botões falharam: ${buttonError})` : undefined);
    return { sent: true, method: 'text' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao enviar';
    await log('failed', msg);
    return { sent: false, error: msg };
  }
}
