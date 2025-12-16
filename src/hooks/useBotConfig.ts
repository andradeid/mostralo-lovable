import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateBotPromptPreview, BotPromptData } from "@/lib/botPromptGenerator";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

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

export function useBotConfig(storeId: string | null) {
  const { toast } = useToast();
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [promptData, setPromptData] = useState<BotPromptData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
        setConfig(data as unknown as BotConfig);
      } else {
        setConfig({ ...defaultBotConfig, store_id: storeId });
      }
    } catch (error) {
      setConfig({ ...defaultBotConfig, store_id: storeId });
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const fetchPromptPreview = useCallback(async (botName?: string) => {
    if (!storeId) return;

    try {
      const [storeResult, productsResult, categoriesResult] = await Promise.all([
        supabase.from('stores').select('name, description, address, whatsapp, slug').eq('id', storeId).single(),
        supabase.from('products').select('id, name, price, description, is_available').eq('store_id', storeId).eq('is_available', true),
        supabase.from('categories').select('id, name, is_active').eq('store_id', storeId).eq('is_active', true),
      ]);

      if (storeResult.data) {
        const preview = generateBotPromptPreview(
          storeResult.data,
          productsResult.data || [],
          categoriesResult.data || [],
          botName
        );
        setPromptData(preview);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Erro ao gerar preview do prompt:', error);
    }
  }, [storeId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Atualizar preview quando config carregar ou bot_name mudar
  useEffect(() => {
    if (config?.bot_name) {
      fetchPromptPreview(config.bot_name);
    }
  }, [config?.bot_name, fetchPromptPreview]);

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

  const updateConfig = (updates: Partial<BotConfig>) => {
    if (!config) return;
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    saveConfig(updates);
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
        await fetchConfig();
        return { success: true };
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
    updateConfig,
    syncWithEvolution,
    refreshPrompt: () => fetchPromptPreview(config?.bot_name),
    refetch: fetchConfig,
  };
}
