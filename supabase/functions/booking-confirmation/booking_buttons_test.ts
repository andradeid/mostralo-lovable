import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { usesBookingButtons, canHideFooter, buttonVariables, buildButtonPayload, renderButtonText, tryBookingButtons } from '../_shared/booking-buttons.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

const booking = { id: 'test', store_id: 'store', customer_name: 'JOÃO SILVA', customer_phone: '5561994009368',
  booking_date: '2026-10-23', start_time: '09:30:00', price: 65 };
Deno.test('Buttons default off', () => assertEquals(usesBookingButtons({}, booking.customer_phone), false));
Deno.test('Whitelist enables only matching canonical phones even when toggle off', () => {
  const settings = { interactive_test_phones: '5561994009368', use_interactive_buttons: false };
  assertEquals(usesBookingButtons(settings, '(61) 99400-9368'), true);
  assertEquals(usesBookingButtons(settings, '6194009368'), true);
  assertEquals(usesBookingButtons({ ...settings, use_interactive_buttons: true }, '61999999999'), false);
});
Deno.test('Empty whitelist follows enabled toggle', () => assertEquals(usesBookingButtons({ use_interactive_buttons: true, interactive_test_phones: '' }, booking.customer_phone), true));
Deno.test('Courtesy never hides footer', () => assertEquals(canHideFooter({ billing_enabled: false, custom_monthly_price: 0.01 }, { name: 'Premium', price: 999, booking_white_label_enabled: true }), false));
Deno.test('Fundador never hides footer', () => assertEquals(canHideFooter({ billing_enabled: true, custom_monthly_price: null }, { name: 'Plano Fundador', price: 129, booking_white_label_enabled: true }), false));
Deno.test('Paid plan requires explicit footer entitlement', () => {
  assertEquals(canHideFooter({ billing_enabled: true, custom_monthly_price: null }, { name: 'Premium', price: 999 }), false);
  assertEquals(canHideFooter({ billing_enabled: true, custom_monthly_price: null }, { name: 'Premium', price: 999, booking_white_label_enabled: true }), true);
});
Deno.test('Button variables use proper name, weekday date and friendly hour/currency', () => {
  const v = buttonVariables(booking, 'https://example.com', '');
  assertEquals(v.cliente, 'João Silva'); assertEquals(v.data, 'sexta, 23/10');
  assertEquals(v.horario, '9h30'); assertEquals(v.valor, 'R$ 65');
  const whole = buttonVariables({ ...booking, start_time: '09:00:00', price: 65.5 }, '', '');
  assertEquals(whole.horario, '9h'); assertEquals(whole.valor, 'R$ 65,50');
});
Deno.test('URL buttons omit missing logo/address and reminder uses management URL', () => {
  const payload = buildButtonPayload(booking, 'Olá {cliente}', 'https://example.com/meu-agendamento/test', {}, true, true);
  assertEquals(payload.choices, ['📅 Ver meu agendamento|https://example.com/meu-agendamento/test']);
  assertEquals(payload.file, undefined); assertEquals(payload.footerText, 'Agendado pelo Mostralo · mostralo.com.br');
});
Deno.test('Address and logo create only URL choices', () => {
  const p = buildButtonPayload(booking, '{data}', 'https://example.com/test', { address: 'Rua 1', logo_url: 'https://example.com/logo' }, false, false);
  assertEquals(p.file, 'https://example.com/logo'); assertEquals(p.footerText, undefined);
  assertEquals(p.choices[1], '📍 Como chegar|https://www.google.com/maps/search/?api=1&query=Rua%201');
  assert(p.choices.every(choice => choice.includes('|https://')));
});
Deno.test('Only standard management block is removed; custom link remains', () => {
  assertEquals(renderButtonText('Olá\n\n🔗 *Gerencie seu agendamento (remarcar/cancelar):*\n{link}\n\nFim', { link: 'https://example.com' }), 'Olá\n\nFim');
  assertEquals(renderButtonText('Link próprio: {link}', { link: 'https://example.com' }), 'Link próprio: https://example.com');
});
Deno.test('Non-2xx menu returns failure for legacy fallback and records notification error without token', async () => {
  const inserts: Record<string, unknown>[] = [];
  const client = { from: (table: string) => {
    const result = table === 'stores' ? { address: null, billing_enabled: false, custom_monthly_price: null, plan: null }
      : table === 'uazapi_config' ? { api_url: 'https://example.com' }
      : { instance_name: 'store-instance', status: 'connected', api_token: 'private-token' };
    const chain = { select: () => chain, eq: () => chain, order: () => chain, limit: () => chain,
      single: () => Promise.resolve({ data: result, error: null }), insert: (row: Record<string, unknown>) => { inserts.push(row); return Promise.resolve({ error: null }); } };
    return chain;
  } } as unknown as SupabaseClient;
  const original = globalThis.fetch;
  globalThis.fetch = () => Promise.resolve(new Response('invalid private-token', { status: 400 }));
  try {
    const result = await tryBookingButtons(client, booking, { use_interactive_buttons: true }, 'Olá', 'confirmation', 'https://example.com/test');
    assertEquals(result?.success, false); assertEquals(result?.status, 400);
    assertEquals(inserts.length, 1); assertEquals(inserts[0].notification_type, 'confirmation');
    assert(!String(inserts[0].error_message).includes('private-token'));
  } finally { globalThis.fetch = original; }
});