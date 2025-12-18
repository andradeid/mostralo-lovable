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

interface StoreModule {
  id: string;
  store_id: string;
  module_id: string;
  is_enabled: boolean;
  blocked_at: string | null;
  blocked_by: string | null;
  blocked_reason: string | null;
}

interface ModuleWithStatus extends Module {
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
}

interface UseStoreModulesReturn {
  modules: ModuleWithStatus[];
  loading: boolean;
  error: string | null;
  hasModule: (moduleKey: string) => boolean;
  blockModule: (moduleId: string, reason?: string) => Promise<boolean>;
  unblockModule: (moduleId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useStoreModules(storeId: string | null): UseStoreModulesReturn {
  const [modules, setModules] = useState<ModuleWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    if (!storeId) {
      setModules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar todos os módulos
      const { data: allModules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (modulesError) throw modulesError;

      // Buscar bloqueios específicos da loja
      const { data: storeModules, error: storeModulesError } = await supabase
        .from('store_modules')
        .select('*')
        .eq('store_id', storeId);

      if (storeModulesError) throw storeModulesError;

      // Mapear módulos com status de bloqueio
      const modulesWithStatus: ModuleWithStatus[] = (allModules || []).map((module) => {
        const storeModule = storeModules?.find(sm => sm.module_id === module.id);
        
        // Se existe registro em store_modules, está BLOQUEADO (is_enabled = false por padrão)
        const isBlocked = storeModule ? !storeModule.is_enabled : false;

        return {
          ...module,
          isBlocked,
          blockedReason: storeModule?.blocked_reason || null,
          blockedAt: storeModule?.blocked_at || null,
        };
      });

      setModules(modulesWithStatus);
    } catch (err: any) {
      console.error('Erro ao buscar módulos:', err);
      setError(err.message || 'Erro ao carregar módulos');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Verifica se a loja tem acesso a um módulo específico
  const hasModule = useCallback((moduleKey: string): boolean => {
    // Se não tem storeId, permitir acesso (não há contexto de loja)
    if (!storeId) return true;
    
    // Se ainda está carregando, permitir acesso temporariamente (evita flash de bloqueio)
    if (loading) return true;
    
    // ⚠️ SEGURANÇA: Se a lista está vazia E não está carregando = erro de conexão
    // Comportamento seguro: BLOQUEAR acesso quando há erro
    if (modules.length === 0 && !loading) {
      console.warn('⚠️ useStoreModules: Módulos não carregados - bloqueando acesso por segurança');
      return false;
    }
    
    const module = modules.find(m => m.key === moduleKey);
    // Se o módulo não existe na lista, permitir (módulo não cadastrado = liberado por padrão)
    if (!module) return true;
    
    // Retornar true se NÃO está bloqueado
    return !module.isBlocked;
  }, [modules, storeId, loading]);

  // Bloquear módulo para a loja
  const blockModule = useCallback(async (moduleId: string, reason?: string): Promise<boolean> => {
    if (!storeId) return false;

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Verificar se já existe registro
      const { data: existing } = await supabase
        .from('store_modules')
        .select('id')
        .eq('store_id', storeId)
        .eq('module_id', moduleId)
        .single();

      if (existing) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('store_modules')
          .update({
            is_enabled: false,
            blocked_at: new Date().toISOString(),
            blocked_by: userData?.user?.id || null,
            blocked_reason: reason || null,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Criar novo registro de bloqueio
        const { error } = await supabase
          .from('store_modules')
          .insert({
            store_id: storeId,
            module_id: moduleId,
            is_enabled: false,
            blocked_at: new Date().toISOString(),
            blocked_by: userData?.user?.id || null,
            blocked_reason: reason || null,
          });

        if (error) throw error;
      }

      await fetchModules();
      return true;
    } catch (err: any) {
      console.error('Erro ao bloquear módulo:', err);
      return false;
    }
  }, [storeId, fetchModules]);

  // Desbloquear módulo para a loja
  const unblockModule = useCallback(async (moduleId: string): Promise<boolean> => {
    if (!storeId) return false;

    try {
      // Remover registro de bloqueio (voltar ao estado padrão = liberado)
      const { error } = await supabase
        .from('store_modules')
        .delete()
        .eq('store_id', storeId)
        .eq('module_id', moduleId);

      if (error) throw error;

      await fetchModules();
      return true;
    } catch (err: any) {
      console.error('Erro ao desbloquear módulo:', err);
      return false;
    }
  }, [storeId, fetchModules]);

  return {
    modules,
    loading,
    error,
    hasModule,
    blockModule,
    unblockModule,
    refetch: fetchModules,
  };
}
