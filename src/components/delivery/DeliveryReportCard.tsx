import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, DollarSign } from 'lucide-react';
import { formatOrderNumber, getFirstName } from '@/utils/addressFormatter';
import { formatCurrency } from '@/utils/driverEarnings';

interface Delivery {
  id: string;
  created_at: string;
  delivered_at: string | null;
  orders: {
    order_number: string;
    customer_name: string;
  };
}

interface Props {
  delivery: Delivery;
  earnings: number;
}

export function DeliveryReportCard({ delivery, earnings }: Props) {
  return (
    <div className="border rounded-lg p-3 space-y-2 hover:bg-muted/30 transition-colors">
      {/* Linha 1: Data + Pedido */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {format(new Date(delivery.delivered_at || delivery.created_at), 'dd/MM/yy', { locale: ptBR })}
        </span>
        <span className="font-bold text-sm">
          {formatOrderNumber(delivery.orders.order_number)}
        </span>
      </div>

      {/* Linha 2: Cliente + Ganhos */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm truncate max-w-[150px]">
            {getFirstName(delivery.orders.customer_name)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-green-600 font-bold">
          <DollarSign className="w-4 h-4" />
          <span className="text-sm">{formatCurrency(earnings)}</span>
        </div>
      </div>
    </div>
  );
}
