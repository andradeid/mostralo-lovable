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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('whatsapp-chat-send', {
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

  const handleSendMedia = async (file: File, caption: string) => {
    if (sending) return;
    setSending(true);

    try {
      // 1. Upload para Supabase Storage
      const ext = file.name.split('.').pop() || 'bin';
      const filePath = `${storeId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('whatsapp-chat-media')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Erro ao fazer upload do arquivo');
        return;
      }

      // 2. Obter URL pública
      const { data: urlData } = supabase.storage
        .from('whatsapp-chat-media')
        .getPublicUrl(filePath);

      const mediaUrl = urlData.publicUrl;

      // 3. Determinar tipo de mídia
      let mediaType = 'document';
      if (file.type.startsWith('image/')) mediaType = 'image';
      else if (file.type.startsWith('video/')) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';

      // 4. Enviar via edge function
      const { error } = await supabase.functions.invoke('whatsapp-chat-send', {
        body: {
          storeId,
          remoteJid: conversation.remote_jid,
          content: caption || file.name,
          messageType: mediaType,
          mediaUrl,
          mediaFilename: file.name,
          mediaMimetype: file.type,
        },
      });

      if (error) {
        console.error('Erro ao enviar mídia:', error);
        toast.error('Erro ao enviar mídia');
      }
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao enviar mídia');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader conversation={conversation} onBack={onBack} />

      <div className="flex-1 overflow-hidden bg-[#d9dbd2] dark:bg-[#0b141a]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='50' height='50' patternUnits='userSpaceOnUse' patternTransform='rotate(30)'%3E%3Cpath d='M5 25h8M25 5v8M37 25h8M25 37v8' stroke='%23b8bdb0' stroke-width='0.8' fill='none' opacity='0.6'/%3E%3Ccircle cx='12' cy='12' r='1.5' fill='%23b8bdb0' opacity='0.4'/%3E%3Ccircle cx='38' cy='38' r='1.5' fill='%23b8bdb0' opacity='0.4'/%3E%3Ccircle cx='25' cy='25' r='1' fill='%23b8bdb0' opacity='0.3'/%3E%3Crect x='0' y='0' width='3' height='3' rx='0.5' fill='%23b8bdb0' opacity='0.2' transform='translate(35,10)'/%3E%3Crect x='0' y='0' width='3' height='3' rx='0.5' fill='%23b8bdb0' opacity='0.2' transform='translate(8,40)'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23p)'/%3E%3C/svg%3E")`,
      }}>
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

      <ChatInput onSend={handleSend} onSendMedia={handleSendMedia} sending={sending} />
    </div>
  );
}