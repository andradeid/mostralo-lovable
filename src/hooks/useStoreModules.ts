import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { syncWebhookAfterModuleChange } from '@/lib/syncStoreWebhooks';
import {
  invalidateStoreModuleAccess,
  loadStoreModuleAccess,
  modulesWithStatus as computeModulesWithStatus,
  type ModuleWithStatus as ModuleWithStatusBase,
} from '@/lib/modules/storeModuleAccess';

type ModuleWithStatus = ModuleWithStatusBase;

interface UseStoreModulesReturn {
  modules: ModuleWithStatus[];
  loading: boolean;
  error: string | null;
  hasModule: (moduleKey: string) => boolean;
  blockModule: (moduleId: string, reason?: string) => Promise<boolean>;
  unblockModule: (moduleId: string) => Promise<boolean>;
  grantExtraAccess: (moduleId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useStoreModules(storeId: string | null): UseStoreModulesReturn {
  const [modules, setModules] = useState<ModuleWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedStoreId, setResolvedStoreId] = useState<string | null>(null);
  const requestRef = useRef(0);
  const isLoading = loading || resolvedStoreId !== storeId;

  const fetchModules = useCallback(async (force?: boolean) => {
    const requestId = ++requestRef.current;
    if (!storeId) {
      setModules([]);
      setResolvedStoreId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Uma chamada só (módulos, plano e overrides), com cache compartilhado entre componentes
      const access = await loadStoreModuleAccess(supabase as any, storeId, { force: force === true });
      const modulesWithStatus: ModuleWithStatus[] = computeModulesWithStatus(access);

      if (requestId !== requestRef.current) return;
      setModules(modulesWithStatus);
    } catch (err: unknown) {
      if (requestId !== requestRef.current) return;
      console.error('Erro ao buscar módulos:', err);
      setModules([]);
      setError(err instanceof Error ? err.message : 'Erro ao carregar módulos');
    } finally {
      if (requestId === requestRef.current) {
        setResolvedStoreId(storeId);
        setLoading(false);
      }
    }
  }, [storeId]);

  useEffect(() => {
    fetchModules(false);
    return () => { requestRef.current += 1; };
  }, [fetchModules]);

  // Verifica se a loja tem acesso a um módulo específico
  const hasModule = useCallback((moduleKey: string): boolean => {
    // Se não tem storeId, permitir acesso (não há contexto de loja)
    if (!storeId) return true;
    
    // Se ainda está carregando, permitir acesso temporariamente (evita flash de bloqueio)
    if (isLoading) return true;
    
    // ⚠️ SEGURANÇA: Se a lista está vazia E não está carregando = erro de conexão
    // Comportamento seguro: BLOQUEAR acesso quando há erro
    if (modules.length === 0 && !loading) {
      console.warn('⚠️ useStoreModules: Módulos não carregados - bloqueando acesso por segurança');
      return false;
    }
    
    const module = modules.find(m => m.key === moduleKey);
    // Se o módulo não existe na lista, bloquear (módulo não cadastrado = bloqueado)
    if (!module) return false;
    
    // Retornar true se NÃO está bloqueado
    return !module.isBlocked;
  }, [modules, storeId, isLoading]);

  // Bloquear módulo para a loja (mesmo que esteja no plano)
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

      invalidateStoreModuleAccess(storeId);
      await syncWebhookAfterModuleChange(moduleId, [storeId]);
      await fetchModules(true);
      return true;
    } catch (err: any) {
      console.error('Erro ao bloquear módulo:', err);
      return false;
    }
  }, [storeId, fetchModules]);

  // Desbloquear módulo (remover override se módulo está no plano)
  const unblockModule = useCallback(async (moduleId: string): Promise<boolean> => {
    if (!storeId) return false;

    try {
      // Remover registro de override (voltar ao estado do plano)
      const { error } = await supabase
        .from('store_modules')
        .delete()
        .eq('store_id', storeId)
        .eq('module_id', moduleId);

      if (error) throw error;

      invalidateStoreModuleAccess(storeId);
      await syncWebhookAfterModuleChange(moduleId, [storeId]);
      await fetchModules(true);
      return true;
    } catch (err: any) {
      console.error('Erro ao desbloquear módulo:', err);
      return false;
    }
  }, [storeId, fetchModules]);

  // Conceder acesso extra (módulo fora do plano)
  const grantExtraAccess = useCallback(async (moduleId: string): Promise<boolean> => {
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
        // Atualizar registro existente para liberar
        const { error } = await supabase
          .from('store_modules')
          .update({
            is_enabled: true,
            blocked_at: null,
            blocked_by: null,
            blocked_reason: null,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Criar novo registro de liberação extra
        const { error } = await supabase
          .from('store_modules')
          .insert({
            store_id: storeId,
            module_id: moduleId,
            is_enabled: true,
            blocked_at: null,
            blocked_by: null,
            blocked_reason: null,
          });

        if (error) throw error;
      }

      invalidateStoreModuleAccess(storeId);
      await syncWebhookAfterModuleChange(moduleId, [storeId]);
      await fetchModules(true);
      return true;
    } catch (err: any) {
      console.error('Erro ao conceder acesso extra:', err);
      return false;
    }
  }, [storeId, fetchModules]);

  return {
    modules,
    loading: isLoading,
    error,
    hasModule,
    blockModule,
    unblockModule,
    grantExtraAccess,
    refetch: () => fetchModules(true),
  };
}
