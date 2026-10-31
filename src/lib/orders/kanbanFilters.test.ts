import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterKanbanOrders, kanbanOrdersByStatus } from './kanbanFilters.ts';

// deno-lint-ignore no-explicit-any
const order = (o: Record<string, unknown>): any => ({
  order_number: '0001', customer_name: 'Ana', customer_phone: '61999990000',
  payment_status: 'pendente', delivery_type: 'delivery', status: 'entrada',
  created_at: '2026-10-31T10:00:00Z', updated_at: '2026-10-31T10:00:00Z',
  completed_at: null, cancelled_at: null, ...o,
});

const all = { searchTerm: '', paymentStatusFilter: 'all' as const, deliveryTypeFilter: 'all' as const };

test('tira os "confirmado" do Kanban do dia', () => {
  const list = [order({ id: 'a' }), order({ id: 'b', status: 'confirmado' })];
  assert.deepEqual(filterKanbanOrders(list, all).map((o) => o.id), ['a']);
});

test('busca por número, nome (sem diferenciar maiúscula) e telefone', () => {
  const list = [order({ id: 'a', order_number: '0270' }), order({ id: 'b', customer_name: 'Bruno' }), order({ id: 'c', customer_phone: '61988887777' })];
  assert.deepEqual(filterKanbanOrders(list, { ...all, searchTerm: '0270' }).map((o) => o.id), ['a']);
  assert.deepEqual(filterKanbanOrders(list, { ...all, searchTerm: 'bru' }).map((o) => o.id), ['b']);
  assert.deepEqual(filterKanbanOrders(list, { ...all, searchTerm: '8887' }).map((o) => o.id), ['c']);
});

test('filtra pagamento e tipo de entrega', () => {
  const list = [order({ id: 'a', payment_status: 'pago' }), order({ id: 'b', delivery_type: 'retirada' })];
  // deno-lint-ignore no-explicit-any
  assert.deepEqual(filterKanbanOrders(list, { ...all, paymentStatusFilter: 'pago' as any }).map((o) => o.id), ['a']);
  // deno-lint-ignore no-explicit-any
  assert.deepEqual(filterKanbanOrders(list, { ...all, deliveryTypeFilter: 'retirada' as any }).map((o) => o.id), ['b']);
});

test('Finalizados inclui cancelados, mais recente primeiro, com limite', () => {
  const list = [
    order({ id: 'velho', status: 'concluido', completed_at: '2026-10-31T08:00:00Z' }),
    order({ id: 'cancelado', status: 'cancelado', cancelled_at: '2026-10-31T09:00:00Z' }),
    order({ id: 'novo', status: 'concluido', completed_at: '2026-10-31T11:00:00Z' }),
    order({ id: 'entrada' }),
  ];
  assert.deepEqual(kanbanOrdersByStatus(list, 'concluido').map((o) => o.id), ['novo', 'cancelado', 'velho']);
  assert.deepEqual(kanbanOrdersByStatus(list, 'concluido', 2).map((o) => o.id), ['novo', 'cancelado']);
  assert.deepEqual(kanbanOrdersByStatus(list, 'entrada').map((o) => o.id), ['entrada']);
});
