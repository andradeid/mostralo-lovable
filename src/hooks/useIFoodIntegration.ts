import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface IFoodIntegration {
  id: string;
  store_id: string;
  merchant_id: string | null;
  client_id: string | null;
  client_secret: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  webhook_secret: string | null;
  environment: 'sandbox' | 'production';
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IFoodEvent {
  id: string;
  store_id: string;
  event_id: string;
  event_type: string;
  event_code: string | null;
  order_id: string | null;
  payload: any;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export function useIFoodIntegration(storeId: string | null) {
  const [integration, setIntegration] = useState<IFoodIntegration | null>(null);
  const [events, setEvents] = useState<IFoodEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Buscar integração
  const fetchIntegration = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ifood_integrations')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;
      setIntegration(data as IFoodIntegration | null);
    } catch (error) {
      console.error('Erro ao buscar integração iFood:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  // Buscar eventos
  const fetchEvents = useCallback(async () => {
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from('ifood_events_log')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents((data as IFoodEvent[]) || []);
    } catch (error) {
      console.error('Erro ao buscar eventos iFood:', error);
    }
  }, [storeId]);

  useEffect(() => {
    fetchIntegration();
    fetchEvents();
  }, [fetchIntegration, fetchEvents]);

  // Salvar credenciais
  const saveCredentials = async (clientId: string, clientSecret: string) => {
    if (!storeId) return false;
    
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('ifood-auth', {
        body: {
          action: 'save_credentials',
          store_id: storeId,
          client_id: clientId,
          client_secret: clientSecret
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: 'Credenciais salvas',
        description: 'As credenciais foram salvas com sucesso.'
      });

      await fetchIntegration();
      return true;
    } catch (error: any) {
      console.error('Erro ao salvar credenciais:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar as credenciais.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Obter token
  const getToken = async () => {
    if (!storeId) return false;
    
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('ifood-auth', {
        body: {
          action: 'get_token',
          store_id: storeId
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: 'Conectado ao iFood',
        description: 'Token obtido com sucesso!'
      });

      await fetchIntegration();
      return true;
    } catch (error: any) {
      console.error('Erro ao obter token:', error);
      toast({
        title: 'Erro de autenticação',
        description: error.message || 'Não foi possível conectar ao iFood.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Testar conexão
  const testConnection = async () => {
    if (!storeId) return null;
    
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('ifood-auth', {
        body: {
          action: 'test_connection',
          store_id: storeId
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: 'Conexão OK',
        description: `${data.merchants_count} loja(s) encontrada(s) no iFood`
      });

      return data.merchants;
    } catch (error: any) {
      console.error('Erro ao testar conexão:', error);
      toast({
        title: 'Erro na conexão',
        description: error.message || 'Não foi possível conectar ao iFood.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Desconectar
  const disconnect = async () => {
    if (!storeId) return false;
    
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('ifood-auth', {
        body: {
          action: 'disconnect',
          store_id: storeId
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: 'Desconectado',
        description: 'Integração com iFood desconectada.'
      });

      await fetchIntegration();
      return true;
    } catch (error: any) {
      console.error('Erro ao desconectar:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível desconectar.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Polling de eventos
  const pollEvents = async () => {
    if (!storeId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('ifood-webhook', {
        body: {
          action: 'poll_events',
          store_id: storeId
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      if (data.events_count > 0) {
        toast({
          title: 'Eventos recebidos',
          description: `${data.events_count} evento(s) processado(s)`
        });
        await fetchEvents();
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível buscar eventos.',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Verificar se token está expirado
  const isTokenExpired = useCallback(() => {
    if (!integration?.token_expires_at) return true;
    return new Date(integration.token_expires_at) < new Date();
  }, [integration]);

  // Verificar se está conectado
  const isConnected = useCallback(() => {
    return integration?.is_active && integration?.access_token && !isTokenExpired();
  }, [integration, isTokenExpired]);

  return {
    integration,
    events,
    loading,
    saving,
    saveCredentials,
    getToken,
    testConnection,
    disconnect,
    pollEvents,
    isTokenExpired,
    isConnected,
    refetch: fetchIntegration,
    refetchEvents: fetchEvents
  };
}
