import { DeliveryOrderCard } from "./DeliveryOrderCard";
import { AvailableOrderListItem } from "./AvailableOrderListItem";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";
import { calculateDriverEarnings, type EarningsConfig } from "@/utils/driverEarnings";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  status: string;
  delivery_type: string;
  created_at: string;
  notes?: string;
  store_id: string;
  assigned_driver_id?: string | null;
}

interface AvailableOrdersSectionProps {
  orders: Order[];
  onAccept: (orderId: string) => void;
  onViewDetails: (order: Order) => void;
  driverEarningsConfig?: any;
  viewMode?: 'grid' | 'list';
}

export function AvailableOrdersSection({
  orders,
  onAccept,
  onViewDetails,
  driverEarningsConfig,
  viewMode = 'grid',
}: AvailableOrdersSectionProps) {
  // ✅ CORRIGIDO: Pedidos disponíveis são aqueles com status "em_preparo" e sem entregador atribuído
  // Os pedidos já vêm filtrados do backend, mas garantimos aqui também
  const availableOrders = orders.filter((order) => 
    order.status === "em_preparo" && 
    !order.assigned_driver_id &&
    order.delivery_type === "delivery"
  );

  console.log('📦 AvailableOrdersSection renderizando:', {
    totalOrders: orders.length,
    availableCount: availableOrders.length,
    viewMode,
    orders: orders.map(o => ({ 
      id: o.id?.substring(0, 8) + '...', 
      orderNumber: o.order_number,
      status: o.status, 
      hasDriver: !!o.assigned_driver_id,
      deliveryType: o.delivery_type
    })),
    filtered: availableOrders.map(o => ({
      id: o.id?.substring(0, 8) + '...',
      orderNumber: o.order_number,
      status: o.status
    }))
  });

  if (availableOrders.length === 0) {
    return (
      <Alert className="bg-muted/50">
        <AlertDescription className="text-center py-4">
          <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum pedido disponível no momento
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {availableOrders.map((order) => (
          <AvailableOrderListItem
            key={order.id}
            order={order}
            onAccept={onAccept}
            onViewDetails={onViewDetails}
            driverEarningsConfig={driverEarningsConfig}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {availableOrders.map((order) => {
        // Calcular ganhos do entregador para este pedido
        const earnings = calculateDriverEarnings(
          order.delivery_fee || 0,
          driverEarningsConfig as EarningsConfig
        );
        
        return (
          <DeliveryOrderCard
            key={order.id}
            order={order}
            type="available"
            onAccept={() => onAccept(order.id)}
            onViewDetails={() => onViewDetails(order)}
            driverEarnings={earnings}
          />
        );
      })}
    </div>
  );
}
