import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MasterChatHeader } from './MasterChatHeader';
import { MasterContactInfoPanel } from './MasterContactInfoPanel';
import { ChatMessageBubble } from '@/components/whatsapp-chat/ChatMessageBubble';
import { ChatDateSeparator } from '@/components/whatsapp-chat/ChatDateSeparator';
import { MasterChatInput } from './MasterChatInput';
import { PaymentRequestDialog, type PaymentRequestData } from '@/components/whatsapp-chat/PaymentRequestDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ChevronUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MasterConversation, MasterChatMessage } from '@/pages/admin/MasterWhatsAppChatPage';
// Reusar o tipo ChatMessage da loja para o ChatMessageBubble
import type { ChatMessage } from '@/pages/admin/WhatsAppChatPage';

const PAGE_SIZE = 100;

interface MasterChatWindowProps {
  conversation: MasterConversation;
  configId: string;
  onBack?: () => void;
  onStatusChange?: (action: 'closed' | 'reopened') => void;
}

// Adaptar MasterChatMessage para ChatMessage (compatível com ChatMessageBubble)
function toStoreChatMessage(msg: MasterChatMessage): ChatMessage {
  return {
    id: msg.id,
    store_id: msg.config_id, // Usa config_id no lugar
    remote_jid: msg.remote_jid,
    phone_number: msg.phone_number,
    direction: msg.direction,
    sender_name: msg.sender_name,
    content: msg.content,
    message_type: msg.message_type,
    media_url: msg.media_url,
    media_filename: msg.media_filename,
    media_mimetype: msg.media_mimetype,
    is_from_bot: msg.is_from_bot,
    is_read_by_attendant: msg.is_read_by_admin,
    timestamp: msg.timestamp,
    evolution_message_id: msg.evolution_message_id,
    metadata: msg.metadata,
    quoted_message_id: msg.quoted_message_id,
    quoted_content: msg.quoted_content,
    reactions: msg.reactions,
    status: msg.status,
    message_source: msg.message_source,
  };
}

export function MasterChatWindow({ conversation, configId, onBack, onStatusChange }: MasterChatWindowProps) {
  const [messages, setMessages] = useState<MasterChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showContactPanel, setShowContactPanel] = useState(true);
  const [paymentRequestOpen, setPaymentRequestOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevConvIdRef = useRef<string>('');
  const isInitialLoadRef = useRef(true);

  const fetchMessages = useCallback(async (beforeTimestamp?: string) => {
    let query = supabase
      .from('master_whatsapp_chat_messages')
      .select('*')
      .eq('config_id', configId)
      .eq('remote_jid', conversation.remote_jid)
      .order('timestamp', { ascending: false })
      .limit(PAGE_SIZE);

    if (beforeTimestamp) {
      query = query.lt('timestamp', beforeTimestamp);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar mensagens master:', error);
      return { messages: [], hasMore: false };
    }

    const sorted = (data || []).reverse() as MasterChatMessage[];
    return { messages: sorted, hasMore: sorted.length === PAGE_SIZE };
  }, [configId, conversation.remote_jid]);

  // Carregar mensagens iniciais
  useEffect(() => {
    if (!conversation) return;

    if (prevConvIdRef.current !== conversation.id) {
      setMessages([]);
      setLoading(true);
      setHasMore(false);
      setReplyingTo(null);
      isInitialLoadRef.current = true;
      prevConvIdRef.current = conversation.id;
    }

    const load = async () => {
      const result = await fetchMessages();
      setMessages(result.messages);
      setHasMore(result.hasMore);
      setLoading(false);
    };

    load();

    // Realtime
    const channel = supabase
      .channel(`master_chat_msgs_${conversation.remote_jid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'master_whatsapp_chat_messages',
          filter: `config_id=eq.${configId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as MasterChatMessage;
            if (newMsg.remote_jid === conversation.remote_jid) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as MasterChatMessage;
            if (updated.remote_jid === conversation.remote_jid) {
              setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation, configId, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0 && !loading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        isInitialLoadRef.current = false;
      }, 100);
    } else if (!isInitialLoadRef.current && !loadingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, loadingMore]);

  const loadOlderMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldestTimestamp = messages[0]?.timestamp;
    if (!oldestTimestamp) { setLoadingMore(false); return; }
    const result = await fetchMessages(oldestTimestamp);
    if (result.messages.length > 0) {
      setMessages(prev => [...result.messages, ...prev]);
    }
    setHasMore(result.hasMore);
    setLoadingMore(false);
  }, [loadingMore, hasMore, messages, fetchMessages]);

  const handleSend = async (content: string) => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const body: Record<string, any> = {
        remoteJid: conversation.remote_jid,
        content: content.trim(),
        messageType: 'text',
      };

      if (replyingTo) {
        body.quotedMessageId = replyingTo.id;
        body.quotedEvolutionId = replyingTo.evolution_message_id;
        body.quotedFromMe = replyingTo.direction === 'outgoing';
        body.quotedContent = {
          content: replyingTo.content,
          sender_name: replyingTo.sender_name || (replyingTo.direction === 'outgoing' ? 'Você' : 'Cliente'),
          message_type: replyingTo.message_type,
        };
        setReplyingTo(null);
      }

      const { error } = await supabase.functions.invoke('master-whatsapp-chat-send', { body });
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
      const ext = file.name.split('.').pop() || 'bin';
      const filePath = `master/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('whatsapp-chat-media')
        .upload(filePath, file, { contentType: file.type, cacheControl: '3600' });

      if (uploadError) {
        toast.error('Erro ao fazer upload do arquivo');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('whatsapp-chat-media')
        .getPublicUrl(filePath);

      let mediaType = 'document';
      if (file.type.startsWith('image/')) mediaType = 'image';
      else if (file.type.startsWith('video/')) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';

      const { error } = await supabase.functions.invoke('master-whatsapp-chat-send', {
        body: {
          remoteJid: conversation.remote_jid,
          content: caption || file.name,
          messageType: mediaType,
          mediaUrl: urlData.publicUrl,
          mediaFilename: file.name,
          mediaMimetype: file.type,
        },
      });

      if (error) {
        toast.error('Erro ao enviar mídia');
      }
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao enviar mídia');
    } finally {
      setSending(false);
    }
  };

  const handleReply = useCallback((msg: ChatMessage) => {
    setReplyingTo(msg);
  }, []);

  const handleEdit = useCallback(async (messageId: string, evolutionMessageId: string | null, newText: string): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('master-whatsapp-chat-send', {
        body: {
          remoteJid: conversation.remote_jid,
          messageType: 'editMessage',
          editMessageId: messageId,
          editEvolutionId: evolutionMessageId,
          editNewText: newText,
        },
      });
      if (error) {
        toast.error('Erro ao editar mensagem');
        return false;
      }
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, content: newText, metadata: { ...(m.metadata || {}), edited: true, edited_at: new Date().toISOString() } }
          : m
      ));
      toast.success('Mensagem editada!');
      return true;
    } catch {
      toast.error('Erro ao editar mensagem');
      return false;
    }
  }, [conversation.remote_jid]);

  const handleDelete = useCallback(async (messageId: string, evolutionMessageId: string | null): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('master-whatsapp-chat-send', {
        body: {
          remoteJid: conversation.remote_jid,
          messageType: 'deleteMessage',
          deleteMessageId: messageId,
          deleteEvolutionId: evolutionMessageId,
        },
      });
      if (error) {
        toast.error('Erro ao apagar mensagem');
        return false;
      }
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, content: '🚫 Mensagem apagada', media_url: null, media_filename: null, media_mimetype: null, message_type: 'text', metadata: { ...(m.metadata || {}), deleted: true } }
          : m
      ));
      toast.success('Mensagem apagada!');
      return true;
    } catch {
      toast.error('Erro ao apagar mensagem');
      return false;
    }
  }, [conversation.remote_jid]);

  const handleReact = useCallback(async (messageId: string, evolutionMessageId: string | null, emoji: string, messageDirection?: string) => {
    try {
      await supabase.functions.invoke('master-whatsapp-chat-send', {
        body: {
          remoteJid: conversation.remote_jid,
          messageType: 'reaction',
          reactionEmoji: emoji,
          reactionMessageId: messageId,
          reactionEvolutionId: evolutionMessageId,
          reactionFromMe: messageDirection === 'outgoing',
        },
      });
    } catch {
      toast.error('Erro ao enviar reação');
    }
  }, [conversation.remote_jid]);

  // Enviar solicitação de pagamento PIX
  const handleSendPaymentRequest = useCallback(async (data: PaymentRequestData) => {
    if (sending) return;
    setSending(true);
    try {
      const pixTypeMap: Record<string, string> = {
        cpf: 'CPF', cnpj: 'CNPJ', email: 'EMAIL', phone: 'PHONE', random: 'EVP',
      };

      const { error } = await supabase.functions.invoke('master-whatsapp-chat-send', {
        body: {
          remoteJid: conversation.remote_jid,
          messageType: 'payment_request',
          amount: data.amount,
          pixKey: data.pixKey,
          pixType: pixTypeMap[data.pixType] || 'EVP',
          pixName: data.pixName,
          paymentText: data.text,
          paymentItemName: data.itemName,
          paymentInvoiceNumber: data.invoiceNumber,
          paymentFooter: data.footer,
        },
      });

      if (error) {
        console.error('Erro ao enviar solicitação de pagamento:', error);
        toast.error('Erro ao enviar solicitação de pagamento');
      } else {
        toast.success('Solicitação de pagamento enviada!');
        setPaymentRequestOpen(false);
      }
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao enviar solicitação de pagamento');
    } finally {
      setSending(false);
    }
  }, [conversation.remote_jid, sending]);

  // Adaptar mensagens para o formato esperado pelo ChatMessageBubble
  const adaptedMessages = messages.map(toStoreChatMessage);

  // Renderizar timeline
  const renderTimeline = () => {
    let lastDateStr = '';

    return adaptedMessages.map((msg) => {
      const msgDate = new Date(msg.timestamp);
      const dateStr = format(msgDate, 'yyyy-MM-dd');
      const showDateSeparator = dateStr !== lastDateStr;
      lastDateStr = dateStr;

      return (
        <div key={`msg-${msg.id}`}>
          {showDateSeparator && <ChatDateSeparator date={msgDate} />}
          <ChatMessageBubble
            message={msg}
            onReply={handleReply}
            onReact={handleReact}
            onEdit={handleEdit}
            onDelete={handleDelete}
            allMessages={adaptedMessages}
          />
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      <MasterChatHeader
        conversation={conversation}
        configId={configId}
        onBack={onBack}
        onStatusChange={onStatusChange}
        onToggleContactPanel={() => setShowContactPanel(prev => !prev)}
        isContactPanelOpen={showContactPanel}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 overflow-hidden bg-[#e5ddd5] dark:bg-[#0b141a] chat-messages-bg">
            <style>{`
              .chat-messages-bg {
                background-image: url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='50' height='50' patternUnits='userSpaceOnUse' patternTransform='rotate(30)'%3E%3Cpath d='M5 25h8M25 5v8M37 25h8M25 37v8' stroke='%23c8c3ba' stroke-width='0.8' fill='none' opacity='0.5'/%3E%3Ccircle cx='12' cy='12' r='1.5' fill='%23c8c3ba' opacity='0.35'/%3E%3Ccircle cx='38' cy='38' r='1.5' fill='%23c8c3ba' opacity='0.35'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23p)'/%3E%3C/svg%3E");
              }
              .dark .chat-messages-bg {
                background-image: url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='50' height='50' patternUnits='userSpaceOnUse' patternTransform='rotate(30)'%3E%3Cpath d='M5 25h8M25 5v8M37 25h8M25 37v8' stroke='%23253040' stroke-width='0.6' fill='none' opacity='0.5'/%3E%3Ccircle cx='12' cy='12' r='1' fill='%23253040' opacity='0.3'/%3E%3Ccircle cx='38' cy='38' r='1' fill='%23253040' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23p)'/%3E%3C/svg%3E");
              }
            `}</style>
            <ScrollArea className="h-full">
              <div className="p-4 space-y-1">
                {hasMore && (
                  <div className="flex justify-center py-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={loadOlderMessages}
                      disabled={loadingMore}
                      className="gap-2 text-xs rounded-full shadow-sm"
                    >
                      {loadingMore ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ChevronUp className="w-3.5 h-3.5" />
                      )}
                      Carregar mensagens anteriores
                    </Button>
                  </div>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Nenhuma mensagem ainda
                  </div>
                ) : (
                  renderTimeline()
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {conversation.status === 'closed' ? (
            <div className="px-4 py-3 border-t border-border bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Conversa finalizada. Reabra para enviar mensagens.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  const { error } = await supabase
                    .from('master_whatsapp_conversations')
                    .update({ status: 'active' })
                    .eq('id', conversation.id);
                  if (error) {
                    toast.error('Erro ao reabrir conversa');
                  } else {
                    toast.success('Conversa reaberta');
                    onStatusChange?.('reopened');
                  }
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Reabrir conversa
              </Button>
            </div>
          ) : (
            <MasterChatInput
              onSend={handleSend}
              onSendMedia={handleSendMedia}
              onRequestPayment={() => setPaymentRequestOpen(true)}
              sending={sending}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              remoteJid={conversation.remote_jid}
            />
          )}
        </div>

        {/* Contact panel - inline toggle */}
        {showContactPanel && (
          <div className="w-[300px] border-l border-border flex-shrink-0 bg-background">
            <MasterContactInfoPanel
              conversation={conversation}
              configId={configId}
            />
          </div>
        )}
      </div>

      {/* Payment Request Dialog */}
      <PaymentRequestDialog
        open={paymentRequestOpen}
        onOpenChange={setPaymentRequestOpen}
        onSend={handleSendPaymentRequest}
        sending={sending}
        defaultText={conversation.contact_name ? `Cobrança para ${conversation.contact_name}` : ''}
      />
    </div>
  );
}
