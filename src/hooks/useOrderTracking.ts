import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items?: Database['public']['Tables']['order_items']['Row'][];
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
  stores?: {
    slug: string;
    name: string;
    logo_url?: string;
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
    label: 'Aguardando Entregador',
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

// Intervalo de fallback apenas quando Realtime falha (30s em vez de 3s)
const FALLBACK_POLLING_INTERVAL = 30000;

export const useOrderTracking = (orderId: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<REALTIME_SUBSCRIBE_STATES | null>(null);
  
  // Refs para polling fallback
  const orderRef = useRef<Order | null>(null);
  const loadingRef = useRef<boolean>(true);
  // Controla se o Realtime falhou e precisamos de polling
  const realtimeFailedRef = useRef<boolean>(false);
  
  useEffect(() => {
    orderRef.current = order;
  }, [order]);
  
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const showStatusNotification = (newStatus: OrderStatus) => {
    const config = statusConfig[newStatus];
    
    toast({
      title: `${config.icon} ${config.label}`,
      description: config.description,
      duration: 5000,
    });
    
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
          ),
          stores:store_id (
            slug,
            name,
            logo_url
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
    realtimeFailedRef.current = false;

    // Buscar pedido inicial
    fetchOrder();

    // Configurar realtime subscription
    const channelName = `order-tracking-${orderId}-${Date.now()}`;
    
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
          console.log('📨 Realtime payload recebido para tracking');
          
          const newOrder = payload.new as Order;
          const oldOrder = payload.old as Order;
          
          // Atualizar estado imediatamente
          setOrder(prev => {
            if (!prev) {
              fetchOrder();
              return prev;
            }
            
            return {
              ...newOrder,
              order_items: prev.order_items || []
            };
          });

          // Notificação apenas se status mudou
          if (oldOrder.status !== newOrder.status) {
            showStatusNotification(newOrder.status);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Tracking subscription status:', status);
        setSubscriptionStatus(status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime ativo para tracking do pedido:', orderId);
          realtimeFailedRef.current = false;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Realtime falhou, ativando fallback polling (30s)');
          realtimeFailedRef.current = true;
        }
      });

    // Fallback: polling CONDICIONAL — apenas se Realtime falhar, a cada 30s
    const pollingInterval = setInterval(() => {
      // Só executa se Realtime falhou
      if (!realtimeFailedRef.current) return;
      
      const currentOrder = orderRef.current;
      const isLoading = loadingRef.current;
      
      if (currentOrder && !isLoading) {
        supabase
          .from('orders')
          .select('status, delivery_type, completed_at, updated_at, estimated_delivery_minutes')
          .eq('id', orderId)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error || !data || !currentOrder) return;
            
            const statusChanged = data.status !== currentOrder.status;
            const timeChanged = data.updated_at !== currentOrder.updated_at;
            
            if (statusChanged || timeChanged) {
              console.log('✅ Mudança detectada via fallback polling');
              fetchOrder();
              if (statusChanged && data.status) {
                showStatusNotification(data.status);
              }
            }
          });
      }
    }, FALLBACK_POLLING_INTERVAL);

    // Cleanup
    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return { order, loading, error };
};
