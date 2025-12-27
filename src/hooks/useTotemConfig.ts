import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TotemConfig {
  id: string;
  store_id: string;
  is_enabled: boolean;
  // Aparência
  orientation: 'horizontal' | 'vertical';
  theme_color: string;
  background_color: string;
  dark_mode: boolean;
  show_logo: boolean;
  logo_size: 'small' | 'medium' | 'large';
  // Tela Inicial
  welcome_title: string;
  welcome_subtitle: string;
  show_welcome_image: boolean;
  welcome_image_url: string | null;
  // Identificação
  allow_customer_identification: boolean;
  identification_type: 'none' | 'optional' | 'required';
  identification_fields: string[];
  // Produtos
  product_card_size: 'small' | 'medium' | 'large';
  show_product_description: boolean;
  show_product_images: boolean;
  categories_position: 'top' | 'left' | 'hidden';
  // Carrinho
  cart_position: 'bottom' | 'right' | 'floating';
  show_item_notes: boolean;
  // Pagamento
  payment_methods: string[];
  pix_timeout_seconds: number;
  // Senha/Pedido
  password_display_duration_seconds: number;
  show_order_summary_on_confirmation: boolean;
  auto_print_receipt: boolean;
  // Comportamento
  inactivity_timeout_seconds: number;
  inactivity_warning_seconds: number;
  // Timestamps
  created_at: string;
  updated_at: string;
}

const defaultConfig: Omit<TotemConfig, 'id' | 'store_id' | 'created_at' | 'updated_at'> = {
  is_enabled: true,
  orientation: 'vertical',
  theme_color: '#f97316',
  background_color: '#ffffff',
  dark_mode: false,
  show_logo: true,
  logo_size: 'medium',
  welcome_title: 'Bem-vindo!',
  welcome_subtitle: 'Toque para começar seu pedido',
  show_welcome_image: true,
  welcome_image_url: null,
  allow_customer_identification: true,
  identification_type: 'optional',
  identification_fields: ['phone'],
  product_card_size: 'medium',
  show_product_description: true,
  show_product_images: true,
  categories_position: 'top',
  cart_position: 'bottom',
  show_item_notes: true,
  payment_methods: ['pix'],
  pix_timeout_seconds: 300,
  password_display_duration_seconds: 15,
  show_order_summary_on_confirmation: true,
  auto_print_receipt: false,
  inactivity_timeout_seconds: 60,
  inactivity_warning_seconds: 30,
};

export function useTotemConfig(storeId: string | null) {
  const [config, setConfig] = useState<TotemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('store_totem_config')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data as TotemConfig);
      } else {
        setConfig(null);
      }
    } catch (error) {
      console.error('Erro ao buscar configuração do totem:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (updates: Partial<TotemConfig>): Promise<boolean> => {
    if (!storeId) return false;

    try {
      if (config) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('store_totem_config')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', config.id);

        if (error) throw error;

        setConfig(prev => prev ? { ...prev, ...updates } : null);
      } else {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('store_totem_config')
          .insert({ store_id: storeId, ...defaultConfig, ...updates })
          .select()
          .single();

        if (error) throw error;

        setConfig(data as TotemConfig);
      }

      toast({
        title: 'Configurações salvas',
        description: 'As configurações do totem foram atualizadas.',
      });

      return true;
    } catch (error) {
      console.error('Erro ao salvar configuração do totem:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const uploadWelcomeImage = async (file: File): Promise<string | null> => {
    if (!storeId) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeId}/totem-welcome.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('stores')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('stores')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar a imagem.',
        variant: 'destructive',
      });
      return null;
    }
  };

const initializeConfig = async (customColors?: { theme_color?: string; background_color?: string }): Promise<boolean> => {
    if (!storeId || config) return false;

    try {
      // Buscar cores da loja para usar como padrão
      let storeThemeColor = defaultConfig.theme_color;
      
      if (!customColors) {
        const { data: storeConfig } = await supabase
          .from('store_configurations')
          .select('primary_color')
          .eq('store_id', storeId)
          .maybeSingle();
        
        if (storeConfig?.primary_color) {
          storeThemeColor = storeConfig.primary_color;
        }
      }

      const configToInsert = {
        store_id: storeId,
        ...defaultConfig,
        theme_color: customColors?.theme_color || storeThemeColor,
        background_color: customColors?.background_color || defaultConfig.background_color
      };

      const { data, error } = await supabase
        .from('store_totem_config')
        .insert(configToInsert)
        .select()
        .single();

      if (error) throw error;

      setConfig(data as TotemConfig);
      return true;
    } catch (error) {
      console.error('Erro ao inicializar configuração:', error);
      return false;
    }
  };

  return {
    config,
    loading,
    updateConfig,
    uploadWelcomeImage,
    initializeConfig,
    refetch: fetchConfig,
  };
}
