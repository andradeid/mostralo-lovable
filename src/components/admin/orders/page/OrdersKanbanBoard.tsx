// Quadro Kanban da tela de pedidos (arrastar entre colunas). JSX movido da OrdersPage sem mudança:
// cada card é o mesmo <Draggable><div><OrderCard/></div></Draggable> de antes.
import type { ReactNode } from 'react';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { CheckCircle2, ChefHat, Inbox, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { KanbanColumn } from '@/components/admin/orders/KanbanColumn';
import { KanbanCombinedColumn } from '@/components/admin/orders/KanbanCombinedColumn';
import { OrderCard } from '@/components/admin/orders/OrderCard';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];

interface Props {
  onDragEnd: (result: DropResult) => void;
  isLargeScreen: boolean;
  getOrdersByStatus: (status: OrderStatus, limit?: number) => Order[];
  finishedOrdersVisible: number;
  onLoadMoreFinished: () => void;
  isLoadingMoreFinished: boolean;
  onOpenOrder: (order: Order) => void;
  viewedOrderIds: Set<string>;
  selectedOrderIds: Set<string>;
  onToggleOrderSelection: (orderId: string) => void;
}

export function OrdersKanbanBoard({
  onDragEnd,
  isLargeScreen,
  getOrdersByStatus,
  finishedOrdersVisible,
  onLoadMoreFinished,
  isLoadingMoreFinished,
  onOpenOrder,
  viewedOrderIds,
  selectedOrderIds,
  onToggleOrderSelection,
}: Props) {
  /** Card arrastável. `selectable`: Entrada e Finalizados têm seleção para impressão em lote. */
  const renderCard = (order: Order, index: number, selectable = false): ReactNode => (
    <Draggable key={order.id} draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {selectable ? (
            <OrderCard
              order={order}
              onClick={() => onOpenOrder(order)}
              isDragging={snapshot.isDragging}
              isViewed={viewedOrderIds.has(order.id)}
              isSelected={selectedOrderIds.has(order.id)}
              onSelectChange={(selected) => onToggleOrderSelection(order.id)}
              onPrint={() => toast.success('Impressão iniciada!')}
            />
          ) : (
            <OrderCard
              order={order}
              onClick={() => onOpenOrder(order)}
              isDragging={snapshot.isDragging}
              isViewed={viewedOrderIds.has(order.id)}
            />
          )}
        </div>
      )}
    </Draggable>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="relative">
        {/* Indicador de scroll - gradiente nas bordas */}
        <div className="absolute left-0 top-0 bottom-4 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none sm:hidden" />
        <div className="absolute right-0 top-0 bottom-4 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:hidden" />

        <div className="flex gap-2 sm:gap-3 lg:gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] scroll-smooth snap-x snap-mandatory sm:snap-none -mx-3 sm:mx-0 px-3 sm:px-0">
          <KanbanColumn
            id="entrada"
            title="Entrada"
            icon={Inbox}
            count={getOrdersByStatus('entrada').length}
            color="bg-blue-500"
          >
            {getOrdersByStatus('entrada').map((order, index) => renderCard(order, index, true))}
          </KanbanColumn>

          {/* Em Preparo + Aguarda Retirada - Responsivo */}
          {isLargeScreen ? (
            // Desktop: 2 colunas separadas
            <>
              <KanbanColumn
                id="em_preparo"
                title="Em Preparo"
                icon={ChefHat}
                count={getOrdersByStatus('em_preparo').length}
                color="bg-orange-500"
              >
                {getOrdersByStatus('em_preparo').map((order, index) => renderCard(order, index))}
              </KanbanColumn>

              <KanbanColumn
                id="aguarda_retirada"
                title="Aguarda Retirada"
                icon={Package}
                count={getOrdersByStatus('aguarda_retirada').length}
                color="bg-purple-500"
              >
                {getOrdersByStatus('aguarda_retirada').map((order, index) => renderCard(order, index))}
              </KanbanColumn>
            </>
          ) : (
            // Mobile/Tablet: colunas combinadas (empilhadas)
            <KanbanCombinedColumn
              sections={[
                {
                  id: "em_preparo",
                  title: "Em Preparo",
                  icon: ChefHat,
                  count: getOrdersByStatus('em_preparo').length,
                  color: "bg-orange-500",
                  children: getOrdersByStatus('em_preparo').map((order, index) => renderCard(order, index))
                },
                {
                  id: "aguarda_retirada",
                  title: "Aguarda Retirada",
                  icon: Package,
                  count: getOrdersByStatus('aguarda_retirada').length,
                  color: "bg-purple-500",
                  children: getOrdersByStatus('aguarda_retirada').map((order, index) => renderCard(order, index))
                }
              ]}
            />
          )}

          <KanbanCombinedColumn
            sections={[
              {
                id: "em_transito",
                title: "Em Trânsito",
                icon: Truck,
                count: getOrdersByStatus('em_transito').length,
                color: "bg-green-500",
                children: getOrdersByStatus('em_transito').map((order, index) => renderCard(order, index))
              },
              {
                id: "concluido",
                title: "Finalizados",
                icon: CheckCircle2,
                count: getOrdersByStatus('concluido').length,
                color: "bg-emerald-500",
                onLoadMore: onLoadMoreFinished,
                hasMore: getOrdersByStatus('concluido').length > finishedOrdersVisible,
                isLoadingMore: isLoadingMoreFinished,
                children: getOrdersByStatus('concluido', finishedOrdersVisible).map((order, index) => renderCard(order, index, true))
              }
            ]}
          />
        </div>
      </div>
    </DragDropContext>
  );
}
