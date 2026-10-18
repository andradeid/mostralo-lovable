/// <reference types="node" />
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { scopeToActiveStore } from './activeStoreScope';

function createQuery() {
  const filters: [string, string][] = [];
  const query = { eq(column: string, value: string) { filters.push([column, value]); return query; } };
  return { query, filters };
}

test('orders use only the active store, including after switching stores', () => {
  for (const activeStore of ['store-one', 'store-two']) {
    const { query, filters } = createQuery();
    assert.equal(scopeToActiveStore(query, false, activeStore), query);
    assert.deepEqual(filters, [['store_id', activeStore]]);
  }
});

test('orders cannot be queried without a validated store for non-masters', () => {
  const { query, filters } = createQuery();
  assert.equal(scopeToActiveStore(query, false, null), null);
  assert.deepEqual(filters, []);
});

test('masters retain their all-store orders view', () => {
  const { query, filters } = createQuery();
  assert.equal(scopeToActiveStore(query, true, null), query);
  assert.deepEqual(filters, []);
});