import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlanModule {
  id: string;
  plan_id: string;
  module_id: string;
}

interface UsePlanModulesReturn {
  fetchPlanModules: (planId: string) => Promise<string[]>;
  savePlanModules: (planId: string, moduleIds: string[]) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function usePlanModules(): UsePlanModulesReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar módulos de um plano específico
  const fetchPlanModules = useCallback(async (planId: string): Promise<string[]> => {
    if (!planId) return [];
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('plan_modules')
        .select('module_id')
        .eq('plan_id', planId);

      if (fetchError) throw fetchError;

      return (data || []).map(pm => pm.module_id);
    } catch (err: any) {
      console.error('Erro ao buscar módulos do plano:', err);
      setError(err.message || 'Erro ao carregar módulos');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Salvar módulos de um plano (delete + insert)
  const savePlanModules = useCallback(async (planId: string, moduleIds: string[]): Promise<boolean> => {
    if (!planId) return false;

    setLoading(true);
    setError(null);

    try {
      // 1. Deletar todos os registros antigos
      const { error: deleteError } = await supabase
        .from('plan_modules')
        .delete()
        .eq('plan_id', planId);

      if (deleteError) throw deleteError;

      // 2. Inserir novos registros (se houver módulos selecionados)
      if (moduleIds.length > 0) {
        const inserts = moduleIds.map(moduleId => ({
          plan_id: planId,
          module_id: moduleId,
        }));

        const { error: insertError } = await supabase
          .from('plan_modules')
          .insert(inserts);

        if (insertError) throw insertError;
      }

      return true;
    } catch (err: any) {
      console.error('Erro ao salvar módulos do plano:', err);
      setError(err.message || 'Erro ao salvar módulos');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchPlanModules,
    savePlanModules,
    loading,
    error,
  };
}
