/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { activeStoreScope } from './activeStoreScope';

test('orders use only the active store, including after switching stores', () => {
  for (const activeStore of ['store-one', 'store-two']) {
    assert.deepEqual(activeStoreScope(false, activeStore), { kind: 'store', storeId: activeStore });
  }
});

test('orders cannot be queried without a validated store for non-masters', () => {
  assert.deepEqual(activeStoreScope(false, null), { kind: 'waiting' });
});

test('masters retain their all-store orders view', () => {
  assert.deepEqual(activeStoreScope(true, null), { kind: 'all' });
});