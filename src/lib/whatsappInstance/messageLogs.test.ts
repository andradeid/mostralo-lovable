import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getFriendlyLogErrorMessage, calculateDaysInactive } from './messageLogs.ts';

const base = { id: '1', phone_number: '5561999999999', content: 'oi', status: 'failed', created_at: '2026-11-01' };

test('número sem WhatsApp vira mensagem amigável', () => {
  const log = { ...base, error_message: JSON.stringify({ response: { message: [{ exists: false }] } }) };
  assert.match(getFriendlyLogErrorMessage(log)!, /não possui WhatsApp ativo/);
});
test('erro em texto fica como está; sem erro devolve null', () => {
  assert.equal(getFriendlyLogErrorMessage({ ...base, error_message: 'Falha X' }), 'Falha X');
  assert.equal(getFriendlyLogErrorMessage(base), null);
});
test('dias sem pedir', () => {
  assert.equal(calculateDaysInactive(null), '—');
  assert.equal(calculateDaysInactive(new Date(Date.now() - 3 * 86400000 - 1000).toISOString()), '3');
});
