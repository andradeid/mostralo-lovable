import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isModuleEnabled,
  modulesWithStatus,
  normalizeAccessData,
  loadStoreModuleAccess,
  invalidateStoreModuleAccess,
  type StoreModuleAccessData,
} from './storeModuleAccess';

const mod = (id: string, key: string) => ({ id, key, name: key, description: null, icon: null, is_active: true });
const sm = (module_id: string, is_enabled: boolean) => ({
  id: 'sm-' + module_id, store_id: 's1', module_id, is_enabled, blocked_at: null, blocked_by: null, blocked_reason: is_enabled ? null : 'motivo',
});

const data: StoreModuleAccessData = {
  plan_id: 'p1',
  modules: [mod('a', 'pdv'), mod('b', 'kds'), mod('c', 'ifood'), mod('d', 'booking')],
  plan_module_ids: ['a', 'b'],
  store_modules: [sm('b', false), sm('c', true)],
};

test('no plano sem override = liberado; override desligado bloqueia', () => {
  assert.equal(isModuleEnabled(data, 'pdv'), true);
  assert.equal(isModuleEnabled(data, 'kds'), false);
});

test('fora do plano: só com acesso extra', () => {
  assert.equal(isModuleEnabled(data, 'ifood'), true);
  assert.equal(isModuleEnabled(data, 'booking'), false);
  assert.equal(isModuleEnabled(data, 'nao-existe'), false);
});

test('loja sem plano = nenhum módulo (igual ao antigo useModuleEnabled)', () => {
  assert.equal(isModuleEnabled({ ...data, plan_id: null }, 'ifood'), false);
});

test('status completo para a tela de módulos', () => {
  const byKey = Object.fromEntries(modulesWithStatus(data).map((m) => [m.key, m]));
  assert.deepEqual([byKey.pdv.isBlocked, byKey.pdv.isFromPlan, byKey.pdv.isExtraAccess], [false, true, false]);
  assert.deepEqual([byKey.kds.isBlocked, byKey.kds.blockedReason], [true, 'motivo']);
  assert.deepEqual([byKey.ifood.isBlocked, byKey.ifood.isExtraAccess], [false, true]);
  assert.equal(byKey.booking.isBlocked, true);
});

test('dados faltando viram listas vazias', () => {
  assert.deepEqual(normalizeAccessData(null), { plan_id: null, modules: [], plan_module_ids: [], store_modules: [] });
});

test('várias chamadas ao mesmo tempo = uma consulta só; erro não fica no cache', async () => {
  let calls = 0;
  const ok = { rpc: async () => { calls++; return { data, error: null }; } };
  invalidateStoreModuleAccess();
  await Promise.all([loadStoreModuleAccess(ok, 's1'), loadStoreModuleAccess(ok, 's1'), loadStoreModuleAccess(ok, 's1')]);
  assert.equal(calls, 1);
  await loadStoreModuleAccess(ok, 's1', { force: true });
  assert.equal(calls, 2);

  let failCalls = 0;
  const fail = { rpc: async () => { failCalls++; return { data: null, error: new Error('rede') }; } };
  await assert.rejects(loadStoreModuleAccess(fail, 's2'));
  await new Promise((r) => setTimeout(r, 0));
  await assert.rejects(loadStoreModuleAccess(fail, 's2'));
  assert.equal(failCalls, 2);
});
