import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  delivery_type: string;
}

interface CustomerOrderCardProps {
  order: Order;
  onViewDetails: () => void;
}

const statusColors: Record<string, string> = {
  entrada: "bg-blue-500",
  em_preparo: "bg-yellow-500",
  pronto: "bg-green-500",
  saiu_entrega: "bg-purple-500",
  concluido: "bg-emerald-500",
  cancelado: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  entrada: "Recebido",
  em_preparo: "Em Preparo",
  pronto: "Pronto",
  saiu_entrega: "Saiu para Entrega",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default function CustomerOrderCard({ order, onViewDetails }: CustomerOrderCardProps) {
  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98] ${
        !['concluido', 'cancelado'].includes(order.status) 
          ? 'border-l-4 border-l-primary' 
          : ''
      }`}
      onClick={onViewDetails}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-semibold text-base">Pedido #{order.order_number}</p>
              <Badge className={`${statusColors[order.status]} text-white text-xs`}>
                {statusLabels[order.status] || order.status}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-1">
              {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            
            <div className="flex items-center gap-3">
              <p className="text-base font-semibold text-primary">
                R$ {order.total.toFixed(2)}
              </p>
              <span className="text-xs text-muted-foreground">•</span>
              <p className="text-sm text-muted-foreground capitalize">
                {order.delivery_type === "delivery" ? "Entrega" : "Retirada"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
