import { Database } from "@/integrations/supabase/types";
import { SwipeableOrderCard } from "./SwipeableOrderCard";
import { PullToRefreshIndicator } from "./PullToRefreshIndicator";
import { Button } from "@/components/ui/button";
import { Inbox, ChefHat, Package, Truck, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusLabel } from "@/hooks/useOrderStatusAdvance";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

type Order = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];

interface MobileOrdersListProps {
  orders: Order[];
  activeStatus: OrderStatus;
  onOrderClick: (order: Order) => void;
  onAdvanceStatus: (order: Order) => void;
  onPrint: (order: Order) => void;
  onCancel: (order: Order) => void;
  onAssignDriver?: (order: Order) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  viewedOrderIds: Set<string>;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  'entrada': Inbox,
  'em_preparo': ChefHat,
  'aguarda_retirada': Package,
  'aguardando_pagamento': Package,
  'em_transito': Truck,
  'concluido': CheckCircle2,
  'cancelado': CheckCircle2,
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  'entrada': 'text-blue-500',
  'em_preparo': 'text-orange-500',
  'aguarda_retirada': 'text-purple-500',
  'aguardando_pagamento': 'text-yellow-500',
  'em_transito': 'text-green-500',
  'concluido': 'text-emerald-500',
  'cancelado': 'text-red-500',
};

export const MobileOrdersList = ({
  orders,
  activeStatus,
  onOrderClick,
  onAdvanceStatus,
  onPrint,
  onCancel,
  onAssignDriver,
  onRefresh,
  isRefreshing = false,
  viewedOrderIds,
  hasMore,
  onLoadMore,
  isLoadingMore
}: MobileOrdersListProps) => {
  const StatusIcon = STATUS_ICONS[activeStatus];
  
  // Pull to refresh hook
  const { containerRef, pullDistance, isPulling, isRefreshing: isPullRefreshing } = usePullToRefresh({
    onRefresh: async () => {
      await new Promise<void>((resolve) => {
        onRefresh();
        setTimeout(resolve, 500);
      });
    },
    threshold: 80,
    maxPull: 120
  });
  
  // Filtrar pedidos do status ativo
  // Para "concluido", incluir também pedidos "cancelado"
  const filteredOrders = orders.filter(order => {
    if (activeStatus === 'concluido') {
      return order.status === 'concluido' || order.status === 'cancelado';
    }
    return order.status === activeStatus;
  });
  
  const actuallyRefreshing = isRefreshing || isPullRefreshing;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header com título do status e botão refresh */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("h-5 w-5", STATUS_COLORS[activeStatus])} />
          <h2 className="font-semibold">{getStatusLabel(activeStatus)}</h2>
          <span className="text-sm text-muted-foreground">
            ({filteredOrders.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={actuallyRefreshing}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={cn("h-4 w-4", actuallyRefreshing && "animate-spin")} />
        </Button>
      </div>
      
      {/* Lista de pedidos com pull-to-refresh */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto relative"
        style={{
          touchAction: pullDistance > 0 ? 'none' : 'auto'
        }}
      >
        {/* Pull to refresh indicator */}
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isPulling={isPulling}
          isRefreshing={isPullRefreshing}
          threshold={80}
        />
        
        {/* Content with transform for pull effect */}
        <div 
          className="px-3 py-2"
          style={{
            transform: `translateY(${pullDistance}px)`,
            transition: !isPulling && !isPullRefreshing ? 'transform 0.2s ease-out' : 'none'
          }}
        >
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <StatusIcon className={cn("h-12 w-12 mb-4 opacity-20", STATUS_COLORS[activeStatus])} />
              <p className="text-muted-foreground font-medium">
                Nenhum pedido em {getStatusLabel(activeStatus).toLowerCase()}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Os pedidos aparecerão aqui quando mudarem de status
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-20">
              {filteredOrders.map((order) => (
                <SwipeableOrderCard
                  key={order.id}
                  order={order}
                  onClick={() => onOrderClick(order)}
                  onAdvanceStatus={onAdvanceStatus}
                  onPrint={onPrint}
                  onCancel={onCancel}
                  onAssignDriver={onAssignDriver}
                  isViewed={viewedOrderIds.has(order.id)}
                />
              ))}
              
              {/* Botão carregar mais (para finalizados) */}
              {hasMore && onLoadMore && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      'Carregar mais'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
