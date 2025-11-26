import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, User, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
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

interface CompletedOrderCardProps {
  assignment: Assignment;
  onViewDetails: () => void;
  earnings_amount?: number;
  driverEarnings?: EarningsConfig;
}

export function CompletedOrderCard({
  assignment,
  onViewDetails,
  earnings_amount,
  driverEarnings,
}: CompletedOrderCardProps) {
  const order = assignment.orders;
  if (!order) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(" ")[0];
  };

  const earnings = earnings_amount ?? calculateDriverEarnings(order.delivery_fee, driverEarnings);

  const deliveredAgo = assignment.delivered_at
    ? formatDistanceToNow(new Date(assignment.delivered_at), {
        locale: ptBR,
        addSuffix: true,
      })
    : "";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                Pedido #{order.order_number}
              </p>
              <Badge variant="outline" className="mt-1 border-green-500 text-green-600 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Entregue
              </Badge>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-green-600 whitespace-nowrap">
                {formatCurrency(earnings)}
              </p>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {deliveredAgo}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate">{getFirstName(order.customer_name)}</span>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-muted-foreground break-words line-clamp-3">
            {order.customer_address || "Endereço não informado"}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onViewDetails}
          className="w-full"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
}
