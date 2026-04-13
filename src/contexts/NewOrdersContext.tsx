import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { playOrderAlertLoop, stopOrderAlertLoop, getSelectedSound } from '@/utils/soundPlayer';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { sendNativeNotification } from '@/utils/nativeNotifications';
import { useModuleEnabled } from '@/hooks/useModuleEnabled';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  total: number;
  status: string;
  delivery_type: string;
  created_at: string;
  scheduled_for: string | null;
}

interface NewOrdersContextType {
  pendingOrders: Order[];
  pendingOrdersCount: number;
  dismissOrder: (orderId: string) => void;
  goToOrders: () => void;
}

const NewOrdersContext = createContext<NewOrdersContextType | undefined>(undefined);

export function NewOrdersProvider({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();
  const { storeId } = useStoreAccess();
  const { sendNotification, permission } = useNotificationPermission();
  const orderModuleEnabled = useModuleEnabled('order_management');
  
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [shownOrderIds, setShownOrderIds] = useState<Set<string>>(new Set());

  // Refs para valores usados no callback do Realtime (evita recriar channel)
  const soundEnabledRef = useRef(soundEnabled);
  const permissionRef = useRef(permission);
  const sendNotificationRef = useRef(sendNotification);

  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { permissionRef.current = permission; }, [permission]);
  useEffect(() => { sendNotificationRef.current = sendNotification; }, [sendNotification]);

  // Carregar preferência de som
  useEffect(() => {
    const savedSound = localStorage.getItem('orderSoundEnabled');
    setSoundEnabled(savedSound !== 'false');
  }, []);

  // Buscar pedidos pendentes iniciais (guard por módulo)
  useEffect(() => {
    if (!storeId || !orderModuleEnabled || userRole === 'master_admin' || userRole === 'customer' || userRole === 'delivery_driver') {
      return;
    }

    const fetchPendingOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, customer_address, total, status, delivery_type, created_at')
        .eq('store_id', storeId)
        .eq('status', 'entrada')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPendingOrders(data);
        console.log('🔔 NewOrdersContext: Pedidos pendentes carregados:', data.length);
      }
    };

    fetchPendingOrders();
  }, [storeId, userRole, orderModuleEnabled]);

  // Realtime subscription para novos pedidos (guard por módulo)
  const realtimeActiveRef = useRef(false);

  useEffect(() => {
    if (!storeId || !orderModuleEnabled || userRole === 'master_admin' || userRole === 'customer' || userRole === 'delivery_driver') {
      return;
    }

    console.log('🔔 NewOrdersContext: Iniciando subscription para store:', storeId);
    realtimeActiveRef.current = false;

    const channel = supabase
      .channel(`new-orders-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          const newOrder = payload.new as Order;
          console.log('🔔 NewOrdersContext: Novo pedido recebido via Realtime:', newOrder);

          if (newOrder.status === 'entrada') {
            setPendingOrders((prev) => {
              // Evitar duplicatas
              if (prev.some(o => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
            
            // Usar refs para valores dinâmicos
            if (soundEnabledRef.current) {
              playOrderAlertLoop(getSelectedSound());
            }

            // Enviar notificação nativa
            (async () => {
              await sendNativeNotification({
                title: `🔔 Novo Pedido! - ${newOrder.order_number}`,
                body: `${newOrder.customer_name} - R$ ${newOrder.total.toFixed(2)}`,
                sound: true,
              });
            })();

            // Fallback para notificação web padrão
            if (permissionRef.current === 'granted') {
              sendNotificationRef.current(`🔔 Novo Pedido! - ${newOrder.order_number}`, {
                body: `${newOrder.customer_name} - R$ ${newOrder.total.toFixed(2)}`,
                tag: `order-${newOrder.id}`,
                requireInteraction: true,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          const updatedOrder = payload.new as Order;

          if (updatedOrder.status !== 'entrada') {
            setPendingOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
          } else {
            setPendingOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 NewOrdersContext: Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          realtimeActiveRef.current = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          realtimeActiveRef.current = false;
        }
      });

    return () => {
      console.log('🔔 NewOrdersContext: Removendo subscription');
      realtimeActiveRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [storeId, userRole, orderModuleEnabled]);

  // Polling fallback (30s) — detecta pedidos que o Realtime pode ter perdido
  useEffect(() => {
    if (!storeId || !orderModuleEnabled || userRole === 'master_admin' || userRole === 'customer' || userRole === 'delivery_driver') {
      return;
    }

    const pollInterval = setInterval(async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, customer_address, total, status, delivery_type, created_at')
        .eq('store_id', storeId)
        .eq('status', 'entrada')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPendingOrders(prev => {
          const prevIds = new Set(prev.map(o => o.id));
          const newOrders = data.filter(o => !prevIds.has(o.id));
          
          if (newOrders.length > 0) {
            console.log('🔔 Polling: Detectados', newOrders.length, 'novos pedidos que Realtime perdeu');
            
            // Tocar som e notificar para pedidos novos detectados
            if (soundEnabledRef.current) {
              playOrderAlertLoop(getSelectedSound());
            }
            
            newOrders.forEach(async (order) => {
              await sendNativeNotification({
                title: `🔔 Novo Pedido! - ${order.order_number}`,
                body: `${order.customer_name} - R$ ${order.total.toFixed(2)}`,
                sound: true,
              });
            });
            
            return [...newOrders, ...prev];
          }
          
          // Remover pedidos que não estão mais como 'entrada'
          const activeIds = new Set(data.map(o => o.id));
          const filtered = prev.filter(o => activeIds.has(o.id));
          if (filtered.length !== prev.length) {
            return filtered;
          }
          
          return prev;
        });
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [storeId, userRole, orderModuleEnabled]);

  // Gerenciar som em loop baseado em pedidos pendentes
  useEffect(() => {
    if (pendingOrders.length > 0 && soundEnabled) {
      playOrderAlertLoop(getSelectedSound());
    } else {
      stopOrderAlertLoop();
    }

    return () => {
      stopOrderAlertLoop();
    };
  }, [pendingOrders.length, soundEnabled]);

  const dismissOrder = (orderId: string) => {
    setShownOrderIds((prev) => new Set(prev).add(orderId));
  };

  const goToOrders = () => {
    window.location.href = '/dashboard/orders';
  };

  const value: NewOrdersContextType = {
    pendingOrders: pendingOrders.filter((o) => !shownOrderIds.has(o.id)),
    pendingOrdersCount: pendingOrders.length,
    dismissOrder,
    goToOrders,
  };

  return (
    <NewOrdersContext.Provider value={value}>
      {children}
    </NewOrdersContext.Provider>
  );
}

export function useNewOrders() {
  const context = useContext(NewOrdersContext);
  if (context === undefined) {
    throw new Error('useNewOrders must be used within NewOrdersProvider');
  }
  return context;
}
