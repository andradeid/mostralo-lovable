import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StoreWebhookSyncResult {
  storeId: string;
  storeName: string;
  instanceName: string;
  success: boolean;
  events?: string[];
  message?: string;
}

interface SyncResponse {
  success: boolean;
  results: StoreWebhookSyncResult[];
  nextOffset?: number | null;
  error?: string;
}

export async function syncAllStoreWebhooks(onResults?: (results: StoreWebhookSyncResult[]) => void, planId?: string) {
  const results: StoreWebhookSyncResult[] = [];
  let offset: number | null = 0;
  while (offset !== null) {
    const { data, error } = await supabase.functions.invoke<SyncResponse>('uazapi-manage', {
      body: { action: 'sync_all_instance_webhooks', offset, ...(planId ? { plan_id: planId } : {}) },
    });
    if (error || data?.error || !data) throw new Error(data?.error || 'Não foi possível sincronizar os webhooks.');
    results.push(...data.results);
    onResults?.([...results]);
    offset = data.nextOffset ?? null;
  }
  return results;
}

/** Access is already saved. Failure must not undo it or falsely report a failed save. */
export async function syncWebhookAfterModuleChange(moduleId: string, storeIds: string[]) {
  try {
    const { data: module, error } = await supabase.from('modules').select('key').eq('id', moduleId).single();
    if (error) throw error;
    if (module.key !== 'whatsapp_chat') return;
    for (const storeId of [...new Set(storeIds)]) {
      const { data, error: invokeError } = await supabase.functions.invoke<SyncResponse>('uazapi-manage', {
        body: { action: 'sync_instance_webhook', store_id: storeId },
      });
      if (invokeError || !data?.success) throw new Error('Sincronização pendente');
    }
  } catch {
    toast.warning('Acesso salvo, mas o webhook não foi sincronizado. Use a sincronização em Conexões WhatsApp.');
  }
}

export async function syncWebhookAfterPlanChange(planId?: string, storeId?: string) {
  try {
    if (storeId) {
      const { data, error } = await supabase.functions.invoke<SyncResponse>('uazapi-manage', {
        body: { action: 'sync_instance_webhook', store_id: storeId },
      });
      if (error || !data?.success) throw new Error('Sincronização pendente');
    } else {
      const results = await syncAllStoreWebhooks(undefined, planId);
      if (results.some(result => !result.success)) throw new Error('Sincronização parcial');
    }
  } catch {
    toast.warning('Plano salvo, mas há webhooks pendentes. Use a sincronização em Conexões WhatsApp.');
  }
}