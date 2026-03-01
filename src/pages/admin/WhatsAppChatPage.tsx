import { useState, useEffect } from 'react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { supabase } from '@/integrations/supabase/client';
import { ConversationList } from '@/components/whatsapp-chat/ConversationList';
import { ChatWindow } from '@/components/whatsapp-chat/ChatWindow';
import { ContactInfoPanel } from '@/components/whatsapp-chat/ContactInfoPanel';
import { EmptyChat } from '@/components/whatsapp-chat/EmptyChat';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export interface Conversation {
  id: string;
  store_id: string;
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
}

export interface ChatMessage {
  id: string;
  store_id: string;
  remote_jid: string;
  phone_number: string;
  direction: string;
  sender_name: string | null;
  content: string | null;
  message_type: string;
  media_url: string | null;
  is_from_bot: boolean;
  is_read_by_attendant: boolean;
  timestamp: string;
  evolution_message_id: string | null;
}

export default function WhatsAppChatPage() {
  const { storeId } = useStoreAccess();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar conversas
  useEffect(() => {
    if (!storeId) return;

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('store_id', storeId)
        .order('last_message_at', { ascending: false });

      if (!error && data) {
        setConversations(data as Conversation[]);
      }
      setLoading(false);
    };

    fetchConversations();

    // Realtime para novas conversas / updates
    const channel = supabase
      .channel('whatsapp_conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversations',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations(prev => [payload.new as Conversation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConversations(prev =>
              prev.map(c => c.id === (payload.new as Conversation).id ? payload.new as Conversation : c)
                .sort((a, b) => new Date(b.last_message_at || '').getTime() - new Date(a.last_message_at || '').getTime())
            );
            // Atualizar conversa selecionada se for a mesma
            setSelectedConversation(prev =>
              prev?.id === (payload.new as Conversation).id ? payload.new as Conversation : prev
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);

    // Marcar como lida
    if (conversation.unread_count > 0) {
      await supabase
        .from('whatsapp_conversations')
        .update({ unread_count: 0 })
        .eq('id', conversation.id);

      await supabase
        .from('whatsapp_chat_messages')
        .update({ is_read_by_attendant: true })
        .eq('store_id', conversation.store_id)
        .eq('remote_jid', conversation.remote_jid)
        .eq('is_read_by_attendant', false);
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Mobile: mostra lista OU chat
  if (isMobile) {
    if (selectedConversation) {
      return (
        <div className="h-[calc(100vh-120px)]">
          <ChatWindow
            conversation={selectedConversation}
            storeId={storeId!}
            onBack={handleBack}
          />
        </div>
      );
    }
    return (
      <div className="h-[calc(100vh-120px)]">
        <ConversationList
          conversations={conversations}
          selectedId={null}
          onSelect={handleSelectConversation}
        />
      </div>
    );
  }

  // Desktop: split view
  return (
    <div className="flex h-[calc(100vh-120px)] border border-border rounded-lg overflow-hidden bg-background">
      <div className="w-[360px] border-r border-border flex-shrink-0">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id || null}
          onSelect={handleSelectConversation}
        />
      </div>
      <div className="flex-1 min-w-0">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            storeId={storeId!}
          />
        ) : (
          <EmptyChat />
        )}
      </div>
      {selectedConversation && (
        <div className="w-[300px] border-l border-border flex-shrink-0 hidden xl:block">
          <ContactInfoPanel
            conversation={selectedConversation}
            storeId={storeId!}
          />
        </div>
      )}
    </div>
  );
}
