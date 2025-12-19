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
  isFromPlan: boolean; // Indica se o acesso vem do plano
  isExtraAccess: boolean; // Indica se é acesso extra (override do admin)
}

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

  const fetchModules = useCallback(async () => {
    if (!storeId) {
      setModules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Buscar todos os módulos ativos
      const { data: allModules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (modulesError) throw modulesError;

      // 2. Buscar o plano da loja
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('plan_id')
        .eq('id', storeId)
        .single();

      if (storeError && storeError.code !== 'PGRST116') throw storeError;

      // 3. Buscar módulos do plano da loja
      let planModuleIds: string[] = [];
      if (storeData?.plan_id) {
        const { data: planModules, error: planModulesError } = await supabase
          .from('plan_modules')
          .select('module_id')
          .eq('plan_id', storeData.plan_id);

        if (planModulesError) throw planModulesError;
        planModuleIds = (planModules || []).map(pm => pm.module_id);
      }

      // 4. Buscar registros em store_modules (overrides: bloqueios ou liberações extras)
      const { data: storeModules, error: storeModulesError } = await supabase
        .from('store_modules')
        .select('*')
        .eq('store_id', storeId);

      if (storeModulesError) throw storeModulesError;

      // 5. Mapear módulos com status
      // Lógica:
      // - Módulo no plano + sem override = LIBERADO (isFromPlan: true)
      // - Módulo no plano + override is_enabled=false = BLOQUEADO
      // - Módulo NÃO no plano + override is_enabled=true = LIBERADO (isExtraAccess: true)
      // - Módulo NÃO no plano + sem override = BLOQUEADO
      const modulesWithStatus: ModuleWithStatus[] = (allModules || []).map((module) => {
        const isInPlan = planModuleIds.includes(module.id);
        const storeModule = storeModules?.find(sm => sm.module_id === module.id);
        
        let isBlocked = false;
        let isFromPlan = false;
        let isExtraAccess = false;

        if (isInPlan) {
          // Módulo está no plano
          isFromPlan = true;
          // Só está bloqueado se houver override explícito com is_enabled=false
          isBlocked = storeModule ? !storeModule.is_enabled : false;
        } else {
          // Módulo NÃO está no plano
          // Só está liberado se houver override com is_enabled=true
          if (storeModule && storeModule.is_enabled) {
            isExtraAccess = true;
            isBlocked = false;
          } else {
            isBlocked = true;
          }
        }

        return {
          ...module,
          isBlocked,
          blockedReason: storeModule?.blocked_reason || null,
          blockedAt: storeModule?.blocked_at || null,
          isFromPlan,
          isExtraAccess,
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
    // Se o módulo não existe na lista, bloquear (módulo não cadastrado = bloqueado)
    if (!module) return false;
    
    // Retornar true se NÃO está bloqueado
    return !module.isBlocked;
  }, [modules, storeId, loading]);

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

      await fetchModules();
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

      await fetchModules();
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

      await fetchModules();
      return true;
    } catch (err: any) {
      console.error('Erro ao conceder acesso extra:', err);
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
    grantExtraAccess,
    refetch: fetchModules,
  };
}
