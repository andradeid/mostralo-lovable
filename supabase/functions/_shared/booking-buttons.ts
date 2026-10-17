import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { normalizePhoneCanonical } from './phoneUtils.ts';

export interface ButtonSettings {
  use_interactive_buttons?: boolean;
  interactive_test_phones?: string;
}
export interface ButtonBooking {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  start_time: string;
  price: number;
  professional?: { name: string } | null;
  service?: { name: string } | null;
}
export const MOSTRALO_FOOTER = 'Agendado pelo Mostralo · mostralo.com.br';
export function testPhoneMatches(settings: ButtonSettings, phone: string): boolean {
  const canonical = normalizePhoneCanonical(phone);
  return canonical.length === 11 && (settings.interactive_test_phones || '').split(',')
    .some(value => value.trim() && normalizePhoneCanonical(value) === canonical);
}
export function usesBookingButtons(settings: ButtonSettings, phone: string): boolean {
  return settings.interactive_test_phones?.trim()
    ? testPhoneMatches(settings, phone) : settings.use_interactive_buttons === true;
}
// Future master-controlled per-store configuration. No overrides are enabled.
// Never accept this flag from merchant settings or request bodies.
const STORE_BUTTON_OVERRIDES: Readonly<Record<string, { white_label_buttons: boolean }>> = {};
export function hasWhiteLabelButtons(storeId: string): boolean {
  return STORE_BUTTON_OVERRIDES[storeId]?.white_label_buttons === true;
}
export function buttonVariables(booking: ButtonBooking, link: string, location: string): Record<string, string> {
  const [hours, minutes] = booking.start_time.split(':');
  const date = new Date(`${booking.booking_date}T12:00:00Z`);
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' })
    .format(date).replace('-feira', '');
  const [, month, day] = booking.booking_date.split('-');
  const price = Number(booking.price || 0);
  return {
    cliente: booking.customer_name.toLocaleLowerCase('pt-BR').replace(/(^|\s|[-'])\p{L}/gu, s => s.toLocaleUpperCase('pt-BR')),
    profissional: booking.professional?.name || 'Profissional', servico: booking.service?.name || 'Serviço',
    data: `${weekday}, ${day}/${month}`, horario: `${Number(hours)}h${minutes === '00' ? '' : minutes}`,
    valor: `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(price) ? 0 : 2, maximumFractionDigits: 2 })}`,
    link, localizacao: location,
  };
}
export function renderButtonText(template: string, values: Record<string, string>): string {
  // Remove only the standard management block; preserve custom uses of {link}.
  return template.replace(/🔗\s*\*?Gerencie seu agendamento(?:\s*\(remarcar\/cancelar\))?\s*:?\*?\s*\{link\}/gi, '')
    .replace(/\{(cliente|profissional|servico|data|horario|valor|link|localizacao)\}/gi,
      (match, key: string) => values[key.toLowerCase()] ?? match).replace(/\n{3,}/g, '\n\n').trim();
}
export interface BookingButtonPayload {
  type: 'button'; number: string; file?: string; text: string; choices: string[]; footerText?: string;
}
export interface ButtonStore {
  address?: string | null;
  logo_url?: string | null;
  google_maps_link?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
export function bookingButtonLocation(store: ButtonStore): string {
  if (store.google_maps_link?.trim()) return store.google_maps_link.trim();
  // Zero is a valid coordinate; require both coordinates before using them.
  if (store.latitude != null && store.longitude != null
    && Number.isFinite(store.latitude) && Number.isFinite(store.longitude)) {
    return `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`;
  }
  return store.address?.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address.trim())}` : '';
}
export function buildButtonPayload(booking: ButtonBooking, template: string, link: string,
  store: ButtonStore, reminder: boolean): BookingButtonPayload {
  const location = bookingButtonLocation(store);
  return {
    type: 'button', number: `55${normalizePhoneCanonical(booking.customer_phone)}`,
    ...(store.logo_url ? { file: store.logo_url } : {}),
    text: renderButtonText(template, buttonVariables(booking, link, location)),
    choices: [`${reminder ? '📅 Ver meu agendamento' : '📅 Remarcar ou cancelar'}|${link}`,
      ...(location ? [`📍 Como chegar|${location}`] : [])],
    ...(!hasWhiteLabelButtons(booking.store_id) ? { footerText: MOSTRALO_FOOTER } : {}),
  };
}
export interface ButtonAttempt {
  success: boolean; error?: string; apiUrl?: string; apiToken?: string;
  payload?: BookingButtonPayload; response?: string; status?: number;
}
export async function tryBookingButtons(supabase: SupabaseClient, booking: ButtonBooking,
  settings: ButtonSettings, template: string, kind: 'confirmation' | 'reminder', existingLink?: string): Promise<ButtonAttempt | null> {
  if (!usesBookingButtons(settings, booking.customer_phone)) return null;
  let payload: BookingButtonPayload | undefined;
  let status: number | undefined;
  let responseBody: string | undefined;
  try {
    const [{ data: store, error: storeError }, { data: config }, { data: instance }] = await Promise.all([
      supabase.from('stores').select('address,logo_url,google_maps_link,latitude,longitude').eq('id', booking.store_id).single(),
      supabase.from('uazapi_config').select('api_url').order('is_active', { ascending: false }).limit(1).single(),
      supabase.from('whatsapp_instances').select('instance_name,status,api_token').eq('store_id', booking.store_id).eq('provider', 'uazapi').limit(1).single(),
    ]);
    if (storeError || !store || !config?.api_url || !instance?.api_token || instance.status !== 'connected'
      || instance.instance_name === 'master-whatsapp-instance') throw new Error('Instância da loja indisponível para botões');
    let link = existingLink;
    if (!link) {
      // Read existing tokens server-side; do not broaden the public magic-link response.
      const { data: savedToken } = await supabase.from('booking_tokens').select('token').eq('booking_id', booking.id).maybeSingle();
      const { data: domain } = await supabase.from('stores').select('custom_domain,custom_domain_verified').eq('id', booking.store_id).single();
      let token = savedToken?.token;
      if (!token) {
        const { data, error } = await supabase.functions.invoke('booking-magic-link', {
          body: { action: 'create', booking_id: booking.id, skip_whatsapp: true },
        });
        if (error || !data?.token) throw new Error('Não foi possível gerar o link do agendamento');
        token = data.token;
      }
      const base = domain?.custom_domain_verified && domain.custom_domain
        ? `https://${domain.custom_domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')}` : 'https://mostralo.com.br';
      link = `${base}/meu-agendamento/${token}`;
    }
    if (!link || !/^https:\/\//.test(link)) throw new Error('Link do agendamento inválido');
    payload = buildButtonPayload(booking, template, link, store, kind === 'reminder');
    const apiUrl = config.api_url.replace(/\/$/, '');
    const response = await fetch(`${apiUrl}/send/menu`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', token: instance.api_token },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
    });
    status = response.status;
    responseBody = await response.text();
    // Never retain provider credentials even if an upstream error echoes them.
    responseBody = responseBody.split(instance.api_token).join('[redacted]');
    if (!response.ok) throw new Error(`/send/menu [${status}]: ${responseBody}`);
    return { success: true, apiUrl, apiToken: instance.api_token, payload, response: responseBody, status };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro no envio com botões';
    await supabase.from('booking_notification_logs').insert({ booking_id: booking.id, store_id: booking.store_id,
      notification_type: kind, send_method: 'automatic', status: 'failed', error_message: `Tentativa com botões; fluxo de texto preservado. ${message}` });
    return { success: false, error: message, payload, response: responseBody, status };
  }
}