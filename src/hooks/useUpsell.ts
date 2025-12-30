import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStoreModules } from './useStoreModules';

interface UpsellProduct {
  id: string;
  upsell_product_id: string;
  upsell_price: number | null;
  priority: number;
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
  };
}

interface UpsellStatistics {
  id: string;
  product_upsell_id: string;
  shown_count: number;
  accepted_count: number;
  rejected_count: number;
  revenue_generated: number;
}

export function useUpsell(storeId: string | null) {
  const [loading, setLoading] = useState(false);
  const [upsells, setUpsells] = useState<UpsellProduct[]>([]);
  const { hasModule, loading: modulesLoading } = useStoreModules(storeId);

  const hasAccess = hasModule('upsell');

  const fetchUpsells = useCallback(async (productId: string): Promise<UpsellProduct[]> => {
    if (!storeId || !hasAccess) return [];
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_upsells')
        .select(`
          id,
          upsell_product_id,
          upsell_price,
          priority,
          product:products!product_upsells_upsell_product_id_fkey (
            id,
            name,
            description,
            price,
            image_url
          )
        `)
        .eq('product_id', productId)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .limit(3);

      if (error) throw error;

      const validUpsells = (data || []).filter(u => u.product) as UpsellProduct[];
      setUpsells(validUpsells);
      return validUpsells;
    } catch (err) {
      console.error('Erro ao buscar upsells:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [storeId, hasAccess]);

  const recordImpression = useCallback(async (upsellId: string) => {
    if (!storeId) return;
    
    try {
      // Verificar se já existe estatística
      const { data: existing } = await supabase
        .from('upsell_statistics')
        .select('id, shown_count')
        .eq('product_upsell_id', upsellId)
        .single();

      if (existing) {
        await supabase
          .from('upsell_statistics')
          .update({ shown_count: existing.shown_count + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('upsell_statistics')
          .insert({
            store_id: storeId,
            product_upsell_id: upsellId,
            shown_count: 1
          });
      }
    } catch (err) {
      console.error('Erro ao registrar impressão de upsell:', err);
    }
  }, [storeId]);

  const recordAccepted = useCallback(async (upsellId: string, revenue: number) => {
    if (!storeId) return;
    
    try {
      const { data: existing } = await supabase
        .from('upsell_statistics')
        .select('id, accepted_count, revenue_generated')
        .eq('product_upsell_id', upsellId)
        .single();

      if (existing) {
        await supabase
          .from('upsell_statistics')
          .update({ 
            accepted_count: existing.accepted_count + 1,
            revenue_generated: existing.revenue_generated + revenue
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('upsell_statistics')
          .insert({
            store_id: storeId,
            product_upsell_id: upsellId,
            accepted_count: 1,
            revenue_generated: revenue
          });
      }
    } catch (err) {
      console.error('Erro ao registrar aceitação de upsell:', err);
    }
  }, [storeId]);

  const recordRejected = useCallback(async (upsellId: string) => {
    if (!storeId) return;
    
    try {
      const { data: existing } = await supabase
        .from('upsell_statistics')
        .select('id, rejected_count')
        .eq('product_upsell_id', upsellId)
        .single();

      if (existing) {
        await supabase
          .from('upsell_statistics')
          .update({ rejected_count: existing.rejected_count + 1 })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('upsell_statistics')
          .insert({
            store_id: storeId,
            product_upsell_id: upsellId,
            rejected_count: 1
          });
      }
    } catch (err) {
      console.error('Erro ao registrar rejeição de upsell:', err);
    }
  }, [storeId]);

  // Funções para gerenciar upsells (admin)
  const saveUpsells = useCallback(async (
    productId: string, 
    upsellConfigs: { productId: string; price: number | null; priority: number }[]
  ) => {
    if (!storeId) return false;

    try {
      // Remover upsells existentes
      await supabase
        .from('product_upsells')
        .delete()
        .eq('product_id', productId)
        .eq('store_id', storeId);

      // Inserir novos upsells
      if (upsellConfigs.length > 0) {
        const inserts = upsellConfigs.map((config, index) => ({
          store_id: storeId,
          product_id: productId,
          upsell_product_id: config.productId,
          upsell_price: config.price,
          priority: config.priority || index + 1,
          is_active: true
        }));

        const { error } = await supabase
          .from('product_upsells')
          .insert(inserts);

        if (error) throw error;
      }

      return true;
    } catch (err) {
      console.error('Erro ao salvar upsells:', err);
      return false;
    }
  }, [storeId]);

  const getProductUpsells = useCallback(async (productId: string) => {
    if (!storeId) return [];

    try {
      const { data, error } = await supabase
        .from('product_upsells')
        .select(`
          id,
          upsell_product_id,
          upsell_price,
          priority,
          product:products!product_upsells_upsell_product_id_fkey (
            id,
            name,
            price,
            image_url
          )
        `)
        .eq('product_id', productId)
        .eq('store_id', storeId)
        .order('priority');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar upsells do produto:', err);
      return [];
    }
  }, [storeId]);

  return {
    loading,
    upsells,
    hasAccess,
    modulesLoading,
    fetchUpsells,
    recordImpression,
    recordAccepted,
    recordRejected,
    saveUpsells,
    getProductUpsells
  };
}
