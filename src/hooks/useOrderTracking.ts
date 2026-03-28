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

const FALLBACK_POLLING_INTERVAL = 30000;

/**
 * Tenta encontrar customer token e store_id no localStorage.
 * Os tokens são salvos com chave `customer_${storeId}`.
 */
function findCustomerTokenFromLocalStorage(): { token: string; storeId: string } | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('customer_')) {
        const storeId = key.replace('customer_', '');
        // Validar que parece um UUID
        if (/^[0-9a-f]{8}-/.test(storeId)) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const parsed = JSON.parse(value);
              if (parsed?.token) {
                return { token: parsed.token, storeId };
              }
            } catch {
              // Se não é JSON, pode ser o token direto
              if (value.length > 10) {
                return { token: value, storeId };
              }
            }
          }
        }
      }
    }
  } catch {
    // localStorage pode estar indisponível
  }
  return null;
}

export const useOrderTracking = (orderId: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<REALTIME_SUBSCRIBE_STATES | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  
  const orderRef = useRef<Order | null>(null);
  const loadingRef = useRef<boolean>(true);
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

  const fetchOrderViaEdgeFunction = async (): Promise<Order | null> => {
    const customerData = findCustomerTokenFromLocalStorage();
    if (!customerData) return null;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('guest-order-tracking', {
        body: {
          order_id: orderId,
          customer_token: customerData.token,
          store_id: customerData.storeId,
        }
      });

      if (fnError || data?.error) {
        console.error('❌ Edge function error:', fnError || data?.error);
        return null;
      }

      return data as Order;
    } catch (err) {
      console.error('❌ Edge function fetch failed:', err);
      return null;
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);

      // Primeiro: tentar busca direta (funciona para usuários autenticados)
      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session) {
        // Usuário autenticado: busca direta via Supabase client
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
          .maybeSingle();

        if (data) {
          setOrder(data as Order);
          setError(null);
          return;
        }
        
        // Se não encontrou mesmo autenticado, pode ser RLS - tentar edge function
        if (fetchError) {
          console.warn('⚠️ Busca direta falhou, tentando edge function:', fetchError.message);
        }
      }

      // Fallback: buscar via edge function (guest checkout)
      const edgeOrder = await fetchOrderViaEdgeFunction();
      if (edgeOrder) {
        setOrder(edgeOrder);
        setError(null);
        return;
      }

      throw new Error('Pedido não encontrado');
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
          
          setOrder(prev => {
            if (!prev) {
              fetchOrder();
              return prev;
            }
            
            return {
              ...newOrder,
              order_items: prev.order_items || [],
              stores: prev.stores,
              profiles: prev.profiles,
            };
          });

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

    // Fallback polling condicional
    const pollingInterval = setInterval(() => {
      if (!realtimeFailedRef.current) return;
      
      const currentOrder = orderRef.current;
      const isLoading = loadingRef.current;
      
      if (currentOrder && !isLoading) {
        // Para guest, usar edge function no polling também
        fetchOrder();
      }
    }, FALLBACK_POLLING_INTERVAL);

    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const refetch = async () => {
    setIsRefetching(true);
    await fetchOrder();
    setIsRefetching(false);
  };

  return { order, loading, error, refetch, isRefetching };
