import { CompletedOrderCard } from "./CompletedOrderCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

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
  driver_earnings?: {
    earnings_amount: number;
    payment_type: string;
  }[];
}

interface CompletedDeliveriesSectionProps {
  assignments: Assignment[];
  onViewDetails: (assignment: Assignment) => void;
  driverEarningsConfig?: any;
}

export function CompletedDeliveriesSection({
  assignments,
  onViewDetails,
  driverEarningsConfig,
}: CompletedDeliveriesSectionProps) {
  const completedAssignments = assignments.filter((a) => a.status === "delivered");

  if (completedAssignments.length === 0) {
    return (
      <Alert className="bg-muted/50">
        <AlertDescription className="text-center py-4">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum pedido finalizado nos últimos 7 dias
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {completedAssignments.map((assignment) => (
        <CompletedOrderCard
          key={assignment.id}
          assignment={assignment}
          onViewDetails={() => onViewDetails(assignment)}
          earnings_amount={assignment.driver_earnings?.[0]?.earnings_amount}
          driverEarnings={driverEarningsConfig}
        />
      ))}
    </div>
  );
}
