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