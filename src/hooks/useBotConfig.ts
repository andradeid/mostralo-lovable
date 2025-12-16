import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateBotPromptPreview, BotPromptData } from "@/lib/botPromptGenerator";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

export interface PromptSettings {
  includeLocation: boolean;
  includeBusinessHours: boolean;
  includePaymentMethods: boolean;
  includeDeliveryFee: boolean;
  includeMinOrder: boolean;
}

export interface BotConfig {
  id?: string;
  store_id: string;
  enabled: boolean;
  bot_name: string;
  stop_bot_from_me: boolean;
  listening_from_me: boolean;
  delay_message: number;
  expire_minutes: number;
  keyword_finish: string;
  unknown_message: string;
  keep_open: boolean;
  debounce_time: number;
  trigger_type: string;
  trigger_operator: string;
  trigger_value: string;
  ignore_jids: string[];
  split_messages: boolean;
  time_per_char: number;
  evolution_bot_id?: string;
  evolution_bot_status?: string;
}

const defaultBotConfig: Omit<BotConfig, 'store_id'> = {
  enabled: false,
  bot_name: 'Assistente Virtual',
  stop_bot_from_me: true,
  listening_from_me: false,
  delay_message: 1500,
  expire_minutes: 20,
  keyword_finish: '#SAIR',
  unknown_message: 'Desculpe, não entendi. Digite #SAIR para encerrar ou acesse nosso cardápio online.',
  keep_open: false,
  debounce_time: 10,
  trigger_type: 'all',
  trigger_operator: 'contains',
  trigger_value: '',
  ignore_jids: [],
  split_messages: true,
  time_per_char: 0,
};

const defaultPromptSettings: PromptSettings = {
  includeLocation: true,
  includeBusinessHours: true,
  includePaymentMethods: true,
  includeDeliveryFee: true,
  includeMinOrder: true,
};

export function useBotConfig(storeId: string | null) {
  const { toast } = useToast();
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [promptData, setPromptData] = useState<BotPromptData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [promptSettings, setPromptSettings] = useState<PromptSettings>(defaultPromptSettings);
  
  // Guardar config sincronizada para comparar
  const lastSyncedConfig = useRef<BotConfig | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_bot_config')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (data) {
        const loadedConfig = data as unknown as BotConfig;
        setConfig(loadedConfig);
        lastSyncedConfig.current = { ...loadedConfig };
        setHasUnsyncedChanges(false);
      } else {
        const newConfig = { ...defaultBotConfig, store_id: storeId };
        setConfig(newConfig);
        lastSyncedConfig.current = null;
      }
    } catch (error) {
      const newConfig = { ...defaultBotConfig, store_id: storeId };
      setConfig(newConfig);
      lastSyncedConfig.current = null;
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const fetchPromptPreview = useCallback(async (botName?: string, settings?: PromptSettings) => {
    if (!storeId) return;

    const currentSettings = settings || promptSettings;

    try {
      const [storeResult, productsResult, categoriesResult] = await Promise.all([
        supabase.from('stores').select(`
          name, description, address, whatsapp, slug,
          google_maps_link, business_hours, delivery_fee, min_order_value,
          accepts_cash, accepts_card, accepts_pix, city, state
        `).eq('id', storeId).single(),
        supabase.from('products').select('id, name, price, description, is_available').eq('store_id', storeId).eq('is_available', true),
        supabase.from('categories').select('id, name, is_active').eq('store_id', storeId).eq('is_active', true),
      ]);

      if (storeResult.data) {
        const preview = generateBotPromptPreview(
          storeResult.data,
          productsResult.data || [],
          categoriesResult.data || [],
          botName,
          currentSettings
        );
        setPromptData(preview);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Erro ao gerar preview do prompt:', error);
    }
  }, [storeId, promptSettings]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Atualizar preview quando config carregar ou bot_name mudar
  useEffect(() => {
    if (config?.bot_name) {
      fetchPromptPreview(config.bot_name, promptSettings);
    }
  }, [config?.bot_name, fetchPromptPreview, promptSettings]);

  // Detectar mudanças não sincronizadas
  const checkForUnsyncedChanges = useCallback((newConfig: BotConfig) => {
    if (!lastSyncedConfig.current) {
      // Se nunca sincronizou e está habilitado, há mudanças
      setHasUnsyncedChanges(newConfig.enabled);
      return;
    }
    
    // Campos que requerem sincronização quando alterados
    const syncFields: (keyof BotConfig)[] = [
      'bot_name', 'stop_bot_from_me', 'listening_from_me', 'delay_message',
      'expire_minutes', 'keyword_finish', 'unknown_message', 'keep_open',
      'debounce_time', 'trigger_type', 'trigger_operator', 'trigger_value',
      'split_messages', 'time_per_char'
    ];
    
    const hasChanges = syncFields.some(field => 
      newConfig[field] !== lastSyncedConfig.current?.[field]
    );
    
    setHasUnsyncedChanges(hasChanges && newConfig.enabled);
  }, []);

  const saveConfig = useDebouncedCallback(async (newConfig: Partial<BotConfig>) => {
    if (!storeId || !config) return;

    try {
      const updatedConfig = { ...config, ...newConfig };
      
      if (config.id) {
        await supabase
          .from('store_bot_config')
          .update({
            ...updatedConfig,
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id);
      } else {
        const { data } = await supabase
          .from('store_bot_config')
          .insert({
            ...updatedConfig,
            store_id: storeId,
          })
          .select()
          .single();

        if (data) {
          setConfig(data as unknown as BotConfig);
          return;
        }
      }

      setConfig(updatedConfig);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações do bot",
        variant: "destructive",
      });
    }
  }, 1000);

  const updatePromptSettings = (newSettings: PromptSettings) => {
    setPromptSettings(newSettings);
    if (config?.enabled) {
      setHasUnsyncedChanges(true);
    }
  };

  const updateConfig = (updates: Partial<BotConfig>) => {
    if (!config) return;
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    saveConfig(updates);
    checkForUnsyncedChanges(newConfig);
  };

  const syncWithEvolution = async (action: 'create' | 'update' | 'delete') => {
    if (!storeId || !config) return;

    setSyncing(true);
    try {
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('store_id', storeId)
        .single();

      if (!instance?.instance_name) {
        toast({
          title: "Instância não encontrada",
          description: "Conecte seu WhatsApp antes de ativar o bot",
          variant: "destructive",
        });
        return { success: false };
      }

      const response = await supabase.functions.invoke('openai-bot-sync', {
        body: {
          action,
          config: {
            storeId,
            instanceName: instance.instance_name,
            botName: config.bot_name,
            stopBotFromMe: config.stop_bot_from_me,
            listeningFromMe: config.listening_from_me,
            delayMessage: config.delay_message,
            expireMinutes: config.expire_minutes,
            keywordFinish: config.keyword_finish,
            unknownMessage: config.unknown_message,
            keepOpen: config.keep_open,
            debounceTime: config.debounce_time,
            triggerType: config.trigger_type,
            triggerOperator: config.trigger_operator,
            triggerValue: config.trigger_value,
            ignoreJids: config.ignore_jids,
            splitMessages: config.split_messages,
            timePerChar: config.time_per_char,
          },
        },
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        toast({
          title: action === 'delete' ? "Bot desativado" : "Bot sincronizado",
          description: response.data.message || "Operação realizada com sucesso!",
        });
        
        // Atualizar config sincronizada
        lastSyncedConfig.current = { ...config };
        setHasUnsyncedChanges(false);
        
        await fetchConfig();
        return { success: true, steps: response.data.steps };
      } else {
        throw new Error(response.data?.error || 'Falha na sincronização');
      }
    } catch (error: any) {
      toast({
        title: "Erro na sincronização",
        description: error.message || "Falha ao sincronizar bot com Evolution",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setSyncing(false);
    }
  };

  return {
    config,
    loading,
    syncing,
    promptData,
    lastUpdated,
    hasUnsyncedChanges,
    promptSettings,
    updateConfig,
    updatePromptSettings,
    syncWithEvolution,
    refreshPrompt: () => fetchPromptPreview(config?.bot_name, promptSettings),
    refetch: fetchConfig,
  };
}
