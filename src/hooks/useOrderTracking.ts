import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { usePageVisibility } from '@/hooks/usePageVisibility';

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

const ACTIVE_VISIBLE_INTERVAL = 8000;
const ACTIVE_HIDDEN_INTERVAL = 20000;
const FINISHED_VISIBLE_INTERVAL = 60000;

const FINAL_STATUSES: OrderStatus[] = ['concluido', 'cancelado'];

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
  const [isRefetching, setIsRefetching] = useState(false);
  const isPageVisible = usePageVisibility();

  const lastKnownStatusRef = useRef<OrderStatus | null>(null);

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

  const fetchOrderViaEdgeFunction = useCallback(async (): Promise<Order | null> => {
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
  }, [orderId]);

  const applyFetchedOrder = useCallback((nextOrder: Order) => {
    const previousStatus = lastKnownStatusRef.current;

    setOrder(nextOrder);
    setError(null);

    if (previousStatus && previousStatus !== nextOrder.status) {
      showStatusNotification(nextOrder.status);
    }

    lastKnownStatusRef.current = nextOrder.status;
  }, []);

  const fetchOrder = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const { data: session } = await supabase.auth.getSession();

      if (session?.session) {
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
          applyFetchedOrder(data as Order);
          return;
        }

        if (fetchError) {
          console.warn('⚠️ Busca direta falhou, tentando edge function:', fetchError.message);
        }
      }

      const edgeOrder = await fetchOrderViaEdgeFunction();
      if (edgeOrder) {
        applyFetchedOrder(edgeOrder);
        return;
      }

      throw new Error('Pedido não encontrado');
    } catch (err: any) {
      console.error('Erro ao buscar pedido:', err);
      setError(err.message || 'Erro ao carregar pedido');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [applyFetchedOrder, fetchOrderViaEdgeFunction, orderId]);

  const pollingInterval = useMemo(() => {
    const isFinalStatus = order?.status ? FINAL_STATUSES.includes(order.status) : false;

    if (isFinalStatus) {
      return isPageVisible ? FINISHED_VISIBLE_INTERVAL : false;
    }

    return isPageVisible ? ACTIVE_VISIBLE_INTERVAL : ACTIVE_HIDDEN_INTERVAL;
  }, [isPageVisible, order?.status]);

  useEffect(() => {
    if (!orderId) return;

    console.log('🚀 useOrderTracking: inicializando polling para pedido:', orderId);
    lastKnownStatusRef.current = null;
    fetchOrder();

    return () => {
      lastKnownStatusRef.current = null;
    };
  }, [fetchOrder, orderId]);

  useEffect(() => {
    if (!orderId || !pollingInterval) return;

    const interval = window.setInterval(() => {
      fetchOrder({ silent: true });
    }, pollingInterval);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchOrder, orderId, pollingInterval]);

  const refetch = useCallback(async () => {
    setIsRefetching(true);
    await fetchOrder({ silent: true });
    setIsRefetching(false);
  }, [fetchOrder]);

  return { order, loading, error, refetch, isRefetching };
};
