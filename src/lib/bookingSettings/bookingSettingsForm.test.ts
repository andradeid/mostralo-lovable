import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS,
  bookingSettingsFormFromRow,
  getSectionStatus,
  buildTestNotificationMessage,
} from './bookingSettingsForm.ts';

// deno-lint-ignore no-explicit-any
const row = (o: Record<string, unknown>): any => ({ id: 's', store_id: 'loja', ...o });

test('formulário vazio no banco cai nos padrões', () => {
  const form = bookingSettingsFormFromRow(row({}));
  assert.deepEqual(form, DEFAULT_SETTINGS);
});

test('formulário usa o que está salvo e normaliza modo e prazo do sinal', () => {
  const form = bookingSettingsFormFromRow(row({
    slot_interval_minutes: 45,
    require_deposit: true,
    deposit_payment_mode: 'mostralo',
    deposit_payment_timeout_minutes: 999,
    use_interactive_buttons: null,
    cancellation_message_template: '',
    theme_mode: 'dark',
  }));
  assert.equal(form.slot_interval_minutes, 45);
  assert.equal(form.require_deposit, true);
  assert.equal(form.deposit_payment_mode, 'mostralo');
  assert.equal(form.deposit_payment_timeout_minutes, 60);
  assert.equal(form.use_interactive_buttons, false);
  // texto vazio de cancelamento volta para o padrão (usa ||)
  assert.equal(form.cancellation_message_template, DEFAULT_SETTINGS.cancellation_message_template);
  assert.equal(form.theme_mode, 'dark');
  assert.equal(bookingSettingsFormFromRow(row({ deposit_payment_mode: 'qualquer' })).deposit_payment_mode, 'store');
});

test('status das abas', () => {
  const loc = { latitude: null };
  assert.equal(getSectionStatus('agenda', DEFAULT_SETTINGS, false, loc), null);
  assert.deepEqual(getSectionStatus('comunicacao', DEFAULT_SETTINGS, true, loc), { active: true, label: 'Conectado' });
  assert.deepEqual(getSectionStatus('pagamentos', { ...DEFAULT_SETTINGS, send_pix_payment: true }, false, loc), { active: true, label: 'Ativo' });
  assert.deepEqual(getSectionStatus('localizacao', DEFAULT_SETTINGS, false, loc), { active: false, label: 'Pendente' });
  assert.deepEqual(getSectionStatus('localizacao', DEFAULT_SETTINGS, false, { latitude: -15.8 }), { active: true, label: 'Definida' });
});

test('mensagem de teste troca as variáveis com os dados fictícios', () => {
  const form = { ...DEFAULT_SETTINGS, review_message_template: '{cliente}|{profissional}|{servico}|{data}|{horario}|{link}|{google_review}|{localizacao}' };
  const msg = buildTestNotificationMessage('review', form, 'https://loc', null, new Date(2026, 10, 5));
  assert.equal(msg, 'João Teste|Carlos Barbeiro|Corte Masculino|05/11/2026|14:30|https://mostralo.com.br/avaliar/exemplo||https://loc');
  const conf = buildTestNotificationMessage('confirmation', { ...form, confirmation_message_template: '{link} {google_review}' }, '', 'https://curto', new Date(2026, 0, 1));
  assert.equal(conf, 'https://mostralo.com.br/meu-agendamento/exemplo https://curto');
  assert.match(buildTestNotificationMessage('outro', form, '', null), /Teste de Notificação/);
});
