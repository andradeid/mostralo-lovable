// Filtros e colunas do Kanban de pedidos (tela de pedidos do painel).
// Funções puras: mesma regra que ficava dentro da OrdersPage.
import { belongsToDailyKanban } from '@/lib/scheduledOrderFlow';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];
type PaymentStatus = Database['public']['Enums']['payment_status'];
type DeliveryType = Database['public']['Enums']['delivery_type'];

export interface KanbanFilters {
  searchTerm: string;
  paymentStatusFilter: PaymentStatus | 'all';
  deliveryTypeFilter: DeliveryType | 'all';
}

/** Pedidos do Kanban do dia que batem com a busca e os filtros. */
export function filterKanbanOrders(orders: Order[], filters: KanbanFilters): Order[] {
  const { searchTerm, paymentStatusFilter, deliveryTypeFilter } = filters;
  return orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm);

    const matchesPayment = paymentStatusFilter === 'all' || order.payment_status === paymentStatusFilter;
    const matchesDelivery = deliveryTypeFilter === 'all' || order.delivery_type === deliveryTypeFilter;

    return belongsToDailyKanban(order.status) && matchesSearch && matchesPayment && matchesDelivery;
  });
}

/** Pedidos de uma coluna. "concluido" inclui os cancelados, do mais recente para o mais antigo. */
export function kanbanOrdersByStatus(filteredOrders: Order[], status: OrderStatus, limit?: number): Order[] {
  const filtered = filteredOrders.filter((order) => {
    // Para "concluido", incluir também pedidos "cancelado"
    if (status === 'concluido') {
      return order.status === 'concluido' || order.status === 'cancelado';
    }
    return order.status === status;
  });

  // Se for status "concluido", ordenar por data de conclusão (mais recentes primeiro)
  if (status === 'concluido') {
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.completed_at || a.cancelled_at || a.updated_at).getTime();
      const dateB = new Date(b.completed_at || b.cancelled_at || b.updated_at).getTime();
      return dateB - dateA;
    });
    return limit ? sorted.slice(0, limit) : sorted;
  }

  return filtered;
}
