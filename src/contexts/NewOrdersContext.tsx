import { formatBRL } from '@/lib/scheduledOrders';
import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { playNewOrderSound } from '@/utils/soundPlayer';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { sendNativeNotification } from '@/utils/nativeNotifications';
import { useModuleEnabled } from '@/hooks/useModuleEnabled';

interface Order {
  store_id: string;
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
  const [shownOrderIds, setShownOrderIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('dismissed-scheduled-orders') || '[]')); } catch { return new Set(); }
  });
  const notifiedScheduledIdsRef = useRef<Set<string>>((() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem('notified-scheduled-orders') || '[]')); } catch { return new Set<string>(); }
  })());
  const [isVisible, setIsVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden
  );
  const hasLoadedInitialSnapshotRef = useRef(false);
  const previousPendingIdsRef = useRef<Set<string>>(new Set());

  const soundEnabledRef = useRef(soundEnabled);
  const permissionRef = useRef(permission);
  const sendNotificationRef = useRef(sendNotification);

  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { permissionRef.current = permission; }, [permission]);
  useEffect(() => { sendNotificationRef.current = sendNotification; }, [sendNotification]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Carregar preferência de som
  useEffect(() => {
    const savedSound = localStorage.getItem('orderSoundEnabled');
    setSoundEnabled(savedSound !== 'false');
  }, []);

  const notifyNewOrders = useCallback(async (newOrders: Order[]) => {
    newOrders = newOrders.filter(order => !order.scheduled_for || !notifiedScheduledIdsRef.current.has(order.id));
    if (newOrders.length === 0) return;
    for (const order of newOrders) if (order.scheduled_for) notifiedScheduledIdsRef.current.add(order.id);
    try { localStorage.setItem('notified-scheduled-orders', JSON.stringify([...notifiedScheduledIdsRef.current])); } catch { /* Memory deduplication remains available. */ }

    if (soundEnabledRef.current) {
      await playNewOrderSound();
    }

    for (const order of newOrders.slice(0, 3)) {
      await sendNativeNotification({
        title: `🔔 ${order.scheduled_for ? 'Encomenda' : 'Novo Pedido!'} - ${order.order_number}`,
        body: `${order.customer_name} - ${formatBRL(order.total)}`,
        sound: false,
      });

      if (permissionRef.current === 'granted') {
        sendNotificationRef.current(`🔔 ${order.scheduled_for ? 'Encomenda' : 'Novo Pedido!'} - ${order.order_number}`, {
          body: `${order.customer_name} - ${formatBRL(order.total)}`,
          tag: `order-${order.id}`,
          requireInteraction: true,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!storeId || !orderModuleEnabled || userRole === 'master_admin' || userRole === 'customer' || userRole === 'delivery_driver') {
      return;
    }

    const fetchPendingOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('store_id, id, order_number, customer_name, customer_phone, customer_address, total, status, delivery_type, created_at, scheduled_for')
        .eq('store_id', storeId)
        .eq('status', 'entrada')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const currentIds = new Set(data.map((order) => order.id));
        const previousIds = previousPendingIdsRef.current;

        setPendingOrders(data);


        if (hasLoadedInitialSnapshotRef.current) {
          const newOrders = data.filter((order) => !previousIds.has(order.id));
          if (newOrders.length > 0 && isVisible) {
            void notifyNewOrders(newOrders);
          }
        } else {
          const scheduled = data.filter(order => order.scheduled_for && !shownOrderIds.has(order.id));
          if (isVisible) void notifyNewOrders(scheduled);
          hasLoadedInitialSnapshotRef.current = true;
        }

        previousPendingIdsRef.current = currentIds;
      }

      if (error) {
        console.error('🔔 NewOrdersContext: erro ao buscar pedidos pendentes:', error);
      }
    };

    void fetchPendingOrders();

    const pollInterval = setInterval(fetchPendingOrders, isVisible ? 15000 : 60000);

    return () => clearInterval(pollInterval);
  }, [storeId, userRole, orderModuleEnabled, isVisible, notifyNewOrders]);

  const dismissOrder = (orderId: string) => {
    setShownOrderIds((prev) => {
      const next = new Set(prev).add(orderId);
      if (pendingOrders.some(order => order.id === orderId && order.scheduled_for)) {
        try { const saved: string[] = JSON.parse(localStorage.getItem('dismissed-scheduled-orders') || '[]'); localStorage.setItem('dismissed-scheduled-orders', JSON.stringify([...new Set([...saved, orderId])])); } catch { /* Keep dismissal in memory if storage is unavailable. */ }
      }
      return next;
    });
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
