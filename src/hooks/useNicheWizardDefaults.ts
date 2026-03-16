import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Busca as configurações de nicho da loja para pré-preencher o Wizard.
 * Retorna prompt_base, enabled_tools, max_products_per_response, etc.
 */
export function useNicheWizardDefaults(storeId: string | null) {
  return useQuery({
    queryKey: ['niche-wizard-defaults', storeId],
    enabled: !!storeId,
    queryFn: async () => {
      if (!storeId) return null;

      // 1. Buscar niche_id da loja
      const { data: store } = await supabase
        .from('stores')
        .select('niche_id')
        .eq('id', storeId)
        .single();

      if (!store?.niche_id) return null;

      // 2. Buscar nome do nicho
      const { data: niche } = await (supabase as any)
        .from('niches')
        .select('id, name')
        .eq('id', store.niche_id)
        .single();

      // 3. Buscar config de IA do nicho (priorizar modo 'assistant')
      const { data: configs } = await (supabase as any)
        .from('niche_ai_configs')
        .select('*, niche_ai_rules(id, name, rule_type, is_enabled)')
        .eq('niche_id', store.niche_id)
        .limit(1);

      const config = configs?.[0] || null;

      return {
        nicheId: store.niche_id,
        nicheName: niche?.name || 'Desconhecido',
        promptBase: config?.prompt_base || null,
        enabledTools: config?.enabled_tools || null,
        maxProductsPerResponse: config?.max_products_per_response || null,
        visionEnabled: config?.vision_enabled || false,
        rules: config?.niche_ai_rules || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
