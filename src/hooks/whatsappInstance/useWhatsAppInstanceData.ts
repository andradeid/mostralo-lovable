// Dados da tela de WhatsApp: instância, loja, templates, histórico e estatísticas.
// Código movido da WhatsAppInstancePage sem mudança de comportamento.
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Template, MessageLog } from "@/lib/whatsappInstance/types";

export type UseWhatsAppInstanceDataDeps = { [K in 'storeId']: any };

export function useWhatsAppInstanceData(deps: UseWhatsAppInstanceDataDeps) {
  const { storeId } = deps;
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState<any>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [storeSlug, setStoreSlug] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  // Estados para estatísticas da instância
  const [contactsCount, setContactsCount] = useState<number>(0);
  const [messagesCount, setMessagesCount] = useState<number>(0);
  const [pausedSessionsCount, setPausedSessionsCount] = useState<number>(0);

  useEffect(() => {
    if (storeId) {
      fetchInstance();
      fetchTemplates();
      fetchStoreInfo();
      fetchMessageLogs();
      fetchInstanceStats();
    }
  }, [storeId]);

  const fetchInstanceStats = async () => {
    if (!storeId) return;
    
    try {
      const [contactsRes, messagesRes, pausedRes] = await Promise.all([
        supabase.from('whatsapp_contacts' as any).select('id', { count: 'exact', head: true }).eq('store_id', storeId),
        supabase.from('whatsapp_messages' as any).select('id', { count: 'exact', head: true }).eq('store_id', storeId),
        supabase.from('whatsapp_paused_contacts' as any).select('id', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'paused'),
      ]);
      
      setContactsCount(contactsRes.count || 0);
      setMessagesCount(messagesRes.count || 0);
      setPausedSessionsCount(pausedRes.count || 0);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  useEffect(() => {
    if (storeId && showAllLogs) {
      fetchMessageLogs();
    }
  }, [showAllLogs]);

  const fetchStoreInfo = async () => {
    try {
      const { data } = await supabase
        .from('stores')
        .select('name, slug')
        .eq('id', storeId)
        .single();
      
      if (data) {
        setStoreName(data.name);
        setStoreSlug(data.slug);
      }
    } catch (error) {
      console.error('Erro ao buscar informações da loja:', error);
    }
  };

  const fetchInstance = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances' as any)
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (data) {
        setInstance(data);
      }
    } catch (error) {
      console.log('Nenhuma instância encontrada');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await supabase
        .from('whatsapp_templates' as any)
        .select('id, name, content, message_type, media_url')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name');

      if (data) {
        setTemplates(data as unknown as Template[]);
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    }
  };

  const fetchMessageLogs = async () => {
    setLogsLoading(true);
    try {
      const { data } = await supabase
        .from('whatsapp_messages' as any)
        .select(`
          id, phone_number, content, status, error_message,
          sent_at, failed_at, created_at,
          customer:customers(name),
          template:whatsapp_templates(name)
        `)
        .eq('store_id', storeId)
        .is('campaign_id', null)
        .order('created_at', { ascending: false })
        .limit(showAllLogs ? 50 : 10);

      if (data) {
        setMessageLogs(data as unknown as MessageLog[]);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de mensagens:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  return {
    loading,
    setLoading,
    instance,
    setInstance,
    storeName,
    setStoreName,
    storeSlug,
    setStoreSlug,
    templates,
    setTemplates,
    messageLogs,
    setMessageLogs,
    logsLoading,
    setLogsLoading,
    showAllLogs,
    setShowAllLogs,
    contactsCount,
    setContactsCount,
    messagesCount,
    setMessagesCount,
    pausedSessionsCount,
    setPausedSessionsCount,
    fetchInstanceStats,
    fetchStoreInfo,
    fetchInstance,
    fetchTemplates,
    fetchMessageLogs,
  };
}
