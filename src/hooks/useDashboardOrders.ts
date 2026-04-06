import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Dados consolidados de pedidos do dia para o dashboard.
 * UMA ÚNICA query alimenta todos os componentes do dashboard,
 * eliminando ~10 queries simultâneas à tabela orders.
 */
export interface DashboardOrder {
  id: string;
  order_number: string;
  customer_name: string | null;
  status: string;
  total: number;
  created_at: string;
}

export interface DashboardOrdersData {
  /** Todos os pedidos do dia (ordem desc) */
  allOrders: DashboardOrder[];
  /** Pedidos do dia excluindo cancelados */
  activeOrders: DashboardOrder[];
  /** Receita do dia (excluindo cancelados) */
  revenueToday: number;
  /** Quantidade de pedidos (excluindo cancelados) */
  orderCount: number;
  /** Ticket médio */
  avgTicket: number;
  /** Pedidos por status */
  byStatus: Record<string, DashboardOrder[]>;
  /** Contagem por status */
  statusCounts: Record<string, number>;
}

export function useDashboardOrders(storeId: string | null) {
  return useQuery<DashboardOrdersData | null>({
    queryKey: ['dashboard-orders-consolidated', storeId],
    queryFn: async () => {
      if (!storeId) return null;

      const today = new Date().toISOString().split('T')[0];

      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, status, total, created_at')
        .eq('store_id', storeId)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allOrders: DashboardOrder[] = (orders ?? []).map(o => ({
        ...o,
        total: Number(o.total || 0),
      }));

      const activeOrders = allOrders.filter(o => o.status !== 'cancelado');
      const revenueToday = activeOrders.reduce((sum, o) => sum + o.total, 0);
      const orderCount = activeOrders.length;
      const avgTicket = orderCount > 0 ? revenueToday / orderCount : 0;

      const byStatus: Record<string, DashboardOrder[]> = {};
      const statusCounts: Record<string, number> = {};
      for (const o of allOrders) {
        if (!byStatus[o.status]) byStatus[o.status] = [];
        byStatus[o.status].push(o);
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      }

      return {
        allOrders,
        activeOrders,
        revenueToday,
        orderCount,
        avgTicket,
        byStatus,
        statusCounts,
      };
    },
    enabled: !!storeId,
    staleTime: 60_000,      // 1 minuto — dados do dia
    gcTime: 300_000,         // 5 minutos em cache
    refetchInterval: 60_000, // Atualizar a cada 1 minuto
    retry: 2,
  });
}
