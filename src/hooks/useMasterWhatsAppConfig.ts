import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export type SalesApproach = 'basic' | 'intermediate' | 'aggressive';
export type RecruitmentApproach = 'cold_lead' | 'moderate' | 'aggressive' | 'super_aggressive';

export interface MasterWhatsAppConfig {
  id: string;
  admin_user_id: string;
  instance_name: string | null;
  instance_status: string;
  instance_phone: string | null;
  evolution_instance_id: string | null;
  sales_bot_enabled: boolean;
  sales_bot_approach: SalesApproach;
  sales_bot_keywords: string[];
  sales_bot_evolution_id: string | null;
  recruitment_bot_enabled: boolean;
  recruitment_bot_approach: RecruitmentApproach;
  recruitment_bot_keywords: string[];
  recruitment_bot_evolution_id: string | null;
  support_bot_enabled: boolean;
  support_bot_keywords: string[];
  support_bot_evolution_id: string | null;
  support_bot_custom_prompt: string | null;
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

export function useMasterWhatsAppConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<MasterWhatsAppConfig | null>(null);
  const [sessions, setSessions] = useState<MasterWhatsAppSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

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

  // Sincronizar bots com Evolution API
  const syncBots = async (botType?: 'sales' | 'recruitment' | 'support') => {
    if (!config?.id || !config.instance_name) {
      toast.error('Configure a instância WhatsApp primeiro');
      return false;
    }

    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('master-bot-sync', {
        body: { configId: config.id, botType }
      });

      if (response.error) throw response.error;

      const { results } = response.data;
      
      // Atualizar IDs dos bots
      const updates: Partial<MasterWhatsAppConfig> = {};
      
      if (results.sales?.botId) {
        updates.sales_bot_evolution_id = results.sales.botId;
      }
      if (results.recruitment?.botId) {
        updates.recruitment_bot_evolution_id = results.recruitment.botId;
      }
      if (results.support?.botId) {
        updates.support_bot_evolution_id = results.support.botId;
      }

      if (Object.keys(updates).length > 0) {
        setConfig(prev => prev ? { ...prev, ...updates } : null);
      }

      toast.success('Bots sincronizados com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar bots');
      return false;
    } finally {
      setSyncing(false);
    }
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
    updateConfig,
    syncBots,
    toggleBot,
    updateApproach,
    updateKeywords,
    updateSupportPrompt,
    toggleSessionPause
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
