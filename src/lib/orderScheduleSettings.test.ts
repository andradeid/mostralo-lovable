/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { defaultOrderScheduleSettings, orderScheduleSchema } from './orderScheduleSettings';

test('preparation lead accepts database bounds and a saved 30-minute value', () => {
  for (const prep_lead_minutes of [0, 30, 10080]) {
    assert.equal(orderScheduleSchema.safeParse({ ...defaultOrderScheduleSettings, prep_lead_minutes }).success, true);
  }
  for (const prep_lead_minutes of [-1, 10081]) {
    assert.equal(orderScheduleSchema.safeParse({ ...defaultOrderScheduleSettings, prep_lead_minutes }).success, false);
  }
});

test('pickup intervals accept every database option but not other values', () => {
  for (const pickup_interval_minutes of [10, 15, 20, 30, 45, 60, 90, 120]) {
    assert.equal(orderScheduleSchema.safeParse({ ...defaultOrderScheduleSettings, pickup_interval_minutes }).success, true);
  }
  assert.equal(orderScheduleSchema.safeParse({ ...defaultOrderScheduleSettings, pickup_interval_minutes: 25 }).success, false);
});

test('order limits accept null or positive integers, rejecting zero', () => {
  for (const field of ['max_orders_per_day', 'max_orders_per_slot']) {
    for (const value of [null, 1]) assert.equal(orderScheduleSchema.safeParse({ ...defaultOrderScheduleSettings, [field]: value }).success, true);
    for (const value of [0, -1]) assert.equal(orderScheduleSchema.safeParse({ ...defaultOrderScheduleSettings, [field]: value }).success, false);
  }
});

test('day-before notification accepts hours 0 through 23', () => {
  for (const day_before_hour of [0, 23]) assert.equal(orderScheduleSchema.safeParse({ ...defaultOrderScheduleSettings, day_before_hour }).success, true);
  for (const day_before_hour of [-1, 24]) assert.equal(orderScheduleSchema.safeParse({ ...defaultOrderScheduleSettings, day_before_hour }).success, false);
});

test('advance notification accepts null or 10 through 1440 minutes', () => {
  for (const notify_before_minutes of [null, 10, 1440]) assert.equal(orderScheduleSchema.safeParse({ ...defaultOrderScheduleSettings, notify_before_minutes }).success, true);
  for (const notify_before_minutes of [9, 1441]) assert.equal(orderScheduleSchema.safeParse({ ...defaultOrderScheduleSettings, notify_before_minutes }).success, false);
});