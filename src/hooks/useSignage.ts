import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SignageItem {
  id: string;
  store_id: string;
  title: string;
  file_url: string;
  file_type: 'image' | 'video';
  duration_seconds: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SignageConfig {
  id: string;
  store_id: string;
  is_enabled: boolean;
  transition_type: 'fade' | 'slide' | 'none';
  transition_duration_ms: number;
  show_clock: boolean;
  clock_position: 'left' | 'center' | 'right';
  clock_size: 'small' | 'medium' | 'large';
  background_color: string;
  orientation: 'horizontal' | 'vertical';
  created_at: string;
  updated_at: string;
}

export function useSignage(storeId: string | null) {
  const [items, setItems] = useState<SignageItem[]>([]);
  const [config, setConfig] = useState<SignageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from('store_signage_items')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setItems((data || []) as SignageItem[]);
    } catch (error) {
      console.error('Erro ao buscar itens do signage:', error);
    }
  }, [storeId]);

  const fetchConfig = useCallback(async () => {
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from('store_signage_config')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setConfig(data as SignageConfig | null);
    } catch (error) {
      console.error('Erro ao buscar config do signage:', error);
    }
  }, [storeId]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchItems(), fetchConfig()]);
    setLoading(false);
  }, [fetchItems, fetchConfig]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addItem = async (item: Omit<SignageItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('store_signage_items')
        .insert(item);

      if (error) throw error;
      
      toast({ title: 'Mídia adicionada com sucesso!' });
      await fetchItems();
      return true;
    } catch (error: unknown) {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: 'Erro ao adicionar mídia',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return false;
    }
  };

  const updateItem = async (id: string, updates: Partial<SignageItem>) => {
    try {
      const { error } = await supabase
        .from('store_signage_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchItems();
      return true;
    } catch (error: unknown) {
      console.error('Erro ao atualizar item:', error);
      toast({
        title: 'Erro ao atualizar mídia',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteItem = async (id: string, fileUrl: string) => {
    try {
      // Deletar do storage
      const path = fileUrl.split('/signage-media/')[1];
      if (path) {
        await supabase.storage.from('signage-media').remove([path]);
      }

      // Deletar do banco
      const { error } = await supabase
        .from('store_signage_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Mídia removida com sucesso!' });
      await fetchItems();
      return true;
    } catch (error: unknown) {
      console.error('Erro ao deletar item:', error);
      toast({
        title: 'Erro ao remover mídia',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return false;
    }
  };

  const reorderItems = async (reorderedItems: SignageItem[]) => {
    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        sort_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('store_signage_items')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      setItems(reorderedItems.map((item, index) => ({ ...item, sort_order: index })));
      return true;
    } catch (error) {
      console.error('Erro ao reordenar itens:', error);
      return false;
    }
  };

  const updateConfig = async (updates: Partial<SignageConfig>) => {
    if (!storeId) return false;

    try {
      if (config) {
        const { error } = await supabase
          .from('store_signage_config')
          .update(updates)
          .eq('store_id', storeId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('store_signage_config')
          .insert({ store_id: storeId, ...updates });

        if (error) throw error;
      }

      toast({ title: 'Configurações salvas!' });
      await fetchConfig();
      return true;
    } catch (error: unknown) {
      console.error('Erro ao salvar config:', error);
      toast({
        title: 'Erro ao salvar configurações',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return false;
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!storeId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('signage-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('signage-media')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error: unknown) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro ao fazer upload',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      return null;
    }
  };

  return {
    items,
    config,
    loading,
    refetch,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    updateConfig,
    uploadFile
  };
}
