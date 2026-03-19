import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';

/**
 * Hook leve para verificar se um módulo está habilitado para a loja ativa.
 * Usa React Query com cache longo (5min stale, 30min gc) para evitar queries repetidas.
 * 
 * Diferente do useStoreModules (que carrega TODOS os módulos com status completo),
 * este hook é otimizado para ser usado como guard em outros hooks,
 * retornando apenas um boolean simples.
 * 
 * Padrão de uso:
 * ```ts
 * const moduleEnabled = useModuleEnabled('kds');
 * const { data } = useQuery({
 *   enabled: !!storeId && moduleEnabled,
 *   ...
 * });
 * ```
 */
export function useModuleEnabled(moduleKey: string): boolean {
  const { storeId } = useStoreAccess();

  const { data: isEnabled } = useQuery({
    queryKey: ['module-enabled', storeId, moduleKey],
    queryFn: async (): Promise<boolean> => {
      if (!storeId) return false;

      // 1. Buscar plan_id da loja
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('plan_id')
        .eq('id', storeId)
        .single();

      if (storeError || !store?.plan_id) return false;

      // 2. Buscar o module_id pela key
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('id')
        .eq('key', moduleKey)
        .eq('is_active', true)
        .single();

      if (moduleError || !moduleData) return false;

      const moduleId = moduleData.id;

      // 3. Verificar override em store_modules
      const { data: storeModule } = await supabase
        .from('store_modules')
        .select('is_enabled')
        .eq('store_id', storeId)
        .eq('module_id', moduleId)
        .maybeSingle();

      // Se tem override, usar o valor dele
      if (storeModule) {
        return storeModule.is_enabled;
      }

      // 4. Sem override: verificar se módulo está no plano
      const { data: planModule } = await supabase
        .from('plan_modules')
        .select('module_id')
        .eq('plan_id', store.plan_id)
        .eq('module_id', moduleId)
        .maybeSingle();

      return !!planModule;
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutos - módulos raramente mudam
    gcTime: 30 * 60 * 1000, // 30 minutos no cache
    // Enquanto carrega, retornar true para evitar flash de bloqueio
    // (as páginas já são protegidas pela Sidebar/ModuleGate)
    placeholderData: true,
  });

  // Se não tem storeId, permitir acesso (sem contexto de loja = acesso livre)
  if (!storeId) return true;

  return isEnabled ?? true;
}

/**
 * Hook para verificar múltiplos módulos de uma vez.
 * Retorna true se QUALQUER um dos módulos estiver habilitado.
 */
export function useAnyModuleEnabled(...moduleKeys: string[]): boolean {
  const results = moduleKeys.map(key => useModuleEnabled(key));
  return results.some(enabled => enabled);
}
