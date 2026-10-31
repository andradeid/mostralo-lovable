// Tela de pedidos no celular: cabeçalho compacto, lista por status e barra de status no rodapé.
// JSX movido da OrdersPage sem mudança.
import { AlertCircle, Plus, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MobileAdminNav } from '@/components/admin/orders/MobileAdminNav';
import { MobileOrdersList } from '@/components/admin/orders/MobileOrdersList';
import { MobileOrdersStatusBar } from '@/components/admin/orders/MobileOrdersStatusBar';
import { OrderDetailDialog } from '@/components/admin/orders/OrderDetailDialog';
import { CreateOrderDialog } from '@/components/admin/orders/CreateOrderDialog';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];

interface Props {
  pendingCount: number;
  soundEnabled: boolean;
  onToggleSound: (checked: boolean) => void;
  onCreateOrder: () => void;
  filteredOrders: Order[];
  activeStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  statusCounts: Record<OrderStatus, number>;
  onOrderClick: (order: Order) => void;
  onAdvanceStatus: (order: Order) => void;
  onPrint: (order: Order) => void;
  onCancel: (order: Order) => void;
  onAssignDriver: (order: Order) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  viewedOrderIds: Set<string>;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  selectedOrder: Order | null;
  detailDialogOpen: boolean;
  onDetailDialogOpenChange: (open: boolean) => void;
  createOrderDialogOpen: boolean;
  onCreateOrderDialogOpenChange: (open: boolean) => void;
  onOrdersChanged: () => void;
}

export function OrdersMobileView({
  pendingCount,
  soundEnabled,
  onToggleSound,
  onCreateOrder,
  filteredOrders,
  activeStatus,
  onStatusChange,
  statusCounts,
  onOrderClick,
  onAdvanceStatus,
  onPrint,
  onCancel,
  onAssignDriver,
  onRefresh,
  isRefreshing,
  viewedOrderIds,
  hasMore,
  onLoadMore,
  isLoadingMore,
  selectedOrder,
  detailDialogOpen,
  onDetailDialogOpenChange,
  createOrderDialogOpen,
  onCreateOrderDialogOpenChange,
  onOrdersChanged,
}: Props) {
  return (
    <div className="fixed inset-0 flex flex-col bg-background z-50">
      {/* Header Mobile Compacto */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <MobileAdminNav />
          <h1 className="text-lg font-bold">Pedidos</h1>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse text-xs px-1.5 py-0.5">
              <AlertCircle className="h-3 w-3 mr-0.5" />
              {pendingCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={soundEnabled ? "default" : "ghost"}
            size="sm"
            onClick={() => onToggleSound(!soundEnabled)}
            className="h-8 w-8 p-0"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onCreateOrder}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="flex-1 overflow-hidden pb-16">
        <MobileOrdersList
          orders={filteredOrders}
          activeStatus={activeStatus}
          onOrderClick={onOrderClick}
          onAdvanceStatus={onAdvanceStatus}
          onPrint={onPrint}
          onCancel={onCancel}
          onAssignDriver={onAssignDriver}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          viewedOrderIds={viewedOrderIds}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          isLoadingMore={isLoadingMore}
        />
      </div>

      {/* Barra de Status no Rodapé */}
      <MobileOrdersStatusBar
        activeStatus={activeStatus}
        onStatusChange={onStatusChange}
        counts={statusCounts}
        pendingCount={pendingCount}
      />

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        open={detailDialogOpen}
        onOpenChange={onDetailDialogOpenChange}
        onStatusChange={onOrdersChanged}
      />

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={createOrderDialogOpen}
        onOpenChange={onCreateOrderDialogOpenChange}
        onSuccess={onOrdersChanged}
      />
    </div>
  );
}
