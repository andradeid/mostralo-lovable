/**
 * Módulos da loja numa chamada só (função `store_module_access`), com cache compartilhado.
 * Antes, cada componente que perguntava "a loja tem o módulo X?" fazia 4 consultas em sequência
 * (plano → módulo → override → plano_módulos). Com internet lenta isso virava 10–20 s de carregando.
 */

export interface ModuleRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  key: string | null;
  is_active: boolean | null;
  [extra: string]: unknown;
}

export interface StoreModuleRow {
  id: string;
  store_id: string;
  module_id: string;
  is_enabled: boolean;
  blocked_at: string | null;
  blocked_by: string | null;
  blocked_reason: string | null;
}

export interface StoreModuleAccessData {
  plan_id: string | null;
  modules: ModuleRow[];
  plan_module_ids: string[];
  store_modules: StoreModuleRow[];
}

export interface ModuleWithStatus extends ModuleRow {
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
  isFromPlan: boolean;
  isExtraAccess: boolean;
}

export function normalizeAccessData(raw: unknown): StoreModuleAccessData {
  const r = (raw ?? {}) as Partial<StoreModuleAccessData>;
  return {
    plan_id: (r.plan_id as string | null) ?? null,
    modules: Array.isArray(r.modules) ? r.modules : [],
    plan_module_ids: Array.isArray(r.plan_module_ids) ? r.plan_module_ids : [],
    store_modules: Array.isArray(r.store_modules) ? r.store_modules : [],
  };
}

/**
 * Regras (as mesmas de antes):
 * - no plano + sem override = liberado; no plano + override desligado = bloqueado
 * - fora do plano + override ligado = liberado (acesso extra); fora do plano sem override = bloqueado
 */
export function modulesWithStatus(data: StoreModuleAccessData): ModuleWithStatus[] {
  const inPlan = new Set(data.plan_module_ids);
  const overrides = new Map(data.store_modules.map((sm) => [sm.module_id, sm]));
  return data.modules.map((module) => {
    const isInPlan = inPlan.has(module.id);
    const sm = overrides.get(module.id);
    let isBlocked: boolean;
    let isExtraAccess = false;
    if (isInPlan) {
      isBlocked = sm ? !sm.is_enabled : false;
    } else if (sm && sm.is_enabled) {
      isExtraAccess = true;
      isBlocked = false;
    } else {
      isBlocked = true;
    }
    return {
      ...module,
      isBlocked,
      blockedReason: sm?.blocked_reason || null,
      blockedAt: sm?.blocked_at || null,
      isFromPlan: isInPlan,
      isExtraAccess,
    };
  });
}

/** Mesmo resultado do antigo useModuleEnabled: loja sem plano = false; override manda; senão, o plano. */
export function isModuleEnabled(data: StoreModuleAccessData, moduleKey: string): boolean {
  if (!data.plan_id) return false;
  const module = data.modules.find((m) => m.key === moduleKey && m.is_active !== false);
  if (!module) return false;
  const sm = data.store_modules.find((s) => s.module_id === module.id);
  if (sm) return !!sm.is_enabled;
  return data.plan_module_ids.includes(module.id);
}

// ── Cache compartilhado (uma chamada por loja a cada 60 s, mesmo com vários componentes pedindo) ──
const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; promise: Promise<StoreModuleAccessData> }>();

type RpcClient = { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }> };

export function loadStoreModuleAccess(client: RpcClient, storeId: string, opts?: { force?: boolean }): Promise<StoreModuleAccessData> {
  const hit = cache.get(storeId);
  if (!opts?.force && hit && Date.now() - hit.at < CACHE_MS) return hit.promise;
  const promise = Promise.resolve(client.rpc('store_module_access', { p_store_id: storeId })).then(({ data, error }) => {
    if (error) throw error;
    return normalizeAccessData(data);
  });
  promise.catch(() => {
    if (cache.get(storeId)?.promise === promise) cache.delete(storeId);
  });
  cache.set(storeId, { at: Date.now(), promise });
  return promise;
}

export function invalidateStoreModuleAccess(storeId?: string | null): void {
  if (storeId) cache.delete(storeId);
  else cache.clear();
}
