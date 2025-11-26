import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items?: Database['public']['Tables']['order_items']['Row'][];
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
};

type OrderStatus = Database['public']['Enums']['order_status'];

const statusConfig = {
  entrada: {
    icon: '📥',
    label: 'Pedido Recebido',
    description: 'Aguardando confirmação da loja'
  },
  em_preparo: {
    icon: '👨‍🍳',
    label: 'Em Preparo',
    description: 'Seu pedido está sendo preparado com carinho'
  },
  aguarda_retirada: {
    icon: '📦',
    label: 'Aguardando Entregador', // Para delivery: aguardando entregador retirar
    description: 'Pedido pronto, aguardando entregador retirar'
  },
  em_transito: {
    icon: '🚴',
    label: 'Saiu para Entrega',
    description: 'O entregador está a caminho'
  },
  concluido: {
    icon: '✅',
    label: 'Pedido Entregue',
    description: 'Pedido concluído com sucesso'
  },
  cancelado: {
    icon: '❌',
    label: 'Cancelado',
    description: 'O pedido foi cancelado'
  }
};

export const useOrderTracking = (orderId: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | null>(null);
  
  // Ref para armazenar última versão do pedido (para polling)
  const orderRef = useRef<Order | null>(null);
  
  // Atualizar ref sempre que order mudar
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  const showStatusNotification = (newStatus: OrderStatus) => {
    const config = statusConfig[newStatus];
    
    toast({
      title: `${config.icon} ${config.label}`,
      description: config.description,
      duration: 5000,
    });
    
    // Vibração no mobile (se suportado)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          profiles:assigned_driver_id (
            full_name,
            avatar_url
          )
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Pedido não encontrado');

      setOrder(data as Order);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar pedido:', err);
      setError(err.message || 'Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    console.log('🚀 useOrderTracking: Inicializando para pedido:', orderId);

    // Buscar pedido inicial
    fetchOrder();

    // Configurar realtime subscription
    const channelName = `order-tracking-${orderId}-${Date.now()}`;
    console.log('📡 Criando channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('📨 Payload recebido:', payload);
          
          const newOrder = payload.new as Order;
          const oldOrder = payload.old as Order;
          
          console.log('🔄 Order update received:', {
            orderId: newOrder.id,
            oldStatus: oldOrder.status,
            newStatus: newOrder.status,
            deliveryType: newOrder.delivery_type,
            payloadKeys: Object.keys(payload.new || {})
          });
          
          // Atualizar estado imediatamente - FORÇAR atualização
          setOrder(prev => {
            if (!prev) {
              console.warn('⚠️ Não há order anterior, buscando completo...');
              fetchOrder();
              return prev;
            }
            
            const updated = {
              ...newOrder,
              order_items: prev.order_items || []
            };
            
            console.log('✅ Order state updated:', {
              oldStatus: prev.status,
              newStatus: updated.status,
              deliveryType: updated.delivery_type
            });
            
            return updated;
          });

          // Mostrar notificação apenas se o status mudou
          if (oldOrder.status !== newOrder.status) {
            console.log('📢 Status changed, showing notification');
            showStatusNotification(newOrder.status);
          } else {
            console.log('ℹ️ Status não mudou, apenas outros campos atualizados');
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        setSubscriptionStatus(status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription ativa para pedido:', orderId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscription (CHANNEL_ERROR), usando fallback de polling');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Timeout na subscription, usando fallback de polling');
        } else {
          console.warn('⚠️ Status desconhecido da subscription:', status);
        }
      });

    // Fallback: Polling periódico SIMPLES (sempre ativo a cada 3 segundos)
    // Isso garante atualização mesmo se realtime falhar
    const pollingInterval = setInterval(() => {
      // Usar ref para pegar a versão mais recente do pedido
      const currentOrder = orderRef.current;
      
      if (currentOrder && !loading) {
        // Buscar apenas status e updated_at (leve)
        supabase
          .from('orders')
          .select('status, delivery_type, completed_at, updated_at')
          .eq('id', orderId)
          .single()
          .then(({ data, error }) => {
            if (error) return;
            
            if (data && currentOrder) {
              // Comparar com a versão atual (usando ref)
              const statusChanged = data.status !== currentOrder.status;
              const timeChanged = data.updated_at !== currentOrder.updated_at;
              
              if (statusChanged || timeChanged) {
                console.log('🔄 Mudança detectada via polling:', {
                  oldStatus: currentOrder.status,
                  newStatus: data.status
                });
                
                // Recarregar pedido completo
                fetchOrder();
                
                if (statusChanged && data.status) {
                  showStatusNotification(data.status);
                }
              }
            }
          });
      }
    }, 3000); // A cada 3 segundos (mais frequente)

    // Cleanup
    return () => {
      console.log('🔌 Removendo subscription e polling:', channelName);
      clearInterval(pollingInterval);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]); // Apenas orderId como dependência para evitar re-subscriptions

  return { order, loading, error };
};
