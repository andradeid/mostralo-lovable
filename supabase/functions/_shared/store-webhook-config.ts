import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export function resolveChatAccess(active: boolean, override: boolean | null, inPlan: boolean): boolean {
  return active && (override ?? inPlan);
}

/** Same precedence as useStoreModules: active catalog, store override, plan. */
export async function storeUsesWhatsAppCentral(supabase: SupabaseClient, storeId: string): Promise<boolean> {
  const { data: module, error: moduleError } = await supabase.from('modules')
    .select('id, is_active').eq('key', 'whatsapp_chat').maybeSingle();
  if (moduleError) throw new Error('Não foi possível consultar o módulo da Central.');
  if (!module?.is_active) return false;

  const { data: override, error: overrideError } = await supabase.from('store_modules')
    .select('is_enabled').eq('store_id', storeId).eq('module_id', module.id).maybeSingle();
  if (overrideError) throw new Error('Não foi possível consultar o acesso da loja.');
  if (override) return resolveChatAccess(true, override.is_enabled, false);

  const { data: store, error: storeError } = await supabase.from('stores')
    .select('plan_id').eq('id', storeId).single();
  if (storeError) throw new Error('Loja não encontrada.');
  if (!store.plan_id) return false;
  const { data: planModule, error: planError } = await supabase.from('plan_modules')
    .select('module_id').eq('plan_id', store.plan_id).eq('module_id', module.id).maybeSingle();
  if (planError) throw new Error('Não foi possível consultar o plano da loja.');
  return resolveChatAccess(true, null, Boolean(planModule));
}

export function buildStoreWebhookConfig(supabaseUrl: string, usesCentral: boolean) {
  return {
    url: `${supabaseUrl}/functions/v1/uazapi-webhook`,
    enabled: true,
    events: usesCentral ? ['messages', 'messages_update', 'connection', 'contacts', 'presence'] : ['connection'],
    excludeMessages: ['wasSentByApi'],
    addUrlEvents: false,
    addUrlTypesMessages: false,
  };
}

export async function getWebhookConfigForStore(supabase: SupabaseClient, supabaseUrl: string, storeId: string) {
  return buildStoreWebhookConfig(supabaseUrl, await storeUsesWhatsAppCentral(supabase, storeId));
}

export function connectionStatus(state: unknown): 'connected' | 'disconnected' | 'connecting' {
  return state === 'open' || state === 'connected' ? 'connected' :
    state === 'close' || state === 'disconnected' ? 'disconnected' : 'connecting';
}

export function isStoreInstance(instance: { store_id: string | null; instance_name: string }): boolean {
  return Boolean(instance.store_id) && instance.instance_name !== 'master-whatsapp-instance';
}