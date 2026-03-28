import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MasterConversationList } from '@/components/master-whatsapp-chat/MasterConversationList';
import { MasterChatWindow } from '@/components/master-whatsapp-chat/MasterChatWindow';
import { EmptyChat } from '@/components/whatsapp-chat/EmptyChat';
import { Loader2, MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Tipos para o Master Chat
export interface MasterConversation {
  id: string;
  config_id: string;
  remote_jid: string;
  phone_number: string;
  contact_name: string | null;
  profile_picture_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
  last_message_direction: string | null;
  unread_count: number;
  status: string;
  is_bot_active: boolean;
  active_bot_type: string | null;
  assigned_to: string | null;
  last_message_source: string | null;
  needs_human: boolean;
  needs_human_reason: string | null;
  internal_notes: string | null;
  tags: string[];
  created_at: string | null;
  updated_at: string | null;
}

export interface MasterChatMessage {
  id: string;
  config_id: string;
  remote_jid: string;
  phone_number: string;
  direction: string;
  sender_name: string | null;
  content: string | null;
  message_type: string;
  media_url: string | null;
  media_filename: string | null;
  media_mimetype: string | null;
  is_from_bot: boolean;
  is_read_by_admin: boolean;
  timestamp: string;
  evolution_message_id: string | null;
  metadata: Record<string, any> | null;
  quoted_message_id: string | null;
  quoted_content: Record<string, any> | null;
  reactions: any[] | null;
  status: string;
  message_source: string | null;
}

export default function MasterWhatsAppChatPage() {
  const isMobile = useIsMobile();
  const [configId, setConfigId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<MasterConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<MasterConversation | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar config_id do master
  useEffect(() => {
    const fetchConfig = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('master_whatsapp_config')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      if (data) {
        setConfigId(data.id);
      } else {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Carregar conversas
  useEffect(() => {
    if (!configId) return;

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('master_whatsapp_conversations')
        .select('*')
        .eq('config_id', configId)
        .order('last_message_at', { ascending: false });

      if (!error && data) {
        setConversations(data as MasterConversation[]);
      }
      setLoading(false);
    };

    fetchConversations();

    // OTIMIZAÇÃO: Realtime removido — substituído por polling de 60s
    // Master Admin é acessado por 1 usuário, não justifica canal permanente
    const pollingInterval = setInterval(() => {
      fetchConversations();
    }, 60000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [configId]);

  const handleSelectConversation = async (conversation: MasterConversation) => {
    setSelectedConversation(conversation);

    // Garantir que a conversa está na lista (ex: criada via modal)
    setConversations(prev => {
      if (prev.some(c => c.id === conversation.id)) return prev;
      return [conversation, ...prev];
    });

    // Marcar como lida
    if (conversation.unread_count > 0) {
      await supabase
        .from('master_whatsapp_conversations')
        .update({ unread_count: 0 })
        .eq('id', conversation.id);

      await supabase
        .from('master_whatsapp_chat_messages')
        .update({ is_read_by_admin: true })
        .eq('config_id', conversation.config_id)
        .eq('remote_jid', conversation.remote_jid)
        .eq('is_read_by_admin', false);

      // Mark read na API
      supabase.functions.invoke('master-whatsapp-chat-send', {
        body: {
          remoteJid: conversation.remote_jid,
          messageType: 'markread',
        },
      }).catch(() => {});
    }
  };

  const handleBack = () => setSelectedConversation(null);

  const handleStatusChange = (action: 'closed' | 'reopened') => {
    if (action === 'closed') setSelectedConversation(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!configId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] text-muted-foreground gap-4">
        <MessageCircle className="w-12 h-12" />
        <div className="text-center">
          <h3 className="font-medium text-foreground">WhatsApp Master não configurado</h3>
          <p className="text-sm mt-1">Configure a instância master primeiro em WhatsApp Master.</p>
        </div>
      </div>
    );
  }

  // Mobile
  if (isMobile) {
    if (selectedConversation) {
      return (
        <div className="h-full w-full overflow-hidden">
          <MasterChatWindow
            conversation={selectedConversation}
            configId={configId}
            onBack={handleBack}
            onStatusChange={handleStatusChange}
          />
        </div>
      );
    }
    return (
      <div className="h-full w-full overflow-hidden">
        <MasterConversationList
          conversations={conversations}
          selectedId={null}
          onSelect={handleSelectConversation}
          configId={configId}
        />
      </div>
    );
  }

  // Desktop
  return (
    <div className="flex h-[calc(100vh-1px)] border border-border/40 rounded-xl overflow-hidden bg-background shadow-sm">
      <div className="w-[360px] border-r border-border/40 flex-shrink-0 bg-background">
        <MasterConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id || null}
          onSelect={handleSelectConversation}
          configId={configId}
        />
      </div>
      <div className="flex-1 min-w-0">
        {selectedConversation ? (
          <MasterChatWindow
            conversation={selectedConversation}
            configId={configId}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
}
