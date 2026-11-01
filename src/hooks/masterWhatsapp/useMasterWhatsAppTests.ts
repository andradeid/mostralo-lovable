// Testes de envio, histórico, estatísticas das sessões e Assistente IA do WhatsApp Master.
// Código movido da MasterWhatsAppPage sem mudança de comportamento.
import type { useMasterWhatsAppConfig } from "@/hooks/useMasterWhatsAppConfig";
import type { TestMessage, AssistantStatus } from "./types";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MasterConfig = ReturnType<typeof useMasterWhatsAppConfig>["config"];

export function useMasterWhatsAppTests(config: MasterConfig, setLoadingAction: (v: string | null) => void) {
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [countryCode, setCountryCode] = useState("+55");
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatus | null>(null);
  const [loadingAssistant, setLoadingAssistant] = useState(false);
  const [deletingAssistant, setDeletingAssistant] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [stats, setStats] = useState({ totalSessions: 0, totalMessages: 0, pausedSessions: 0 });

  // Buscar estatísticas das sessões
  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from('master_whatsapp_sessions')
        .select('id, messages_count, bot_paused');
      
      if (data) {
        setStats({
          totalSessions: data.length,
          totalMessages: data.reduce((acc, s) => acc + (s.messages_count || 0), 0),
          pausedSessions: data.filter(s => s.bot_paused).length
        });
      }
    };
    fetchStats();
  }, []);

  // Buscar status do Assistente IA Master
  const fetchAssistantStatus = async () => {
    setLoadingAssistant(true);
    try {
      const { data, error } = await supabase.functions.invoke('master-whatsapp-list-bots');
      if (error) throw error;
      setAssistantStatus(data?.assistant || null);
    } catch (error) {
      console.error('Erro ao buscar status do assistente:', error);
    } finally {
      setLoadingAssistant(false);
    }
  };

  // Deletar Assistente IA Master
  const handleDeleteAssistant = async (): Promise<boolean> => {
    if (!config?.id) {
      toast.error('Configuração do WhatsApp Master não carregada');
      return false;
    }
    setDeletingAssistant(true);
    try {
      const { data, error } = await supabase.functions.invoke('master-bot-delete', {
        body: { configId: config.id }
      });
      if (error) throw error;
      if (data?.success) {
        toast.success('Assistente IA Master removido!');
        setAssistantStatus(null);
        setShowDeleteDialog(false);
        return true;
      }
      throw new Error(data?.error || 'Erro ao deletar');
    } catch (error) {
      console.error('Erro ao deletar assistente:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar assistente');
      return false;
    } finally {
      setDeletingAssistant(false);
    }
  };

  // Buscar histórico de mensagens de teste
  const fetchTestMessages = async () => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('master_test_messages')
        .select('id, phone_number, country_code, message, status, sent_at, error_message')
        .order('sent_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setTestMessages((data as TestMessage[]) || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchTestMessages();
    fetchAssistantStatus();
  }, []);

  const sendTestMessage = async () => {
    if (!testPhone.trim()) {
      toast.error('Digite o número de telefone');
      return;
    }

    // Remove formatação e combina com DDI
    const cleanPhone = testPhone.replace(/\D/g, '');
    const fullNumber = countryCode.replace('+', '') + cleanPhone;

    setLoadingAction('sendTest');
    try {
      const { data, error } = await supabase.functions.invoke('master-whatsapp-instance', {
        body: { 
          action: 'sendTest', 
          phoneNumber: fullNumber,
          message: testMessage.trim() || undefined
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('✅ Mensagem enviada com sucesso!');
      setTestPhone("");
      setTestMessage("");
      
      // Atualizar histórico
      await fetchTestMessages();
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
      // Mesmo em erro, atualizar histórico (pode ter salvo como failed)
      await fetchTestMessages();
    } finally {
      setLoadingAction(null);
    }
  };

  return {
    testPhone,
    setTestPhone,
    testMessage,
    setTestMessage,
    countryCode,
    setCountryCode,
    testMessages,
    setTestMessages,
    loadingMessages,
    setLoadingMessages,
    assistantStatus,
    setAssistantStatus,
    loadingAssistant,
    setLoadingAssistant,
    deletingAssistant,
    setDeletingAssistant,
    showDeleteDialog,
    setShowDeleteDialog,
    stats,
    setStats,
    fetchAssistantStatus,
    handleDeleteAssistant,
    fetchTestMessages,
    sendTestMessage,
  };
}

export type MasterWhatsAppTestsApi = ReturnType<typeof useMasterWhatsAppTests>;
