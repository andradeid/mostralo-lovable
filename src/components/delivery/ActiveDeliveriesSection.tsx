import { MyOrderCard } from "./MyOrderCard";
import { MyOrderListItem } from "./MyOrderListItem";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package } from "lucide-react";

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

interface Assignment {
  id: string;
  order_id: string;
  delivery_driver_id: string;
  status: string;
  assigned_at: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  orders: Order | null;
}

interface ActiveDeliveriesSectionProps {
  assignments: Assignment[];
  onMarkAsPickedUp: (assignmentId: string) => void;
  onMarkAsDelivered: (assignmentId: string, orderId: string) => void;
  onViewDetails: (assignment: Assignment) => void;
  driverEarningsConfig?: any;
  viewMode?: 'grid' | 'list';
}

export function ActiveDeliveriesSection({
  assignments,
  onMarkAsPickedUp,
  onMarkAsDelivered,
  onViewDetails,
  driverEarningsConfig,
  viewMode = 'grid',
}: ActiveDeliveriesSectionProps) {
  // ✅ STATUS MESTRE: Filtrar baseado em orders.status (mestre do lojista)
  const activeAssignments = assignments.filter(
    (assignment) => assignment.orders !== null && 
    assignment.orders.status !== 'concluido' && 
    assignment.orders.status !== 'cancelado' &&
    (assignment.orders.status === 'aguarda_retirada' || assignment.orders.status === 'em_transito')
  );

  if (activeAssignments.length === 0) {
    return (
      <Alert className="bg-muted/50">
        <AlertDescription className="text-center py-4">
          <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhuma entrega em andamento no momento
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {activeAssignments.map((assignment) => (
          <MyOrderListItem
            key={assignment.id}
            assignment={assignment}
            onUpdate={() => {
              // ✅ STATUS MESTRE: Usar order.status ao invés de assignment.status
              if (assignment.orders?.status === "aguarda_retirada") {
                onMarkAsPickedUp(assignment.id);
              } else if (assignment.orders?.status === "em_transito") {
                onMarkAsDelivered(assignment.id, assignment.orders?.id || "");
              }
            }}
            driverEarningsConfig={driverEarningsConfig}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeAssignments.map((assignment) => (
        <MyOrderCard
          key={assignment.id}
          assignment={assignment}
          onUpdate={() => {
            // ✅ STATUS MESTRE: Usar order.status ao invés de assignment.status
            if (assignment.orders?.status === "aguarda_retirada") {
              onMarkAsPickedUp(assignment.id);
            } else if (assignment.orders?.status === "em_transito") {
              onMarkAsDelivered(assignment.id, assignment.orders?.id || "");
            }
          }}
          driverEarningsConfig={driverEarningsConfig}
        />
      ))}
    </div>
  );
}
