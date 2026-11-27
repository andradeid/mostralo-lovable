import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  businessDeadline, deadlineLabel, isLongEstimate, leadDaysFromConfig, leadMinutesFromCreation, leadTimeText,
} from './leadTime';

const TZ = 'America/Sao_Paulo';

test('lê os dias úteis da configuração', () => {
  assert.equal(leadDaysFromConfig({ lead_time_business_days: 5 }), 5);
  assert.equal(leadDaysFromConfig({ lead_time_business_days: '3' }), 3);
  assert.equal(leadDaysFromConfig({ lead_time_business_days: 0 }), null);
  assert.equal(leadDaysFromConfig({ lead_time_business_days: 2.5 }), null);
  assert.equal(leadDaysFromConfig({}), null);
  assert.equal(leadDaysFromConfig(null), null);
});

test('texto no singular e plural', () => {
  assert.equal(leadTimeText(1), 'até 1 dia útil');
  assert.equal(leadTimeText(5), 'até 5 dias úteis');
});

test('5 dias úteis a partir de quinta pula o fim de semana', () => {
  // qui 26/11/2026 19:00 em São Paulo (22:00 UTC) → qui 03/12 23:59 local
  const d = businessDeadline(new Date('2026-11-26T22:00:00Z'), 5, TZ);
  assert.equal(d.toISOString(), '2026-12-04T02:59:00.000Z');
  assert.equal(deadlineLabel(d, TZ), 'qui. 03/12');
});

test('aceite na sexta à noite (já sábado em UTC) conta pelo dia local', () => {
  // sex 27/11 23:30 local = sáb 28/11 02:30 UTC; 1 dia útil → seg 30/11
  const d = businessDeadline(new Date('2026-11-28T02:30:00Z'), 1, TZ);
  assert.equal(deadlineLabel(d, TZ), 'seg. 30/11');
});

test('aceite no sábado: 1 dia útil vai para segunda', () => {
  const d = businessDeadline(new Date('2026-11-28T15:00:00Z'), 1, TZ);
  assert.equal(deadlineLabel(d, TZ), 'seg. 30/11');
});

test('minutos contam desde a criação do pedido', () => {
  const created = '2026-11-26T12:00:00Z';
  const now = new Date('2026-11-26T22:00:00Z');
  const min = leadMinutesFromCreation(created, 5, now, TZ);
  // até 04/12 02:59 UTC
  assert.equal(min, Math.floor((Date.parse('2026-12-04T02:59:00Z') - Date.parse(created)) / 60000));
  assert.ok(isLongEstimate(min));
  assert.equal(isLongEstimate(90), false);
  assert.equal(isLongEstimate(null), false);
});
