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
      console.log('[SignageDebug] 0. Iniciando fetchSignage, slug:', slug);
      
      if (!slug) {
        console.log('[SignageDebug] ERRO: Slug não fornecido');
        setError('Slug não fornecido');
        setLoading(false);
        return;
      }

      // Timeout de segurança - 10 segundos
      const timeoutId = setTimeout(() => {
        console.log('[SignageDebug] TIMEOUT: Query demorou mais de 10 segundos');
        setError('Tempo limite excedido. Tente novamente.');
        setLoading(false);
      }, 10000);

      try {
        console.log('[SignageDebug] 1. Buscando loja pelo slug:', slug);
        const startTime = performance.now();
        
        // Buscar loja pelo slug
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id, name, slug, logo_url')
          .eq('slug', slug)
          .eq('status', 'active')
          .single();

        console.log('[SignageDebug] 2. Query stores completou em', (performance.now() - startTime).toFixed(0), 'ms');
        console.log('[SignageDebug] 2. Resultado:', { storeData, storeError });

        if (storeError || !storeData) {
          clearTimeout(timeoutId);
          console.error('[SignageDebug] Erro ao buscar loja:', storeError);
          setError('Loja não encontrada');
          setLoading(false);
          return;
        }

        console.log('[SignageDebug] 3. Loja encontrada:', storeData.name);
        setStore(storeData);

        // Buscar configuração do painel
        console.log('[SignageDebug] 4. Buscando configuração do painel...');
        const configStart = performance.now();
        
        const { data: configData, error: configError } = await supabase
          .from('store_signage_config')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('is_enabled', true)
          .single();

        console.log('[SignageDebug] 5. Query config completou em', (performance.now() - configStart).toFixed(0), 'ms');
        console.log('[SignageDebug] 5. Resultado config:', { configData, configError });

        if (!configData) {
          clearTimeout(timeoutId);
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
        console.log('[SignageDebug] 6. Buscando config de senha...');
        const { data: passwordConfig } = await supabase
          .from('password_call_config')
          .select('*')
          .eq('store_id', storeData.id)
          .maybeSingle();

        console.log('[SignageDebug] 7. Password config:', passwordConfig ? 'encontrado' : 'não encontrado');

        if (passwordConfig) {
          setPasswordCallConfig(passwordConfig as PasswordCallConfig);
        }

        // Buscar itens ativos
        console.log('[SignageDebug] 8. Buscando itens do signage...');
        const itemsStart = performance.now();
        
        const { data: itemsData, error: itemsError } = await supabase
          .from('store_signage_items')
          .select('id, title, file_url, file_type, duration_seconds, sort_order')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        console.log('[SignageDebug] 9. Query items completou em', (performance.now() - itemsStart).toFixed(0), 'ms');
        console.log('[SignageDebug] 9. Items encontrados:', itemsData?.length || 0);

        if (itemsError) {
          clearTimeout(timeoutId);
          console.error('[SignageDebug] Erro ao buscar items:', itemsError);
          throw itemsError;
        }

        if (!itemsData || itemsData.length === 0) {
          clearTimeout(timeoutId);
          setError('Nenhum conteúdo disponível');
          setLoading(false);
          return;
        }

        setItems(itemsData.map(item => ({
          ...item,
          file_type: item.file_type as SignageItem['file_type']
        })));
        
        clearTimeout(timeoutId);
        console.log('[SignageDebug] 10. SUCESSO! Carregamento completo.');
        setLoading(false);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('[SignageDebug] ERRO GERAL:', err);
        setError('Erro ao carregar o painel');
        setLoading(false);
      }
    };

    fetchSignage();
  }, [slug]);

  return { store, items, config, passwordCallConfig, loading, error };
}
