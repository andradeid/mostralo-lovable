import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateBotPromptPreview, BotPromptData, PromptSettings, PersonalitySettings } from "@/lib/botPromptGenerator";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

// Re-export types for convenience
export type { PromptSettings, PersonalitySettings } from "@/lib/botPromptGenerator";

const defaultPersonalitySettings: PersonalitySettings = {
  personality: 'friendly',
  emojiLevel: 'moderate',
  customGreeting: '',
};

export type BotModeType = 'chat_completion' | 'assistant';

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
  auto_reactivate_minutes: number; // NOVO: minutos para reativação automática (0 = manual)
  evolution_bot_id?: string;
  evolution_bot_status?: string;
  openai_creds_id?: string; // ID da credencial OpenAI na Evolution
  updated_at?: string; // Data da última atualização
  // Novos campos do Assistente Inteligente v2
  bot_mode: BotModeType;
  openai_assistant_id?: string;
  custom_prompt_instructions?: string;
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
  auto_reactivate_minutes: 0, // 0 = manual por padrão
  // Novos campos do Assistente Inteligente v2
  bot_mode: 'chat_completion',
  openai_assistant_id: undefined,
  custom_prompt_instructions: undefined,
};

const defaultPromptSettings: PromptSettings = {
  includeLocation: true,
  includeBusinessHours: true,
  includePaymentMethods: true,
  includeDeliveryFee: true,
  includeMinOrder: true,
  personalitySettings: defaultPersonalitySettings,
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
  const [hasOpenAIKey, setHasOpenAIKey] = useState<boolean | null>(null);
  const [productCount, setProductCount] = useState<number>(0);
  
  // Guardar config sincronizada para comparar
  const lastSyncedConfig = useRef<BotConfig | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      // Buscar loja e contar produtos em paralelo
      const [storeRes, productCountRes] = await Promise.all([
        supabase
          .from('stores')
          .select('openai_api_key')
          .eq('id', storeId)
          .single(),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('is_available', true),
      ]);
      
      setHasOpenAIKey(!!storeRes.data?.openai_api_key);
      setProductCount(productCountRes.count || 0);

      const { data, error } = await supabase
        .from('store_bot_config')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (data) {
        const dbData = data as any;
        // Mapear campos do banco para interface TypeScript
        const loadedConfig: BotConfig = {
          id: dbData.id,
          store_id: dbData.store_id,
          enabled: dbData.enabled ?? false,
          bot_name: dbData.bot_name ?? 'Assistente Virtual',
          stop_bot_from_me: dbData.stop_bot_from_me ?? true,
          listening_from_me: dbData.listening_from_me ?? false,
          delay_message: dbData.delay_message ?? 1500,
          expire_minutes: dbData.expire_minutes ?? 20,
          keyword_finish: dbData.keyword_finish ?? '#SAIR',
          unknown_message: dbData.unknown_message ?? '',
          keep_open: dbData.keep_open ?? false,
          debounce_time: dbData.debounce_time ?? 10,
          trigger_type: dbData.trigger_type ?? 'all',
          trigger_operator: dbData.trigger_operator ?? 'contains',
          trigger_value: dbData.trigger_value ?? '',
          ignore_jids: dbData.ignore_jids || [],
          split_messages: dbData.bot_split_messages ?? true,      // Mapeamento correto
          time_per_char: dbData.bot_time_per_char ?? 0,           // Mapeamento correto
          auto_reactivate_minutes: dbData.auto_reactivate_minutes ?? 0, // NOVO
          evolution_bot_id: dbData.evolution_bot_id,
          evolution_bot_status: dbData.evolution_bot_status,
          // Novos campos do Assistente Inteligente v2
          bot_mode: dbData.bot_mode ?? 'chat_completion',
          openai_assistant_id: dbData.openai_assistant_id,
          custom_prompt_instructions: dbData.custom_prompt_instructions,
        };
        setConfig(loadedConfig);
        lastSyncedConfig.current = { ...loadedConfig };
        setHasUnsyncedChanges(false);
        
        // Carregar promptSettings do banco (usando mesmo dbData já declarado)
        setPromptSettings({
          includeLocation: dbData.include_location ?? true,
          includeBusinessHours: dbData.include_business_hours ?? true,
          includePaymentMethods: dbData.include_payment_methods ?? true,
          includeDeliveryFee: dbData.include_delivery_fee ?? true,
          includeMinOrder: dbData.include_min_order ?? true,
          personalitySettings: {
            personality: dbData.personality ?? 'friendly',
            emojiLevel: dbData.emoji_level ?? 'moderate',
            customGreeting: dbData.custom_greeting ?? '',
          },
        });
      } else {
        const newConfig = { ...defaultBotConfig, store_id: storeId };
        setConfig(newConfig);
        lastSyncedConfig.current = null;
        setPromptSettings(defaultPromptSettings);
      }
    } catch (error) {
      const newConfig = { ...defaultBotConfig, store_id: storeId };
      setConfig(newConfig);
      lastSyncedConfig.current = null;
      setPromptSettings(defaultPromptSettings);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const fetchPromptPreview = useCallback(async (botName?: string, settings?: PromptSettings) => {
    if (!storeId) return;

    const currentSettings = settings || promptSettings;

    try {
      const [storeResult, productsResult, categoriesResult, configResult] = await Promise.all([
        supabase.from('stores').select(`
          name, description, address, whatsapp, slug,
          google_maps_link, business_hours, delivery_fee, min_order_value,
          accepts_cash, accepts_card, accepts_pix, city, state,
          custom_domain, custom_domain_verified
        `).eq('id', storeId).single(),
        supabase.from('products').select('id, name, price, description, is_available').eq('store_id', storeId).eq('is_available', true),
        supabase.from('categories').select('id, name, is_active').eq('store_id', storeId).eq('is_active', true),
        supabase.from('store_configurations').select('delivery_zones').eq('store_id', storeId).maybeSingle(),
      ]);

      if (storeResult.data) {
        // Enriquecer store com delivery_zones da configuração
        const storeWithZones = {
          ...storeResult.data,
          delivery_zones: configResult?.data?.delivery_zones as any[] || [],
        };
        const preview = generateBotPromptPreview(
          storeWithZones,
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

  const saveConfig = useDebouncedCallback(async (newConfig: Partial<BotConfig>, newPromptSettings?: PromptSettings) => {
    if (!storeId || !config) return;

    try {
      const updatedConfig = { ...config, ...newConfig };
      const settingsToSave = newPromptSettings || promptSettings;
      
      // Campos que requerem sincronização quando alterados
      const syncFields: (keyof BotConfig)[] = [
        'bot_name', 'stop_bot_from_me', 'listening_from_me', 'delay_message',
        'expire_minutes', 'keyword_finish', 'unknown_message', 'keep_open',
        'debounce_time', 'trigger_type', 'trigger_operator', 'trigger_value',
        'split_messages', 'time_per_char'
      ];
      
      // Verificar se algum campo que requer sync foi alterado
      const needsSync = config.id && config.enabled && syncFields.some(field => 
        newConfig[field] !== undefined && newConfig[field] !== config[field]
      );
      
      // Preparar dados com mapeamento correto dos nomes de campos
      const dataToSave: Record<string, unknown> = {
        store_id: updatedConfig.store_id,
        enabled: updatedConfig.enabled,
        bot_name: updatedConfig.bot_name,
        stop_bot_from_me: updatedConfig.stop_bot_from_me,
        listening_from_me: updatedConfig.listening_from_me,
        delay_message: updatedConfig.delay_message,
        expire_minutes: updatedConfig.expire_minutes,
        keyword_finish: updatedConfig.keyword_finish,
        unknown_message: updatedConfig.unknown_message,
        keep_open: updatedConfig.keep_open,
        debounce_time: updatedConfig.debounce_time,
        trigger_type: updatedConfig.trigger_type,
        trigger_operator: updatedConfig.trigger_operator,
        trigger_value: updatedConfig.trigger_value,
        ignore_jids: updatedConfig.ignore_jids,
        bot_split_messages: updatedConfig.split_messages,
        bot_time_per_char: updatedConfig.time_per_char,
        auto_reactivate_minutes: updatedConfig.auto_reactivate_minutes,
        evolution_bot_id: updatedConfig.evolution_bot_id,
        evolution_bot_status: updatedConfig.evolution_bot_status,
        updated_at: new Date().toISOString(),
        personality: settingsToSave.personalitySettings.personality,
        emoji_level: settingsToSave.personalitySettings.emojiLevel,
        custom_greeting: settingsToSave.personalitySettings.customGreeting,
        include_location: settingsToSave.includeLocation,
        include_business_hours: settingsToSave.includeBusinessHours,
        include_payment_methods: settingsToSave.includePaymentMethods,
        include_delivery_fee: settingsToSave.includeDeliveryFee,
        include_min_order: settingsToSave.includeMinOrder,
        // Campos do Assistente Inteligente v2
        bot_mode: updatedConfig.bot_mode,
        openai_assistant_id: updatedConfig.openai_assistant_id,
        custom_prompt_instructions: updatedConfig.custom_prompt_instructions,
      };
      
      // Marcar needs_sync se houve alteração em campos críticos
      if (needsSync) {
        dataToSave.needs_sync = true;
      }
      
      if (config.id) {
        await supabase
          .from('store_bot_config')
          .update(dataToSave)
          .eq('id', config.id);
      } else {
        const { data } = await supabase
          .from('store_bot_config')
          .insert({
            ...dataToSave,
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
    // Salvar no banco de dados
    saveConfig({}, newSettings);
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
      // Buscar instância com ID para salvar o vínculo no config
      const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name')
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

      // Persistir whatsapp_instance_id antes de sincronizar (garante que o cron sempre encontra)
      // Importante: NÃO marcar needs_sync=false aqui. O openai-bot-sync marca needs_sync=false apenas se a sync der certo.
      if (config.id && instance.id) {
        await supabase
          .from('store_bot_config')
          .update({ 
            whatsapp_instance_id: instance.id,
            ...(action === 'delete' ? {} : { needs_sync: true }),
          })
          .eq('id', config.id);
      }

      const response = await supabase.functions.invoke('openai-bot-sync', {
        body: {
          action,
          origin: window.location.origin,
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
            // Campos do Assistente Inteligente v2
            botMode: config.bot_mode,
            customPromptInstructions: config.custom_prompt_instructions,
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
    hasOpenAIKey,
    promptSettings,
    productCount,
    updateConfig,
    updatePromptSettings,
    syncWithEvolution,
    refreshPrompt: () => fetchPromptPreview(config?.bot_name, promptSettings),
    refetch: fetchConfig,
  };
}
