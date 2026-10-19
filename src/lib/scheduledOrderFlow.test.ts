/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { belongsToDailyKanban, scheduledCountdown } from './scheduledOrderFlow';

test('confirmed orders stay outside the daily Kanban', () => {
  assert.equal(belongsToDailyKanban('confirmado'), false);
  assert.equal(belongsToDailyKanban('em_preparo'), true);
  assert.equal(belongsToDailyKanban('entrada'), true);
});
test('scheduled timers turn red only after the chosen time', () => {
  const at = '2026-10-24T13:00:00Z';
  assert.equal(scheduledCountdown(at, Date.parse('2026-10-24T10:50:00Z')).minutes, 130);
  assert.equal(scheduledCountdown(at, Date.parse(at)).color, 'green');
  assert.equal(scheduledCountdown(at, Date.parse(at) + 1).color, 'red');
});
test('completed scheduled orders do not show overdue countdowns', () => {
  assert.equal(scheduledCountdown('2026-10-24T13:00:00Z', Date.parse('2026-10-25T13:00:00Z'), 'concluido').elapsedTime, '');
});
test('cancelled scheduled orders do not show overdue countdowns', () => {
  assert.equal(scheduledCountdown('2026-10-24T13:00:00Z', Date.parse('2026-10-25T13:00:00Z'), 'cancelado').elapsedTime, '');
});
test('scheduled countdown uses days for five days remaining', () => {
  assert.equal(scheduledCountdown('2026-10-24T13:00:00Z', Date.parse('2026-10-19T13:00:00Z')).elapsedTime, 'faltam 5 dias');
});
test('scheduled countdown includes remaining hours after a day', () => {
  assert.equal(scheduledCountdown('2026-10-24T13:00:00Z', Date.parse('2026-10-23T10:00:00Z')).elapsedTime, 'faltam 1 dia e 3h');
});
test('scheduled countdown stays compact below a day', () => {
  assert.equal(scheduledCountdown('2026-10-24T13:00:00Z', Date.parse('2026-10-24T09:50:00Z')).elapsedTime, 'faltam 3h10');
});
test('scheduled countdown uses spaced minutes below an hour', () => {
  assert.equal(scheduledCountdown('2026-10-24T13:00:00Z', Date.parse('2026-10-24T12:35:00Z')).elapsedTime, 'faltam 25 min');
});