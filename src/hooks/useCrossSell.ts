import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStoreModules } from './useStoreModules';

interface CrossSellProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  discountPercentage?: number;
  ruleId?: string;
}

interface CrossSellRule {
  id: string;
  trigger_category_id: string;
  suggest_category_id: string;
  priority: number;
  max_suggestions: number;
  discount_percentage: number | null;
  is_active: boolean;
  trigger_category?: { name: string };
  suggest_category?: { name: string };
}

interface CartItem {
  category_id?: string | null;
  product_id?: string;
}

export function useCrossSell(storeId: string | null) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CrossSellProduct[]>([]);
  const { hasModule } = useStoreModules(storeId);

  const hasAccess = hasModule('upsell');

  const fetchSuggestions = useCallback(async (cartItems: CartItem[]): Promise<CrossSellProduct[]> => {
    if (!storeId || !hasAccess || cartItems.length === 0) return [];
    
    setLoading(true);
    try {
      // Extrair category_ids dos itens do carrinho
      const cartCategoryIds = cartItems
        .map(item => item.category_id)
        .filter((id): id is string => !!id);

      if (cartCategoryIds.length === 0) return [];

      // Buscar regras de cross-sell aplicáveis
      const { data: rules, error: rulesError } = await supabase
        .from('category_crosssell_rules')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .in('trigger_category_id', cartCategoryIds)
        .order('priority', { ascending: true });

      if (rulesError) throw rulesError;
      if (!rules || rules.length === 0) return [];

      // Pegar categorias únicas para sugerir (excluindo as que já estão no carrinho)
      const suggestCategoryIds = [...new Set(rules.map(r => r.suggest_category_id))]
        .filter(id => !cartCategoryIds.includes(id));

      if (suggestCategoryIds.length === 0) return [];

      // Buscar produtos das categorias sugeridas
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, category_id')
        .eq('store_id', storeId)
        .eq('is_available', true)
        .in('category_id', suggestCategoryIds)
        .limit(10);

      if (productsError) throw productsError;

      // Mapear produtos com informações de desconto da regra
      const suggestedProducts: CrossSellProduct[] = (products || []).map(product => {
        const rule = rules.find(r => r.suggest_category_id === product.category_id);
        return {
          ...product,
          discountPercentage: rule?.discount_percentage || undefined,
          ruleId: rule?.id
        };
      });

      // Limitar por max_suggestions de cada regra
      const limitedProducts = suggestedProducts.slice(0, 6);
      
      setSuggestions(limitedProducts);
      return limitedProducts;
    } catch (err) {
      console.error('Erro ao buscar sugestões de cross-sell:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [storeId, hasAccess]);

  const recordImpression = useCallback(async (ruleId: string) => {
    if (!storeId) return;
    
    try {
      const { data: existing } = await supabase
        .from('crosssell_statistics')
        .select('id, shown_count')
        .eq('rule_id', ruleId)
        .single();

      if (existing) {
        await supabase
          .from('crosssell_statistics')
          .update({ shown_count: existing.shown_count + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('crosssell_statistics')
          .insert({
            store_id: storeId,
            rule_id: ruleId,
            shown_count: 1
          });
      }
    } catch (err) {
      console.error('Erro ao registrar impressão de cross-sell:', err);
    }
  }, [storeId]);

  const recordAccepted = useCallback(async (ruleId: string, revenue: number) => {
    if (!storeId) return;
    
    try {
      const { data: existing } = await supabase
        .from('crosssell_statistics')
        .select('id, accepted_count, revenue_generated')
        .eq('rule_id', ruleId)
        .single();

      if (existing) {
        await supabase
          .from('crosssell_statistics')
          .update({ 
            accepted_count: existing.accepted_count + 1,
            revenue_generated: existing.revenue_generated + revenue
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('crosssell_statistics')
          .insert({
            store_id: storeId,
            rule_id: ruleId,
            accepted_count: 1,
            revenue_generated: revenue
          });
      }
    } catch (err) {
      console.error('Erro ao registrar aceitação de cross-sell:', err);
    }
  }, [storeId]);

  const recordRejected = useCallback(async (ruleId: string) => {
    if (!storeId) return;
    
    try {
      const { data: existing } = await supabase
        .from('crosssell_statistics')
        .select('id, rejected_count')
        .eq('rule_id', ruleId)
        .single();

      if (existing) {
        await supabase
          .from('crosssell_statistics')
          .update({ rejected_count: existing.rejected_count + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('crosssell_statistics')
          .insert({
            store_id: storeId,
            rule_id: ruleId,
            rejected_count: 1
          });
      }
    } catch (err) {
      console.error('Erro ao registrar rejeição de cross-sell:', err);
    }
  }, [storeId]);

  // Funções para gerenciar regras (admin)
  const fetchRules = useCallback(async (): Promise<CrossSellRule[]> => {
    if (!storeId) return [];

    try {
      const { data, error } = await supabase
        .from('category_crosssell_rules')
        .select(`
          *,
          trigger_category:categories!category_crosssell_rules_trigger_category_id_fkey (name),
          suggest_category:categories!category_crosssell_rules_suggest_category_id_fkey (name)
        `)
        .eq('store_id', storeId)
        .order('priority');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar regras de cross-sell:', err);
      return [];
    }
  }, [storeId]);

  const createRule = useCallback(async (rule: Omit<CrossSellRule, 'id'>) => {
    if (!storeId) return null;

    try {
      const { data, error } = await supabase
        .from('category_crosssell_rules')
        .insert({
          store_id: storeId,
          trigger_category_id: rule.trigger_category_id,
          suggest_category_id: rule.suggest_category_id,
          priority: rule.priority,
          max_suggestions: rule.max_suggestions,
          discount_percentage: rule.discount_percentage,
          is_active: rule.is_active
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao criar regra de cross-sell:', err);
      return null;
    }
  }, [storeId]);

  const updateRule = useCallback(async (ruleId: string, updates: Partial<CrossSellRule>) => {
    try {
      const { error } = await supabase
        .from('category_crosssell_rules')
        .update(updates)
        .eq('id', ruleId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao atualizar regra de cross-sell:', err);
      return false;
    }
  }, []);

  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('category_crosssell_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao excluir regra de cross-sell:', err);
      return false;
    }
  }, []);

  return {
    loading,
    suggestions,
    hasAccess,
    fetchSuggestions,
    recordImpression,
    recordAccepted,
    recordRejected,
    fetchRules,
    createRule,
    updateRule,
    deleteRule
  };
}
