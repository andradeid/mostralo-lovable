import { useState, useEffect, useCallback, useRef } from 'react';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { supabase } from '@/integrations/supabase/client';
import { ConversationList } from '@/components/whatsapp-chat/ConversationList';
import { ChatWindow } from '@/components/whatsapp-chat/ChatWindow';
import { ContactInfoPanel } from '@/components/whatsapp-chat/ContactInfoPanel';
import { EmptyChat } from '@/components/whatsapp-chat/EmptyChat';
import { WhatsAppNotConnected } from '@/components/whatsapp-chat/WhatsAppNotConnected';
import { AttendantPermissionGate } from '@/components/admin/AttendantPermissionGate';
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus';
import { useNeedsHumanAlert } from '@/hooks/useNeedsHumanAlert';

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
  created_at: string | null;
  updated_at: string | null;
  assigned_to: string | null;
  assigned_profile?: { full_name: string | null } | null;
  last_message_source: string | null;
  needs_human?: boolean;
  needs_human_reason?: string | null;
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
  media_filename: string | null;
  media_mimetype: string | null;
  is_from_bot: boolean;
  is_read_by_attendant: boolean;
  timestamp: string;
  evolution_message_id: string | null;
  metadata: Record<string, any> | null;
  quoted_message_id: string | null;
  quoted_content: Record<string, any> | null;
  reactions: any[] | null;
  status: string;
  message_source: string | null;
}

export default function WhatsAppChatPage() {
  return (
    <AttendantPermissionGate permissionKey="whatsapp_chat">
      <WhatsAppChatContent />
    </AttendantPermissionGate>
  );
}

function WhatsAppChatContent() {
  const { storeId } = useStoreAccess();
  const isMobile = useIsMobile();
  const { hasConnectedWhatsApp, isLoading: isLoadingWhatsApp } = useWhatsAppStatus(storeId);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  // Typing indicators: track which conversations have typing activity
  const [attendantTypingConvId, setAttendantTypingConvId] = useState<string | null>(null);
  const [clientTypingConvIds, setClientTypingConvIds] = useState<Set<string>>(new Set());
  // Track presence type per conversation for in-chat indicator
  const [clientPresenceMap, setClientPresenceMap] = useState<Map<string, string>>(new Map());
  const [prefillMessage, setPrefillMessage] = useState<string | null>(null);

  // 🔔 Sistema de alertas para conversas que precisam de atendente
  const { soundEnabled, toggleSound, clearNeedsHuman } = useNeedsHumanAlert(storeId);

  // Handle attendant typing change from ChatInput
  const handleAttendantTyping = useCallback((isTyping: boolean) => {
    if (isTyping && selectedConversation) {
      setAttendantTypingConvId(selectedConversation.id);
    } else {
      setAttendantTypingConvId(null);
    }
  }, [selectedConversation]);

  // Refs for typing timers to properly clean up
  const clientTypingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Listen for client typing via Supabase broadcast channel
  useEffect(() => {
    if (!storeId || !hasConnectedWhatsApp) return;

    const channel = supabase
      .channel(`typing-presence:${storeId}`)
      .on('broadcast', { event: 'client-typing' }, (payload) => {
        console.log('[WhatsAppChat] 📝 Received typing broadcast:', payload);
        const { conversationId, isTyping, presenceType } = payload.payload as { conversationId: string; isTyping: boolean; presenceType?: string };
        
        // Clear existing timer for this conversation
        if (clientTypingTimers.current[conversationId]) {
          clearTimeout(clientTypingTimers.current[conversationId]);
          delete clientTypingTimers.current[conversationId];
        }

        setClientTypingConvIds(prev => {
          const next = new Set(prev);
          if (isTyping) {
            next.add(conversationId);
          } else {
            next.delete(conversationId);
          }
          return next;
        });

        // Track presence type (composing vs recording)
        setClientPresenceMap(prev => {
          const next = new Map(prev);
          if (isTyping && presenceType) {
            next.set(conversationId, presenceType);
          } else {
            next.delete(conversationId);
          }
          return next;
        });

        // Auto-clear after 15s if typing
        if (isTyping) {
          clientTypingTimers.current[conversationId] = setTimeout(() => {
            setClientTypingConvIds(prev => {
              const next = new Set(prev);
              next.delete(conversationId);
              return next;
            });
            setClientPresenceMap(prev => {
              const next = new Map(prev);
              next.delete(conversationId);
              return next;
            });
            delete clientTypingTimers.current[conversationId];
          }, 15000);
        }
      })
      .subscribe((status) => {
        console.log('[WhatsAppChat] 📡 Typing channel status:', status);
      });

    return () => {
      // Clear all timers
      Object.values(clientTypingTimers.current).forEach(clearTimeout);
      clientTypingTimers.current = {};
      supabase.removeChannel(channel);
    };
  }, [storeId, hasConnectedWhatsApp]);

  // Verificar se a loja tem IA configurada e ativa
  useEffect(() => {
    if (!storeId) return;
    supabase
      .from('store_bot_config')
      .select('enabled, openai_creds_id, uazapi_assistant_id, openai_assistant_id, whatsapp_provider, evolution_bot_status')
      .eq('store_id', storeId)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return setIsAiConfigured(false);
        const isEnabled = !!data.enabled;
        const isActive = data.evolution_bot_status === 'active';
        const hasEvolutionBot = isEnabled && !!data.openai_creds_id;
        // Para UaZapi, o bot usa openai_assistant_id (não cria agente próprio na UaZapi)
        const hasOpenaiAssistant = isEnabled && !!data.openai_assistant_id && isActive;
        console.log('[WhatsAppChat] Bot config check:', { isEnabled, isActive, hasEvolutionBot, hasOpenaiAssistant, provider: data.whatsapp_provider });
        setIsAiConfigured(hasEvolutionBot || hasOpenaiAssistant);
      });
  }, [storeId]);

  // Carregar conversas
  useEffect(() => {
    if (!storeId) return;

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*, assigned_profile:profiles!assigned_to(full_name)')
        .eq('store_id', storeId)
        .order('last_message_at', { ascending: false });

      if (!error && data) {
        setConversations(data as unknown as Conversation[]);
      }
      setLoading(false);
    };

    fetchConversations();

    // Só ativa Realtime se tiver WhatsApp conectado
    if (!hasConnectedWhatsApp) return;

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
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // INSERT precisa de JOIN para profile — buscar do DB
            const { data } = await supabase
              .from('whatsapp_conversations')
              .select('*, assigned_profile:profiles!assigned_to(full_name)')
              .eq('id', (payload.new as any).id)
              .single();
            if (data) {
              setConversations(prev => [data as unknown as Conversation, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // UPDATE: usar payload.new diretamente (evita SELECT cascata)
            const updated = payload.new as unknown as Conversation;
            setConversations(prev =>
              prev.map(c => {
                if (c.id !== updated.id) return c;
                // Preservar assigned_profile do estado anterior (já temos em cache)
                return { ...c, ...updated, assigned_profile: c.assigned_profile };
              })
                .sort((a, b) => new Date(b.last_message_at || '').getTime() - new Date(a.last_message_at || '').getTime())
            );
            setSelectedConversation(prev =>
              prev?.id === updated.id ? { ...prev, ...updated, assigned_profile: prev.assigned_profile } : prev
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, hasConnectedWhatsApp]);

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);

    // Limpar flag needs_human ao abrir a conversa e capturar razão para prefill
    if ((conversation as any).needs_human) {
      const reason = await clearNeedsHuman(conversation.id);
      if (reason) {
        // Formatar: remover "Interesse em: " e colocar cada produto em uma linha
        let formatted = reason.replace(/^Interesse em:\s*/i, '');
        formatted = formatted.split(',').map((item: string) => item.trim()).filter(Boolean).join('\n');
        setPrefillMessage(formatted);
      }
    } else {
      setPrefillMessage(null);
    }

    // Marcar como lida no banco local
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

      // Enviar confirmação de leitura (ticks azuis) para o cliente via API
      supabase.functions.invoke('whatsapp-chat-send', {
        body: {
          storeId: conversation.store_id,
          remoteJid: conversation.remote_jid,
          messageType: 'markread',
        },
      }).catch((err) => console.error('[WhatsAppChat] Erro ao marcar como lida na API:', err));
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const handleStatusChange = (action: 'closed' | 'reopened') => {
    if (action === 'closed') {
      setSelectedConversation(null);
    }
  };

  if (loading || isLoadingWhatsApp) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não tem WhatsApp conectado, mostrar tela de conexão
  if (!hasConnectedWhatsApp) {
    return <WhatsAppNotConnected storeId={storeId!} />;
  }

  // Mobile/Tablet: mostra lista OU chat (ocupa toda a área disponível)
  if (isMobile) {
    if (selectedConversation) {
      return (
        <div className="h-full w-full overflow-hidden">
          <ChatWindow
            conversation={selectedConversation}
            storeId={storeId!}
            onBack={handleBack}
            onStatusChange={handleStatusChange}
            onTypingChange={handleAttendantTyping}
            clientPresenceType={clientPresenceMap.get(selectedConversation.id) || null}
            prefillMessage={prefillMessage}
          />
        </div>
      );
    }
    return (
      <div className="h-full w-full overflow-hidden">
        <ConversationList
          conversations={conversations}
          selectedId={null}
          onSelect={handleSelectConversation}
          storeId={storeId!}
          onConversationCreated={handleSelectConversation}
          isAiConfigured={isAiConfigured}
          attendantTypingConvId={attendantTypingConvId}
          clientTypingConvIds={clientTypingConvIds}
          clientPresenceMap={clientPresenceMap}
          soundEnabled={soundEnabled}
          onSoundToggle={toggleSound}
        />
      </div>
    );
  }

  // Desktop: split view
  return (
    <div className="flex h-[calc(100vh-1px)] border border-border/40 rounded-xl overflow-hidden bg-background shadow-sm">
      <div className="w-[360px] border-r border-border/40 flex-shrink-0 bg-background">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id || null}
          onSelect={handleSelectConversation}
          storeId={storeId!}
          onConversationCreated={handleSelectConversation}
          isAiConfigured={isAiConfigured}
          attendantTypingConvId={attendantTypingConvId}
          clientTypingConvIds={clientTypingConvIds}
          clientPresenceMap={clientPresenceMap}
          soundEnabled={soundEnabled}
          onSoundToggle={toggleSound}
        />
      </div>
      <div className="flex-1 min-w-0">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            storeId={storeId!}
            onStatusChange={handleStatusChange}
            onTypingChange={handleAttendantTyping}
            clientPresenceType={clientPresenceMap.get(selectedConversation.id) || null}
            prefillMessage={prefillMessage}
          />
        ) : (
          <EmptyChat />
        )}
      </div>
      {selectedConversation && (
        <div className="w-[300px] border-l border-border/40 flex-shrink-0 hidden xl:block bg-background/50">
          <ContactInfoPanel
            conversation={selectedConversation}
            storeId={storeId!}
            isAiConfigured={isAiConfigured}
          />
        </div>
      )}
    </div>
  );
}
