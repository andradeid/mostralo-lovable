import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Module {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  key: string | null;
  is_active: boolean | null;
}

interface Store {
  id: string;
  name: string;
  slug: string | null;
}

interface StoreModuleBlock {
  id: string;
  store_id: string;
  module_id: string;
  is_enabled: boolean;
  blocked_at: string | null;
  blocked_by: string | null;
  blocked_reason: string | null;
}

interface StoreAccessStatus {
  storeId: string;
  storeName: string;
  storeSlug: string | null;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
  blockedBy: string | null;
}

interface ModuleWithStoreAccess extends Module {
  storeAccess: StoreAccessStatus[];
  totalStores: number;
  blockedCount: number;
  enabledCount: number;
}

interface UseModuleStoreManagementReturn {
  modules: ModuleWithStoreAccess[];
  stores: Store[];
  loading: boolean;
  error: string | null;
  bulkBlockModule: (moduleId: string, storeIds: string[], reason?: string) => Promise<boolean>;
  bulkUnblockModule: (moduleId: string, storeIds: string[]) => Promise<boolean>;
  toggleModuleForStore: (moduleId: string, storeId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

async function fetchModulesData(): Promise<Module[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('id, name, description, icon, key, is_active')
    .eq('is_active', true)
    .order('name');
  
  if (error) throw error;
  return (data || []) as Module[];
}

async function fetchStoresData(): Promise<Store[]> {
  // Evitar type overflow usando any e cast manual
  const query = supabase.from('stores').select('id, name, slug');
  const { data, error } = await (query as unknown as Promise<{ data: Array<{ id: string; name: string; slug: string | null }> | null; error: Error | null }>);
  
  if (error) throw error;
  return (data || []).map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
  }));
}

async function fetchBlocksData(): Promise<StoreModuleBlock[]> {
  const { data, error } = await supabase
    .from('store_modules')
    .select('id, store_id, module_id, is_enabled, blocked_at, blocked_by, blocked_reason');
  
  if (error) throw error;
  return (data || []) as StoreModuleBlock[];
}

export function useModuleStoreManagement(): UseModuleStoreManagementReturn {
  const [modules, setModules] = useState<ModuleWithStoreAccess[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar dados em paralelo
      const [allModules, allStores, allBlocks] = await Promise.all([
        fetchModulesData(),
        fetchStoresData(),
        fetchBlocksData(),
      ]);

      // Mapear módulos com status de acesso por loja
      const modulesWithAccess: ModuleWithStoreAccess[] = allModules.map((module) => {
        const storeAccess: StoreAccessStatus[] = allStores.map((store) => {
          const block = allBlocks.find(
            (b) => b.module_id === module.id && b.store_id === store.id
          );
          
          // Se existe registro em store_modules com is_enabled = false, está bloqueado
          const isBlocked = block ? !block.is_enabled : false;

          return {
            storeId: store.id,
            storeName: store.name,
            storeSlug: store.slug,
            isBlocked,
            blockedReason: block?.blocked_reason || null,
            blockedAt: block?.blocked_at || null,
            blockedBy: block?.blocked_by || null,
          };
        });

        const blockedCount = storeAccess.filter((s) => s.isBlocked).length;

        return {
          ...module,
          storeAccess,
          totalStores: allStores.length,
          blockedCount,
          enabledCount: allStores.length - blockedCount,
        };
      });

      setModules(modulesWithAccess);
      setStores(allStores);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      console.error('Erro ao buscar dados de módulos:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Bloquear módulo para múltiplas lojas
  const bulkBlockModule = useCallback(
    async (moduleId: string, storeIds: string[], reason?: string): Promise<boolean> => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id || null;
        const now = new Date().toISOString();

        // Para cada loja, criar ou atualizar registro de bloqueio
        for (const storeId of storeIds) {
          // Verificar se já existe registro
          const { data: existing } = await supabase
            .from('store_modules')
            .select('id')
            .eq('store_id', storeId)
            .eq('module_id', moduleId)
            .maybeSingle();

          if (existing) {
            // Atualizar registro existente
            const { error: updateError } = await supabase
              .from('store_modules')
              .update({
                is_enabled: false,
                blocked_at: now,
                blocked_by: userId,
                blocked_reason: reason || null,
              })
              .eq('id', existing.id);

            if (updateError) throw updateError;
          } else {
            // Criar novo registro de bloqueio
            const { error: insertError } = await supabase.from('store_modules').insert({
              store_id: storeId,
              module_id: moduleId,
              is_enabled: false,
              blocked_at: now,
              blocked_by: userId,
              blocked_reason: reason || null,
            });

            if (insertError) throw insertError;
          }
        }

        await fetchData();
        return true;
      } catch (err) {
        console.error('Erro ao bloquear módulo em massa:', err);
        return false;
      }
    },
    [fetchData]
  );

  // Desbloquear módulo para múltiplas lojas
  const bulkUnblockModule = useCallback(
    async (moduleId: string, storeIds: string[]): Promise<boolean> => {
      try {
        // Remover registros de bloqueio (voltar ao estado padrão = liberado)
        const { error: deleteError } = await supabase
          .from('store_modules')
          .delete()
          .eq('module_id', moduleId)
          .in('store_id', storeIds);

        if (deleteError) throw deleteError;

        await fetchData();
        return true;
      } catch (err) {
        console.error('Erro ao desbloquear módulo em massa:', err);
        return false;
      }
    },
    [fetchData]
  );

  // Toggle individual (para matriz)
  const toggleModuleForStore = useCallback(
    async (moduleId: string, storeId: string): Promise<boolean> => {
      try {
        // Verificar status atual
        const { data: existing } = await supabase
          .from('store_modules')
          .select('id, is_enabled')
          .eq('store_id', storeId)
          .eq('module_id', moduleId)
          .maybeSingle();

        if (existing) {
          if (existing.is_enabled) {
            // Está habilitado, bloquear
            const { data: userData } = await supabase.auth.getUser();
            const { error: updateError } = await supabase
              .from('store_modules')
              .update({
                is_enabled: false,
                blocked_at: new Date().toISOString(),
                blocked_by: userData?.user?.id || null,
              })
              .eq('id', existing.id);

            if (updateError) throw updateError;
          } else {
            // Está bloqueado, remover registro (desbloquear)
            const { error: deleteError } = await supabase
              .from('store_modules')
              .delete()
              .eq('id', existing.id);

            if (deleteError) throw deleteError;
          }
        } else {
          // Não existe registro = está liberado, criar registro de bloqueio
          const { data: userData } = await supabase.auth.getUser();
          const { error: insertError } = await supabase.from('store_modules').insert({
            store_id: storeId,
            module_id: moduleId,
            is_enabled: false,
            blocked_at: new Date().toISOString(),
            blocked_by: userData?.user?.id || null,
          });

          if (insertError) throw insertError;
        }

        await fetchData();
        return true;
      } catch (err) {
        console.error('Erro ao alternar módulo:', err);
        return false;
      }
    },
    [fetchData]
  );

  return {
    modules,
    stores,
    loading,
    error,
    bulkBlockModule,
    bulkUnblockModule,
    toggleModuleForStore,
    refetch: fetchData,
  };
}
