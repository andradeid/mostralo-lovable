import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PasswordCallConfig {
  id: string;
  store_id: string;
  is_enabled: boolean;
  call_type: 'password' | 'order' | 'table';
  template: 'classic' | 'modern' | 'minimalist' | 'festive' | 'corporate';
  show_history: boolean;
  history_count: number;
  highlight_duration_ms: number;
  sound_enabled: boolean;
  primary_color: string;
  // Campos de áudio
  audio_type: 'beep' | 'web_speech' | 'elevenlabs';
  voice_text_template: 'simple' | 'counter' | 'pickup';
  elevenlabs_voice_id: string | null;
  elevenlabs_api_key?: string | null; // Opcional - só presente quando lojista configura sua própria key
  has_own_api_key?: boolean; // Presente na view pública para indicar se lojista tem key própria
  // Campos de texto personalizado
  custom_text_enabled: boolean;
  custom_text_template: string | null;
  custom_prefix: string | null;
  custom_suffix: string | null;
  use_greeting: boolean;
  store_name_in_call: string | null;
  // Exibição no painel de pedidos
  show_in_orders_page: boolean;
  // Botão de chamar pedido real
  enable_order_call_button: boolean;
  created_at: string;
  updated_at: string;
}

export function usePasswordCallConfig(storeId: string | null) {
  const [config, setConfig] = useState<PasswordCallConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Buscar configuração
  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('password_call_config')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar config de senha:', error);
      } else {
        setConfig(data as PasswordCallConfig | null);
      }
      setLoading(false);
    };

    fetchConfig();
  }, [storeId]);

  // Salvar/atualizar configuração
  const saveConfig = useCallback(async (updates: Partial<PasswordCallConfig>) => {
    if (!storeId) return false;

    try {
      if (config) {
        // Update
        const { error } = await supabase
          .from('password_call_config')
          .update(updates)
          .eq('id', config.id);

        if (error) throw error;
        setConfig(prev => prev ? { ...prev, ...updates } : null);
      } else {
        // Insert
        const { data, error } = await supabase
          .from('password_call_config')
          .insert({ store_id: storeId, ...updates })
          .select()
          .single();

        if (error) throw error;
        setConfig(data as PasswordCallConfig);
      }

      toast({ title: 'Configurações salvas!' });
      return true;
    } catch (error) {
      console.error('Erro ao salvar config:', error);
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
      return false;
    }
  }, [storeId, config, toast]);

  return { config, loading, saveConfig };
}
