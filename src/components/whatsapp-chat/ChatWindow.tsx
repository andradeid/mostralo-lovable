import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatHeader } from './ChatHeader';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatDateSeparator } from './ChatDateSeparator';
import { ChatInput } from './ChatInput';
import { ProductSearchModal } from './ProductSearchModal';
import { ChatCartDrawer, type CartItem } from './ChatCartDrawer';
import { CreateOrderDialog, type CreateOrderCustomer } from '@/components/admin/orders/CreateOrderDialog';
import type { OrderItem } from '@/components/admin/orders/ProductSelector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ChevronUp, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Conversation, ChatMessage } from '@/pages/admin/WhatsAppChatPage';

const PAGE_SIZE = 100;

interface ChatWindowProps {
  conversation: Conversation;
  storeId: string;
  onBack?: () => void;
  onStatusChange?: (action: 'closed' | 'reopened') => void;
}

interface ConversationCycle {
  id: string;
  store_id: string;
  remote_jid: string;
  opened_at: string;
  closed_at: string | null;
}

export function ChatWindow({ conversation, storeId, onBack, onStatusChange }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationCycles, setConversationCycles] = useState<ConversationCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);

  // Carrinho por conversa (Map persistido via useRef para manter entre trocas de conversa)
  const cartsRef = useRef<Map<string, CartItem[]>>(new Map());
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const prevConvIdRef = useRef<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);

  // Carregar mensagens mais recentes primeiro
  const fetchMessages = useCallback(async (beforeTimestamp?: string) => {
    let query = supabase
      .from('whatsapp_chat_messages')
      .select('*')
      .eq('store_id', storeId)
      .eq('remote_jid', conversation.remote_jid)
      .order('timestamp', { ascending: false })
      .limit(PAGE_SIZE);

    if (beforeTimestamp) {
      query = query.lt('timestamp', beforeTimestamp);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return { messages: [], hasMore: false };
    }

    const sorted = (data || []).reverse() as ChatMessage[];
    return { messages: sorted, hasMore: sorted.length === PAGE_SIZE };
  }, [storeId, conversation.remote_jid]);

  const fetchConversationCycles = useCallback(async () => {
    const { data, error } = await supabase
      .from('whatsapp_conversation_cycles')
      .select('id, store_id, remote_jid, opened_at, closed_at')
      .eq('store_id', storeId)
      .eq('remote_jid', conversation.remote_jid)
      .order('opened_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar ciclos de conversa:', error);
      return [] as ConversationCycle[];
    }

    return (data || []) as ConversationCycle[];
  }, [storeId, conversation.remote_jid]);

  // Carregar mensagens iniciais
  useEffect(() => {
    if (!conversation) return;

    if (prevConvIdRef.current !== conversation.id) {
      // Salvar carrinho da conversa anterior
      if (prevConvIdRef.current) {
        cartsRef.current.set(prevConvIdRef.current, cartItems);
      }
      setMessages([]);
      setConversationCycles([]);
      setLoading(true);
      setHasMore(false);
      setReplyingTo(null);
      isInitialLoadRef.current = true;
      prevConvIdRef.current = conversation.id;
      // Restaurar carrinho da nova conversa
      setCartItems(cartsRef.current.get(conversation.id) || []);
    }

    const load = async () => {
      const [messageResult, cycleResult] = await Promise.all([
        fetchMessages(),
        fetchConversationCycles(),
      ]);

      setMessages(messageResult.messages);
      setHasMore(messageResult.hasMore);
      setConversationCycles(cycleResult);
      setLoading(false);
    };

    load();

    // Realtime subscription
    const channel = supabase
      .channel(`chat_messages_${conversation.remote_jid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_chat_messages',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as ChatMessage;
            if (newMsg.remote_jid === conversation.remote_jid) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ChatMessage;
            if (updated.remote_jid === conversation.remote_jid) {
              setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_conversation_cycles',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const cycleRow = ((payload.new || payload.old) as ConversationCycle | undefined);
          if (!cycleRow || cycleRow.remote_jid !== conversation.remote_jid) return;

          if (payload.eventType === 'INSERT') {
            setConversationCycles((prev) => {
              if (prev.some((cycle) => cycle.id === cycleRow.id)) return prev;
              return [...prev, cycleRow].sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime());
            });
            return;
          }

          if (payload.eventType === 'UPDATE') {
            setConversationCycles((prev) => prev.map((cycle) => cycle.id === cycleRow.id ? cycleRow : cycle));
            return;
          }

          if (payload.eventType === 'DELETE') {
            setConversationCycles((prev) => prev.filter((cycle) => cycle.id !== cycleRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation, storeId, fetchMessages, fetchConversationCycles]);

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

  // Carregar mensagens anteriores
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

  // Auto-assign: atribuir atendente à conversa se não tem assigned_to
  const autoAssignAttendant = useCallback(async () => {
    if (conversation.assigned_to) return; // Já tem atendente atribuído
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from('whatsapp_conversations')
        .update({ assigned_to: user.id })
        .eq('id', conversation.id)
        .is('assigned_to', null); // Só atribuir se ainda não tem
    } catch (err) {
      console.error('Erro ao auto-atribuir atendente:', err);
    }
  }, [conversation.id, conversation.assigned_to]);

  const handleSend = async (content: string) => {
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      // Auto-assign ao enviar primeira mensagem
      await autoAssignAttendant();

      const body: Record<string, any> = {
        storeId,
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

      const { error } = await supabase.functions.invoke('whatsapp-chat-send', { body });

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

      const { data: urlData } = supabase.storage
        .from('whatsapp-chat-media')
        .getPublicUrl(filePath);

      const mediaUrl = urlData.publicUrl;

      let mediaType = 'document';
      if (file.type.startsWith('image/')) mediaType = 'image';
      else if (file.type.startsWith('video/')) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';

      const body: Record<string, any> = {
        storeId,
        remoteJid: conversation.remote_jid,
        content: caption || file.name,
        messageType: mediaType,
        mediaUrl,
        mediaFilename: file.name,
        mediaMimetype: file.type,
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

      const { error } = await supabase.functions.invoke('whatsapp-chat-send', { body });

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

  const handleReply = useCallback((msg: ChatMessage) => {
    setReplyingTo(msg);
  }, []);

  const handleSendProduct = useCallback(async (product: { id: string; name: string; price: number; image_url: string | null }) => {
    if (sending) return;
    setSending(true);

    try {
      const priceFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price);
      const caption = `*${product.name}*\n💰 ${priceFormatted}`;

      if (product.image_url) {
        // Enviar como imagem com legenda
        const { error } = await supabase.functions.invoke('whatsapp-chat-send', {
          body: {
            storeId,
            remoteJid: conversation.remote_jid,
            content: caption,
            messageType: 'image',
            mediaUrl: product.image_url,
            mediaFilename: `${product.name}.jpg`,
            mediaMimetype: 'image/jpeg',
          },
        });
        if (error) throw error;
      } else {
        // Sem imagem, enviar como texto
        const { error } = await supabase.functions.invoke('whatsapp-chat-send', {
          body: {
            storeId,
            remoteJid: conversation.remote_jid,
            content: caption,
            messageType: 'text',
          },
        });
        if (error) throw error;
      }

      setProductSearchOpen(false);
      toast.success('Produto enviado!');
    } catch (err) {
      console.error('Erro ao enviar produto:', err);
      toast.error('Erro ao enviar produto');
    } finally {
      setSending(false);
    }
  }, [storeId, conversation.remote_jid, sending]);

  const handleReact = useCallback(async (messageId: string, evolutionMessageId: string | null, emoji: string, messageDirection?: string) => {
    try {
      const { error } = await supabase.functions.invoke('whatsapp-chat-send', {
        body: {
          storeId,
          remoteJid: conversation.remote_jid,
          messageType: 'reaction',
          reactionEmoji: emoji,
          reactionMessageId: messageId,
          reactionEvolutionId: evolutionMessageId,
          reactionFromMe: messageDirection === 'outgoing',
        },
      });

      if (error) {
        console.error('Erro ao reagir:', error);
        toast.error('Erro ao enviar reação');
      }
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao enviar reação');
    }
  }, [storeId, conversation.remote_jid]);

  // === Handlers do Carrinho ===
  const handleAddToCart = useCallback((product: { id: string; name: string; price: number; image_url: string | null }) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const updated = prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
        cartsRef.current.set(conversation.id, updated);
        return updated;
      }
      const newItems = [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, image_url: product.image_url }];
      cartsRef.current.set(conversation.id, newItems);
      return newItems;
    });
    toast.success('Produto adicionado ao carrinho');
  }, [conversation.id]);

  const handleUpdateCartQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems(prev => {
      const updated = prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      cartsRef.current.set(conversation.id, updated);
      return updated;
    });
  }, [conversation.id]);

  const handleRemoveCartItem = useCallback((productId: string) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.id !== productId);
      cartsRef.current.set(conversation.id, updated);
      return updated;
    });
  }, [conversation.id]);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    cartsRef.current.set(conversation.id, []);
  }, [conversation.id]);

  const handleFinalizeCart = useCallback(() => {
    setCartOpen(false);
    setCreateOrderOpen(true);
  }, []);

  // Montar prefilledCustomer para o CreateOrderDialog
  const prefilledCustomer: CreateOrderCustomer | null = conversation.contact_name
    ? {
        id: '',
        name: conversation.contact_name || conversation.phone_number,
        phone: conversation.phone_number,
      }
    : {
        id: '',
        name: conversation.phone_number,
        phone: conversation.phone_number,
      };

  // Converter CartItems para OrderItems para pré-preencher o pedido
  const prefilledOrderItems: OrderItem[] = cartItems.map(item => ({
    productId: item.id,
    productName: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    subtotal: item.price * item.quantity,
    addons: [],
  }));

  // Construir timeline unificada mesclando mensagens e ciclos
  const renderTimeline = () => {
    type TimelineItem =
      | { type: 'message'; data: ChatMessage; ts: number }
      | { type: 'cycle_open'; cycle: ConversationCycle; cycleIndex: number; ts: number }
      | { type: 'cycle_close'; cycle: ConversationCycle; cycleIndex: number; ts: number };

    const timeline: TimelineItem[] = [];

    messages.forEach((msg) => {
      timeline.push({ type: 'message', data: msg, ts: new Date(msg.timestamp).getTime() });
    });

    conversationCycles.forEach((cycle, idx) => {
      timeline.push({ type: 'cycle_open', cycle, cycleIndex: idx, ts: new Date(cycle.opened_at).getTime() });
      if (cycle.closed_at) {
        timeline.push({ type: 'cycle_close', cycle, cycleIndex: idx, ts: new Date(cycle.closed_at).getTime() });
      }
    });

    timeline.sort((a, b) => a.ts - b.ts);

    let lastDateStr = '';

    return timeline.map((item) => {
      const itemDate = new Date(item.ts);
      const dateStr = format(itemDate, 'yyyy-MM-dd');
      const showDateSeparator = dateStr !== lastDateStr;
      lastDateStr = dateStr;

      if (item.type === 'message') {
        const msg = item.data;
        return (
          <div key={`msg-${msg.id}`}>
            {showDateSeparator && <ChatDateSeparator date={itemDate} />}
            <ChatMessageBubble
              message={msg}
              onReply={handleReply}
              onReact={handleReact}
              allMessages={messages}
            />
          </div>
        );
      }

      if (item.type === 'cycle_open') {
        return (
          <div key={`cycle-open-${item.cycle.id}`}>
            {showDateSeparator && <ChatDateSeparator date={itemDate} />}
            <div className="flex justify-center my-2">
              <span className="bg-primary/10 text-primary text-[11px] px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                Conversa {item.cycleIndex + 1} iniciada em {format(itemDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          </div>
        );
      }

      // cycle_close
      return (
        <div key={`cycle-close-${item.cycle.id}`}>
          {showDateSeparator && <ChatDateSeparator date={itemDate} />}
          <div className="flex justify-center my-2">
            <span className="bg-destructive/10 text-destructive text-[11px] px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Conversa {item.cycleIndex + 1} finalizada em {format(itemDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>
      );
    });
  };

  // Mobile keyboard handling - ajusta a altura quando o teclado virtual abre
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      setViewportHeight(vv.height);
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, []);

  const containerStyle = viewportHeight
    ? { height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` }
    : {};

  return (
    <div className="flex flex-col h-full" style={containerStyle}>
      <ChatHeader conversation={conversation} onBack={onBack} onStatusChange={onStatusChange} />

      <div className="flex-1 overflow-hidden bg-[#d9dbd2] dark:bg-[#0b141a] chat-messages-bg">
        <style>{`
          .chat-messages-bg {
            background-image: url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='50' height='50' patternUnits='userSpaceOnUse' patternTransform='rotate(30)'%3E%3Cpath d='M5 25h8M25 5v8M37 25h8M25 37v8' stroke='%23b8bdb0' stroke-width='0.8' fill='none' opacity='0.6'/%3E%3Ccircle cx='12' cy='12' r='1.5' fill='%23b8bdb0' opacity='0.4'/%3E%3Ccircle cx='38' cy='38' r='1.5' fill='%23b8bdb0' opacity='0.4'/%3E%3Ccircle cx='25' cy='25' r='1' fill='%23b8bdb0' opacity='0.3'/%3E%3Crect x='0' y='0' width='3' height='3' rx='0.5' fill='%23b8bdb0' opacity='0.2' transform='translate(35,10)'/%3E%3Crect x='0' y='0' width='3' height='3' rx='0.5' fill='%23b8bdb0' opacity='0.2' transform='translate(8,40)'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23p)'/%3E%3C/svg%3E");
          }
          .dark .chat-messages-bg {
            background-image: url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='p' width='50' height='50' patternUnits='userSpaceOnUse' patternTransform='rotate(30)'%3E%3Cpath d='M5 25h8M25 5v8M37 25h8M25 37v8' stroke='%23253040' stroke-width='0.6' fill='none' opacity='0.5'/%3E%3Ccircle cx='12' cy='12' r='1' fill='%23253040' opacity='0.3'/%3E%3Ccircle cx='38' cy='38' r='1' fill='%23253040' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23p)'/%3E%3C/svg%3E");
          }
        `}</style>
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-1">
            {hasMore && (
              <div className="flex justify-center py-2" ref={messagesTopRef}>
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
            ) : messages.length === 0 && conversationCycles.length === 0 ? (
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
            Esta conversa foi finalizada. Reabra para enviar mensagens.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={async () => {
              const { error } = await supabase
                .from('whatsapp_conversations')
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
        <ChatInput
          onSend={handleSend}
          onSendMedia={handleSendMedia}
          onOpenProductSearch={() => setProductSearchOpen(true)}
          onOpenCart={() => setCartOpen(true)}
          cartItemCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
          cartTotal={cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)}
          sending={sending}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      )}

      <ProductSearchModal
        open={productSearchOpen}
        onOpenChange={setProductSearchOpen}
        storeId={storeId}
        onSendProduct={handleSendProduct}
        onAddToCart={handleAddToCart}
        sending={sending}
      />

      <ChatCartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onFinalize={handleFinalizeCart}
      />

      <CreateOrderDialog
        open={createOrderOpen}
        onOpenChange={setCreateOrderOpen}
        onSuccess={() => {
          setCreateOrderOpen(false);
          handleClearCart();
          toast.success('Pedido criado com sucesso!');
        }}
        prefilledCustomer={prefilledCustomer}
        prefilledItems={prefilledOrderItems}
        source="whatsapp_chat"
      />
    </div>
  );
}
