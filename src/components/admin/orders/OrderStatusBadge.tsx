import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    entrada: { label: "Entrada", variant: "default" },
    em_preparo: { label: "Em Preparo", variant: "secondary" },
    aguarda_retirada: { label: "Aguarda Retirada", variant: "outline" },
    em_transito: { label: "Em Trânsito", variant: "outline" },
    concluido: { label: "Concluído", variant: "default" },
    cancelado: { label: "Cancelado", variant: "destructive" }
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="whitespace-nowrap">
      {config.label}
    </Badge>
  );
};
