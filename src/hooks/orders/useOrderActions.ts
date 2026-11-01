// Ações da tela de pedidos: arrastar no Kanban, abrir detalhe, impressão em lote, seleção,
// paginação dos finalizados e ações do celular. Código movido da OrdersPage sem mudança.
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { DropResult } from 'react-beautiful-dnd';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { printOrder } from '@/utils/printOrder';
import { updateOrderStatus } from '@/lib/orderStatus';
import { useOrderStatusAdvance } from '@/hooks/useOrderStatusAdvance';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];

interface Params {
  orders: Order[];
  setOrders: Dispatch<SetStateAction<Order[]>>;
  pendingOrders: Order[];
  setPendingOrders: Dispatch<SetStateAction<Order[]>>;
  fetchOrders: () => Promise<void>;
  getOrdersByStatus: (status: OrderStatus, limit?: number) => Order[];
}

export function useOrderActions({ orders, setOrders, pendingOrders, setPendingOrders, fetchOrders, getOrdersByStatus }: Params) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewedOrderIds, setViewedOrderIds] = useState<Set<string>>(new Set());

  // Estados para paginação da coluna "Finalizados"
  const [finishedOrdersVisible, setFinishedOrdersVisible] = useState(5);
  const [isLoadingMoreFinished, setIsLoadingMoreFinished] = useState(false);

  // Estados para impressão em lote
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isPrintingBatch, setIsPrintingBatch] = useState(false);

  const [isRefreshingMobile, setIsRefreshingMobile] = useState(false);
  const [isRefreshingDesktop, setIsRefreshingDesktop] = useState(false);

  // Hook para avanço de status
  const { advanceStatus, cancelOrder } = useOrderStatusAdvance();

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    const newStatus = destination.droppableId as OrderStatus;
    const order = orders.find(o => o.id === draggableId);

    if (!order) return;

    if (order.scheduled_for && order.status === 'entrada' && newStatus === 'em_preparo') { setSelectedOrder(order); setDetailDialogOpen(true); return; }

    // Atualizar localmente primeiro
    setOrders((prev) =>
      prev.map((o) =>
        o.id === draggableId ? { ...o, status: newStatus } : o
      )
    );

    // Atualizar fila de alertas imediatamente para evitar loop persistente
    if (order.status === 'entrada' && newStatus !== 'entrada') {
      setPendingOrders((prev) => prev.filter((o) => o.id !== order.id));
    } else if (order.status !== 'entrada' && newStatus === 'entrada') {
      setPendingOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [...prev, { ...order, status: newStatus } as Order]));
    }

    // Atualizar no banco
    const updateResult = await updateOrderStatus({
      orderId: draggableId,
      status: newStatus,
    });

    if (!updateResult.success) {
      toast.error(updateResult.error || 'Erro ao atualizar status');
      console.error(updateResult.error);
      // Reverter mudança local
      setOrders((prev) =>
        prev.map((o) =>
          o.id === draggableId ? { ...o, status: order.status } : o
        )
      );

      if (order.status === 'entrada' && newStatus !== 'entrada') {
        setPendingOrders((prev) =>
          prev.some((pendingOrder) => pendingOrder.id === order.id) ? prev : [...prev, order]
        );
      } else if (order.status !== 'entrada' && newStatus === 'entrada') {
        setPendingOrders((prev) => prev.filter((pendingOrder) => pendingOrder.id !== order.id));
      }
    } else {
      toast.success('Status atualizado!');
      void fetchOrders();
    }
  };

  /** Clique num card do Kanban: abre o detalhe e marca como visto. */
  const openOrderFromCard = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
    setViewedOrderIds(prev => new Set(prev).add(order.id));
  };

  /** Clique num pedido da lista do celular: abre, marca como visto e tira da fila de alertas. */
  const openOrderFromMobile = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
    setViewedOrderIds(prev => new Set(prev).add(order.id));
    setPendingOrders(prev => prev.filter(o => o.id !== order.id));
  };

  const loadMoreFinishedOrders = () => {
    setIsLoadingMoreFinished(true);
    // Simular pequeno delay para UX
    setTimeout(() => {
      setFinishedOrdersVisible(prev => prev + 5);
      setIsLoadingMoreFinished(false);
    }, 300);
  };

  const handleBatchPrint = async () => {
    if (selectedOrderIds.size === 0) {
      toast.error('Selecione pelo menos um pedido para imprimir');
      return;
    }

    setIsPrintingBatch(true);

    try {
      const ordersToprint = orders.filter(o => selectedOrderIds.has(o.id));

      // Buscar nome da loja
      const firstOrder = ordersToprint[0];
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', firstOrder.store_id)
        .single();

      const storeName = storeData?.name || 'Loja';

      toast.info(`Imprimindo ${ordersToprint.length} pedido(s)...`);

      // Imprimir cada pedido sequencialmente com pequeno delay
      for (let i = 0; i < ordersToprint.length; i++) {
        await printOrder(ordersToprint[i] as any, storeName);

        // Pequeno delay entre impressões para evitar conflitos
        if (i < ordersToprint.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      toast.success(`${ordersToprint.length} pedido(s) enviado(s) para impressão!`);
      setSelectedOrderIds(new Set());
    } catch (error) {
      console.error('Erro na impressão em lote:', error);
      toast.error('Erro ao imprimir pedidos');
    } finally {
      setIsPrintingBatch(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  /** "Selecionar Todos" da barra de impressão: Entrada + Finalizados visíveis (alterna). */
  const toggleSelectAllVisible = () => {
    const allVisibleOrders = [
      ...getOrdersByStatus('entrada'),
      ...getOrdersByStatus('concluido', finishedOrdersVisible)
    ];
    const allSelected = allVisibleOrders.every(o => selectedOrderIds.has(o.id));

    if (allSelected) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(allVisibleOrders.map(o => o.id)));
    }
  };

  const handleDesktopRefresh = async () => {
    if (isRefreshingDesktop) return;
    setIsRefreshingDesktop(true);
    await fetchOrders();
    setIsRefreshingDesktop(false);
    toast.success('Pedidos atualizados');
  };

  // Handlers para ações mobile
  const handleMobileRefresh = async () => {
    setIsRefreshingMobile(true);
    await fetchOrders();
    setIsRefreshingMobile(false);
  };

  const handleMobileAdvanceStatus = async (order: Order) => {
    if (order.scheduled_for && order.status === 'entrada') { setSelectedOrder(order); setDetailDialogOpen(true); return; }
    const success = await advanceStatus(order);
    // Optimistic UI: Realtime/polling sincroniza — sem refetch manual
    if (success) void fetchOrders();
  };

  const handleMobilePrint = async (order: Order) => {
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', order.store_id)
        .single();

      await printOrder(order as any, storeData?.name || 'Loja');
      toast.success('Impressão iniciada!');
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast.error('Erro ao imprimir pedido');
    }
  };

  const handleMobileCancel = async (order: Order) => {
    await cancelOrder(order);
    // Optimistic UI: Realtime sincroniza
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelado' as OrderStatus } : o)));
  };

  const handleMobileAssignDriver = (order: Order) => {
    // Abrir modal de detalhes para atribuir entregador
    setSelectedOrder(order);
    setDetailDialogOpen(true);
    toast.info('Atribua um entregador para continuar');
  };

  return {
    selectedOrder,
    setSelectedOrder,
    detailDialogOpen,
    setDetailDialogOpen,
    viewedOrderIds,
    finishedOrdersVisible,
    setFinishedOrdersVisible,
    isLoadingMoreFinished,
    selectedOrderIds,
    setSelectedOrderIds,
    isPrintingBatch,
    isRefreshingMobile,
    isRefreshingDesktop,
    handleDragEnd,
    openOrderFromCard,
    openOrderFromMobile,
    loadMoreFinishedOrders,
    handleBatchPrint,
    toggleOrderSelection,
    toggleSelectAllVisible,
    handleDesktopRefresh,
    handleMobileRefresh,
    handleMobileAdvanceStatus,
    handleMobilePrint,
    handleMobileCancel,
    handleMobileAssignDriver,
  };
}
