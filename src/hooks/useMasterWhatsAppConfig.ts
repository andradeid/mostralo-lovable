import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

// Interface para detalhes de erro de sincronização
export interface SyncErrorDetails {
  status: number | null;
  message: string;
  payload: {
    configId: string;
    botType?: 'sales' | 'recruitment' | 'support';
  };
  responseData: any;
  timestamp: string;
}

export type SalesApproach = 'basic' | 'intermediate' | 'aggressive';
export type RecruitmentApproach = 'cold_lead' | 'moderate' | 'aggressive' | 'super_aggressive';

// Interface para configuração de comportamento de cada bot
export interface BotBehaviorConfig {
  delay_message: number;
  expire_minutes: number;
  keyword_finish: string;
  stop_bot_from_me: boolean;
  listening_from_me: boolean;
  keep_open: boolean;
  debounce_time: number;
  split_messages: boolean;
  time_per_char: number;
  unknown_message: string;
  auto_reactivate_minutes: number;
}

export type PrimaryBotType = 'sales' | 'recruitment' | 'support';

export interface MasterWhatsAppConfig {
  id: string;
  admin_user_id: string;
  instance_name: string | null;
  instance_status: string;
  instance_phone: string | null;
  evolution_instance_id: string | null;
  // Bot Principal
  primary_bot_type: PrimaryBotType;
  // Bot de Vendas
  sales_bot_enabled: boolean;
  sales_bot_approach: SalesApproach;
  sales_bot_keywords: string[];
  sales_bot_evolution_id: string | null;
  sales_bot_delay_message: number;
  sales_bot_expire_minutes: number;
  sales_bot_keyword_finish: string;
  sales_bot_stop_from_me: boolean;
  sales_bot_listening_from_me: boolean;
  sales_bot_keep_open: boolean;
  sales_bot_debounce_time: number;
  sales_bot_split_messages: boolean;
  sales_bot_time_per_char: number;
  sales_bot_unknown_message: string;
  sales_bot_auto_reactivate_minutes: number;
  // Bot de Recrutamento
  recruitment_bot_enabled: boolean;
  recruitment_bot_approach: RecruitmentApproach;
  recruitment_bot_keywords: string[];
  recruitment_bot_evolution_id: string | null;
  recruitment_bot_delay_message: number;
  recruitment_bot_expire_minutes: number;
  recruitment_bot_keyword_finish: string;
  recruitment_bot_stop_from_me: boolean;
  recruitment_bot_listening_from_me: boolean;
  recruitment_bot_keep_open: boolean;
  recruitment_bot_debounce_time: number;
  recruitment_bot_split_messages: boolean;
  recruitment_bot_time_per_char: number;
  recruitment_bot_unknown_message: string;
  recruitment_bot_auto_reactivate_minutes: number;
  // Bot de Suporte
  support_bot_enabled: boolean;
  support_bot_keywords: string[];
  support_bot_evolution_id: string | null;
  support_bot_custom_prompt: string | null;
  support_bot_delay_message: number;
  support_bot_expire_minutes: number;
  support_bot_keyword_finish: string;
  support_bot_stop_from_me: boolean;
  support_bot_listening_from_me: boolean;
  support_bot_keep_open: boolean;
  support_bot_debounce_time: number;
  support_bot_split_messages: boolean;
  support_bot_time_per_char: number;
  support_bot_unknown_message: string;
  support_bot_auto_reactivate_minutes: number;
  // Notificações
  notification_phone: string | null;
  notification_country_code: string | null;
  notify_new_lead: boolean;
  notify_new_store: boolean;
  notify_new_seller: boolean;
  notify_new_order: boolean;
  notify_payment_received: boolean;
  notify_instance_disconnected: boolean;
  notify_daily_summary: boolean;
  // OpenAI
  openai_api_key: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface MasterWhatsAppSession {
  id: string;
  config_id: string;
  phone_number: string;
  contact_name: string | null;
  active_bot_type: 'sales' | 'recruitment' | 'support' | null;
  bot_paused: boolean;
  paused_at: string | null;
  paused_reason: string | null;
  last_message_at: string;
  messages_count: number;
  created_at: string;
}

// Helper para extrair config de comportamento de um bot específico
export function getBotBehaviorConfig(
  config: MasterWhatsAppConfig,
  botType: 'sales' | 'recruitment' | 'support'
): BotBehaviorConfig {
  const prefix = `${botType}_bot_`;
  return {
    delay_message: (config as any)[`${prefix}delay_message`] ?? 1500,
    expire_minutes: (config as any)[`${prefix}expire_minutes`] ?? 60,
    keyword_finish: (config as any)[`${prefix}keyword_finish`] ?? '#sair',
    stop_bot_from_me: (config as any)[`${prefix}stop_from_me`] ?? true,
    listening_from_me: (config as any)[`${prefix}listening_from_me`] ?? false,
    keep_open: (config as any)[`${prefix}keep_open`] ?? false,
    debounce_time: (config as any)[`${prefix}debounce_time`] ?? 3,
    split_messages: (config as any)[`${prefix}split_messages`] ?? true,
    time_per_char: (config as any)[`${prefix}time_per_char`] ?? 50,
    unknown_message: (config as any)[`${prefix}unknown_message`] ?? 'Desculpe, não entendi. Pode reformular?',
    auto_reactivate_minutes: (config as any)[`${prefix}auto_reactivate_minutes`] ?? 0,
  };
}

// Interface para rastrear última config sincronizada
interface LastSyncedState {
  sales: { approach: string; keywords: string[]; enabled: boolean } | null;
  recruitment: { approach: string; keywords: string[]; enabled: boolean } | null;
  support: { customPrompt: string | null; keywords: string[]; enabled: boolean } | null;
}

export function useMasterWhatsAppConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<MasterWhatsAppConfig | null>(null);
  const [sessions, setSessions] = useState<MasterWhatsAppSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<SyncErrorDetails | null>(null);
  const [lastSyncedState, setLastSyncedState] = useState<LastSyncedState>({
    sales: null,
    recruitment: null,
    support: null
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<{
    sales: string | null;
    recruitment: string | null;
    support: string | null;
  }>({ sales: null, recruitment: null, support: null });

  const clearSyncError = () => setSyncError(null);

  // Buscar ou criar configuração
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      try {
        // Buscar config existente
        const { data, error } = await supabase
          .from('master_whatsapp_config')
          .select('*')
          .eq('admin_user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar config:', error);
          throw error;
        }

        if (data) {
          setConfig(data as unknown as MasterWhatsAppConfig);
        } else {
          // Criar config padrão
          const { data: newConfig, error: insertError } = await supabase
            .from('master_whatsapp_config')
            .insert({ admin_user_id: user.id })
            .select()
            .single();

          if (insertError) throw insertError;
          setConfig(newConfig as unknown as MasterWhatsAppConfig);
        }
      } catch (error) {
        console.error('Erro:', error);
        toast.error('Erro ao carregar configuração');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [user]);

  // Buscar sessões
  useEffect(() => {
    if (!config?.id) return;

    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('master_whatsapp_sessions')
        .select('*')
        .eq('config_id', config.id)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar sessões:', error);
        return;
      }

      setSessions(data as unknown as MasterWhatsAppSession[]);
    };

    fetchSessions();

    // Real-time
    const channel = supabase
      .channel('master-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'master_whatsapp_sessions',
          filter: `config_id=eq.${config.id}`
        },
        () => fetchSessions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config?.id]);

  // Atualizar configuração
  const updateConfig = async (updates: Partial<MasterWhatsAppConfig>) => {
    if (!config?.id) return false;

    try {
      const { error } = await supabase
        .from('master_whatsapp_config')
        .update(updates)
        .eq('id', config.id);

      if (error) throw error;

      setConfig(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao salvar configuração');
      return false;
    }
  };

  // Atualizar configuração de comportamento de um bot específico
  const updateBotBehavior = async (
    botType: 'sales' | 'recruitment' | 'support',
    updates: Partial<BotBehaviorConfig>
  ) => {
    const prefix = `${botType}_bot_`;
    const mappedUpdates: Record<string, any> = {};
    
    if (updates.delay_message !== undefined) mappedUpdates[`${prefix}delay_message`] = updates.delay_message;
    if (updates.expire_minutes !== undefined) mappedUpdates[`${prefix}expire_minutes`] = updates.expire_minutes;
    if (updates.keyword_finish !== undefined) mappedUpdates[`${prefix}keyword_finish`] = updates.keyword_finish;
    if (updates.stop_bot_from_me !== undefined) mappedUpdates[`${prefix}stop_from_me`] = updates.stop_bot_from_me;
    if (updates.listening_from_me !== undefined) mappedUpdates[`${prefix}listening_from_me`] = updates.listening_from_me;
    if (updates.keep_open !== undefined) mappedUpdates[`${prefix}keep_open`] = updates.keep_open;
    if (updates.debounce_time !== undefined) mappedUpdates[`${prefix}debounce_time`] = updates.debounce_time;
    if (updates.split_messages !== undefined) mappedUpdates[`${prefix}split_messages`] = updates.split_messages;
    if (updates.time_per_char !== undefined) mappedUpdates[`${prefix}time_per_char`] = updates.time_per_char;
    if (updates.unknown_message !== undefined) mappedUpdates[`${prefix}unknown_message`] = updates.unknown_message;
    if (updates.auto_reactivate_minutes !== undefined) mappedUpdates[`${prefix}auto_reactivate_minutes`] = updates.auto_reactivate_minutes;

    return updateConfig(mappedUpdates as Partial<MasterWhatsAppConfig>);
  };

  // Sincronizar bots com Evolution API
  const syncBots = async (botType?: 'sales' | 'recruitment' | 'support') => {
    if (!config?.id || !config.instance_name) {
      toast.error('Configure a instância WhatsApp primeiro');
      return false;
    }

    setSyncing(true);
    clearSyncError();
    
    const payload = { configId: config.id, botType };
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('master-bot-sync', {
        body: payload
      });

      // Capturar detalhes do erro se houver
      if (response.error) {
        const errorDetails: SyncErrorDetails = {
          status: null,
          message: response.error.message || 'Erro desconhecido',
          payload,
          responseData: response.error,
          timestamp: new Date().toISOString()
        };
        setSyncError(errorDetails);
        toast.error('Erro ao sincronizar bots. Clique para ver detalhes.', {
          action: {
            label: 'Ver detalhes',
            onClick: () => {} // O modal será aberto via estado
          }
        });
        return false;
      }

      // Verificar se a resposta indica erro no nível superior
      if (response.data && response.data.success === false) {
        const errorDetails: SyncErrorDetails = {
          status: 500,
          message: response.data.error || 'Erro retornado pela edge function',
          payload,
          responseData: response.data,
          timestamp: new Date().toISOString()
        };
        setSyncError(errorDetails);
        toast.error('Erro ao sincronizar bots. Clique para ver detalhes.');
        return false;
      }

      // Verificar erros nos resultados individuais dos bots
      if (response.data?.results) {
        const botErrors = Object.entries(response.data.results)
          .filter(([_, result]: [string, any]) => result.success === false && result.error !== 'Bot disabled')
          .map(([botType, result]: [string, any]) => `${botType}: ${result.error}`);
        
        if (botErrors.length > 0) {
          const errorDetails: SyncErrorDetails = {
            status: 500,
            message: botErrors.join('\n'),
            payload,
            responseData: response.data,
            timestamp: new Date().toISOString()
          };
          setSyncError(errorDetails);
          toast.error(`Falha em ${botErrors.length} bot(s). Clique para ver detalhes.`);
          return false;
        }
      }

      const { results } = response.data;
      const now = new Date().toISOString();
      
      // Atualizar IDs dos bots
      const updates: Partial<MasterWhatsAppConfig> = {};
      
      if (results?.sales?.botId) {
        updates.sales_bot_evolution_id = results.sales.botId;
      }
      if (results?.recruitment?.botId) {
        updates.recruitment_bot_evolution_id = results.recruitment.botId;
      }
      if (results?.support?.botId) {
        updates.support_bot_evolution_id = results.support.botId;
      }

      if (Object.keys(updates).length > 0) {
        setConfig(prev => prev ? { ...prev, ...updates } : null);
      }

      // Salvar estado sincronizado para detectar mudanças futuras
      const botsToUpdate = botType ? [botType] : ['sales', 'recruitment', 'support'] as const;
      setLastSyncedState(prev => {
        const newState = { ...prev };
        for (const bt of botsToUpdate) {
          if (bt === 'sales') {
            newState.sales = {
              approach: config.sales_bot_approach,
              keywords: [...config.sales_bot_keywords],
              enabled: config.sales_bot_enabled
            };
          } else if (bt === 'recruitment') {
            newState.recruitment = {
              approach: config.recruitment_bot_approach,
              keywords: [...config.recruitment_bot_keywords],
              enabled: config.recruitment_bot_enabled
            };
          } else if (bt === 'support') {
            newState.support = {
              customPrompt: config.support_bot_custom_prompt,
              keywords: [...config.support_bot_keywords],
              enabled: config.support_bot_enabled
            };
          }
        }
        return newState;
      });

      setLastSyncedAt(prev => {
        const newAt = { ...prev };
        for (const bt of botsToUpdate) {
          newAt[bt] = now;
        }
        return newAt;
      });

      toast.success('Bots sincronizados com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao sincronizar:', error);
      
      const errorDetails: SyncErrorDetails = {
        status: error?.status || null,
        message: error?.message || 'Erro de conexão',
        payload,
        responseData: error,
        timestamp: new Date().toISOString()
      };
      setSyncError(errorDetails);
      toast.error('Erro ao sincronizar bots');
      return false;
    } finally {
      setSyncing(false);
    }
  };

  // Detectar se há mudanças não sincronizadas
  const hasUnsyncedChanges = (botType: 'sales' | 'recruitment' | 'support'): boolean => {
    if (!config) return false;
    
    const lastState = lastSyncedState[botType];
    if (!lastState) return true; // Nunca sincronizado
    
    if (botType === 'sales') {
      const salesState = lastState as { approach: string; keywords: string[]; enabled: boolean };
      return (
        config.sales_bot_approach !== salesState.approach ||
        JSON.stringify(config.sales_bot_keywords) !== JSON.stringify(salesState.keywords) ||
        config.sales_bot_enabled !== salesState.enabled
      );
    }
    
    if (botType === 'recruitment') {
      const recruitState = lastState as { approach: string; keywords: string[]; enabled: boolean };
      return (
        config.recruitment_bot_approach !== recruitState.approach ||
        JSON.stringify(config.recruitment_bot_keywords) !== JSON.stringify(recruitState.keywords) ||
        config.recruitment_bot_enabled !== recruitState.enabled
      );
    }
    
    if (botType === 'support') {
      const supportState = lastState as { customPrompt: string | null; keywords: string[]; enabled: boolean };
      return (
        config.support_bot_custom_prompt !== supportState.customPrompt ||
        JSON.stringify(config.support_bot_keywords) !== JSON.stringify(supportState.keywords) ||
        config.support_bot_enabled !== supportState.enabled
      );
    }
    
    return false;
  };

  // Toggle bot
  const toggleBot = async (botType: 'sales' | 'recruitment' | 'support', enabled: boolean) => {
    const field = `${botType}_bot_enabled` as keyof MasterWhatsAppConfig;
    const success = await updateConfig({ [field]: enabled } as Partial<MasterWhatsAppConfig>);
    
    if (success) {
      toast.success(`Bot de ${getBotLabel(botType)} ${enabled ? 'ativado' : 'desativado'}`);
    }
    
    return success;
  };

  // Atualizar abordagem
  const updateApproach = async (
    botType: 'sales' | 'recruitment', 
    approach: SalesApproach | RecruitmentApproach
  ) => {
    const field = `${botType}_bot_approach` as keyof MasterWhatsAppConfig;
    return updateConfig({ [field]: approach } as Partial<MasterWhatsAppConfig>);
  };

  // Atualizar keywords
  const updateKeywords = async (
    botType: 'sales' | 'recruitment' | 'support', 
    keywords: string[]
  ) => {
    const field = `${botType}_bot_keywords` as keyof MasterWhatsAppConfig;
    return updateConfig({ [field]: keywords } as Partial<MasterWhatsAppConfig>);
  };

  // Atualizar prompt customizado de suporte
  const updateSupportPrompt = async (prompt: string) => {
    return updateConfig({ support_bot_custom_prompt: prompt });
  };

  // Atualizar bot principal
  const updatePrimaryBotType = async (botType: PrimaryBotType) => {
    const success = await updateConfig({ primary_bot_type: botType });
    if (success) {
      toast.success(`Bot principal alterado para ${getBotLabel(botType)}`);
    }
    return success;
  };

  // Pausar/retomar sessão
  const toggleSessionPause = async (sessionId: string, pause: boolean, reason?: string) => {
    try {
      const { error } = await supabase
        .from('master_whatsapp_sessions')
        .update({
          bot_paused: pause,
          paused_at: pause ? new Date().toISOString() : null,
          paused_reason: pause ? reason : null
        })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast.success(pause ? 'Sessão pausada' : 'Sessão retomada');
      return true;
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar sessão');
      return false;
    }
  };

  return {
    config,
    sessions,
    loading,
    syncing,
    syncError,
    clearSyncError,
    updateConfig,
    updateBotBehavior,
    syncBots,
    toggleBot,
    updateApproach,
    updateKeywords,
    updateSupportPrompt,
    updatePrimaryBotType,
    toggleSessionPause,
    hasUnsyncedChanges,
    lastSyncedAt
  };
}

function getBotLabel(botType: string): string {
  switch (botType) {
    case 'sales': return 'Vendas';
    case 'recruitment': return 'Recrutamento';
    case 'support': return 'Suporte';
    default: return botType;
  }
}
