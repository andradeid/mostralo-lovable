// Pedidos da tela de pedidos: busca (48h + encomendas do dia + concluídos do dia), atualização a cada
// 2 minutos com a aba visível, evento "orders:refresh" e som para pedido novo na Entrada.
// Código movido da OrdersPage sem mudança (mesma consulta, mesmas dependências).
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { storeDayStart } from '@/lib/storeDayStart';
import { playNewOrderSound, NotificationSound } from '@/utils/soundPlayer';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];

interface Params {
  storeId: string | null | undefined;
  storeAccessLoading: boolean;
  hasAccess: boolean;
  timezone: string | null | undefined;
  timezoneLoading: boolean;
  refreshMetrics: () => unknown;
  soundEnabled: boolean;
  selectedSound: NotificationSound;
  setAudioBlocked: (blocked: boolean) => void;
}

export function useOrdersFeed({
  storeId,
  storeAccessLoading,
  hasAccess,
  timezone,
  timezoneLoading,
  refreshMetrics,
  soundEnabled,
  selectedSound,
  setAudioBlocked,
}: Params) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const previousEntranceOrderIdsRef = useRef<Set<string>>(new Set());
  const initialOrdersLoadedRef = useRef(false);
  const [isPageVisible, setIsPageVisible] = useState(() =>
    typeof document === 'undefined' ? true : !document.hidden
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => setIsPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!storeId || storeAccessLoading || timezoneLoading) {
      return;
    }

    setIsLoading(true);

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .or(`and(scheduled_for.is.null,created_at.gte.${cutoff}),and(scheduled_for.gte.${storeDayStart(timezone || 'America/Sao_Paulo')},status.not.in.(concluido,cancelado)),and(completed_at.gte.${storeDayStart(timezone || 'America/Sao_Paulo')},status.eq.concluido)`)
      .neq('status', 'confirmado')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos. Tente recarregar a página.');
      setOrders([]);
    } else {
      const nextOrders = data || [];
      setOrders(nextOrders);

      const entranceOrders = nextOrders.filter(o => o.status === 'entrada' && !o.scheduled_for);
      setPendingOrders(entranceOrders);

      const currentEntranceIds = new Set(entranceOrders.map((order) => order.id));

      if (initialOrdersLoadedRef.current) {
        const newEntranceOrders = entranceOrders.filter((order) => !previousEntranceOrderIdsRef.current.has(order.id));
        if (newEntranceOrders.length > 0 && soundEnabled && isPageVisible) {
          void playNewOrderSound(selectedSound).then((success) => {
            if (!success) {
              setAudioBlocked(true);
            }
          });
        }
      } else {
        initialOrdersLoadedRef.current = true;
      }

      previousEntranceOrderIdsRef.current = currentEntranceIds;
    }

    void refreshMetrics();
    setIsLoading(false);
  }, [storeId, storeAccessLoading, soundEnabled, selectedSound, timezone, timezoneLoading, refreshMetrics, isPageVisible]);

  useEffect(() => {
    if (storeId && !storeAccessLoading && hasAccess) {
      fetchOrders();
      const pollingInterval = isPageVisible ? setInterval(() => {
        fetchOrders();
      }, 120000) : null;

        return () => {
          if (pollingInterval) clearInterval(pollingInterval);
        };
    }
  }, [storeId, storeAccessLoading, hasAccess, fetchOrders, isPageVisible]);

  // Atualizar o Kanban na hora quando um pedido for aceito pelo alerta global
  useEffect(() => {
    const handleOrdersRefresh = () => { void fetchOrders(); };
    window.addEventListener('orders:refresh', handleOrdersRefresh);
    return () => window.removeEventListener('orders:refresh', handleOrdersRefresh);
  }, [fetchOrders]);

  return { orders, setOrders, isLoading, pendingOrders, setPendingOrders, fetchOrders };
}
