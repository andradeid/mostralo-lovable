import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { playOrderAlertLoop, stopOrderAlertLoop, getSelectedSound } from '@/utils/soundPlayer';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  status: string;
  created_at: string;
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
  
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [shownOrderIds, setShownOrderIds] = useState<Set<string>>(new Set());

  // Carregar preferência de som
  useEffect(() => {
    const savedSound = localStorage.getItem('orderSoundEnabled');
    setSoundEnabled(savedSound !== 'false');
  }, []);

  // Buscar pedidos pendentes iniciais
  useEffect(() => {
    if (!storeId || userRole === 'master_admin' || userRole === 'customer' || userRole === 'delivery_driver') {
      return;
    }

    const fetchPendingOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, total, status, created_at')
        .eq('store_id', storeId)
        .eq('status', 'entrada')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPendingOrders(data);
        console.log('🔔 NewOrdersContext: Pedidos pendentes carregados:', data.length);
      }
    };

    fetchPendingOrders();
  }, [storeId, userRole]);

  // Realtime subscription para novos pedidos
  useEffect(() => {
    if (!storeId || userRole === 'master_admin' || userRole === 'customer' || userRole === 'delivery_driver') {
      return;
    }

    console.log('🔔 NewOrdersContext: Iniciando subscription para store:', storeId);

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
          console.log('🔔 NewOrdersContext: Novo pedido recebido:', newOrder);

          if (newOrder.status === 'entrada') {
            setPendingOrders((prev) => [newOrder, ...prev]);
            
            // Tocar som se estiver habilitado
            if (soundEnabled) {
              playOrderAlertLoop(getSelectedSound());
            }

            // Enviar notificação do browser
            if (permission === 'granted') {
              sendNotification(`🔔 Novo Pedido! - ${newOrder.order_number}`, {
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
          console.log('🔄 NewOrdersContext: Pedido atualizado:', updatedOrder);

          if (updatedOrder.status !== 'entrada') {
            // Remover da lista se não for mais "entrada"
            setPendingOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
          } else {
            // Atualizar na lista
            setPendingOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 NewOrdersContext: Subscription status:', status);
      });

    return () => {
      console.log('🔔 NewOrdersContext: Removendo subscription');
      supabase.removeChannel(channel);
    };
  }, [storeId, userRole, soundEnabled, permission, sendNotification]);

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
