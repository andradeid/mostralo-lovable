import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatHeader } from './ChatHeader';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Conversation, ChatMessage } from '@/pages/admin/WhatsAppChatPage';

interface ChatWindowProps {
  conversation: Conversation;
  storeId: string;
  onBack?: () => void;
}

export function ChatWindow({ conversation, storeId, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevConvIdRef = useRef<string>('');

  // Carregar mensagens ao selecionar conversa
  useEffect(() => {
    if (!conversation) return;

    // Reset ao trocar de conversa
    if (prevConvIdRef.current !== conversation.id) {
      setMessages([]);
      setLoading(true);
      prevConvIdRef.current = conversation.id;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('whatsapp_chat_messages')
        .select('*')
        .eq('store_id', storeId)
        .eq('remote_jid', conversation.remote_jid)
        .order('timestamp', { ascending: true })
        .limit(200);

      if (!error && data) {
        setMessages(data as ChatMessage[]);
      }
      setLoading(false);
    };

    fetchMessages();

    // Realtime para novas mensagens desta conversa
    const channel = supabase
      .channel(`chat_messages_${conversation.remote_jid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_chat_messages',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.remote_jid === conversation.remote_jid) {
            setMessages(prev => {
              // Evitar duplicata
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation, storeId]);

  // Scroll para o final quando chegar novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-chat-send', {
        body: {
          storeId,
          remoteJid: conversation.remote_jid,
          content: content.trim(),
          messageType: 'text',
        },
      });

      if (error) {
        console.error('Erro ao enviar:', error);
        toast.error('Erro ao enviar mensagem');
      }
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader conversation={conversation} onBack={onBack} />

      {/* Área de mensagens */}
      <div className="flex-1 overflow-hidden bg-muted/20">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Nenhuma mensagem ainda
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessageBubble key={msg.id} message={msg} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <ChatInput onSend={handleSend} sending={sending} />
    </div>
  );
}
