import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PasswordCallConfig } from './usePasswordCallConfig';

export interface SignageItem {
  id: string;
  title: string;
  file_url: string;
  file_type: 'image' | 'video';
  duration_seconds: number;
  sort_order: number;
}

export interface SignageConfig {
  is_enabled: boolean;
  transition_type: 'fade' | 'slide' | 'none';
  transition_duration_ms: number;
  show_clock: boolean;
  clock_position: 'left' | 'center' | 'right';
  clock_size: 'small' | 'medium' | 'large';
  background_color: string;
  orientation: 'horizontal' | 'vertical';
}

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export function usePublicSignage(slug: string | undefined) {
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [items, setItems] = useState<SignageItem[]>([]);
  const [config, setConfig] = useState<SignageConfig | null>(null);
  const [passwordCallConfig, setPasswordCallConfig] = useState<PasswordCallConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignage = async () => {
      if (!slug) {
        setError('Slug não fornecido');
        setLoading(false);
        return;
      }

      try {
        // Buscar loja pelo slug
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id, name, slug, logo_url')
          .eq('slug', slug)
          .eq('status', 'active')
          .single();

        if (storeError || !storeData) {
          setError('Loja não encontrada');
          setLoading(false);
          return;
        }

        setStore(storeData);

        // Buscar configuração do painel
        const { data: configData } = await supabase
          .from('store_signage_config')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('is_enabled', true)
          .single();

        if (!configData) {
          setError('Painel não está ativo');
          setLoading(false);
          return;
        }

        setConfig({
          is_enabled: configData.is_enabled,
          transition_type: configData.transition_type as SignageConfig['transition_type'],
          transition_duration_ms: configData.transition_duration_ms,
          show_clock: configData.show_clock,
          clock_position: (configData.clock_position as SignageConfig['clock_position']) || 'right',
          clock_size: (configData.clock_size as SignageConfig['clock_size']) || 'medium',
          background_color: configData.background_color,
          orientation: (configData.orientation as SignageConfig['orientation']) || 'horizontal'
        });

        // Buscar configuração de chamada de senha
        const { data: passwordConfig } = await supabase
          .from('password_call_config')
          .select('*')
          .eq('store_id', storeData.id)
          .maybeSingle();

        if (passwordConfig) {
          setPasswordCallConfig(passwordConfig as PasswordCallConfig);
        }

        // Buscar itens ativos
        const { data: itemsData, error: itemsError } = await supabase
          .from('store_signage_items')
          .select('id, title, file_url, file_type, duration_seconds, sort_order')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (itemsError) throw itemsError;

        if (!itemsData || itemsData.length === 0) {
          setError('Nenhum conteúdo disponível');
          setLoading(false);
          return;
        }

        setItems(itemsData.map(item => ({
          ...item,
          file_type: item.file_type as SignageItem['file_type']
        })));
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar signage:', err);
        setError('Erro ao carregar o painel');
        setLoading(false);
      }
    };

    fetchSignage();
  }, [slug]);

  return { store, items, config, passwordCallConfig, loading, error };
}
