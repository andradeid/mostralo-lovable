import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Clock, Eye, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AvailableOrderDetailDialog } from './AvailableOrderDetailDialog';
import { calculateDriverEarnings, type EarningsConfig } from '@/utils/driverEarnings';
import { truncateAddress, formatOrderNumber } from '@/utils/addressFormatter';

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

interface AvailableOrderListItemProps {
  order: Order;
  onAccept: (orderId: string) => void;
  onViewDetails: (order: Order) => void;
  driverEarningsConfig?: EarningsConfig;
}

export function AvailableOrderListItem({
  order,
  onAccept,
  onViewDetails,
  driverEarningsConfig,
}: AvailableOrderListItemProps) {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  const earnings = calculateDriverEarnings(order.delivery_fee, driverEarningsConfig);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const timeAgo = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: true,
    locale: ptBR
  });

  const handleViewDetails = () => {
    setDetailDialogOpen(true);
    onViewDetails(order);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 p-3 md:p-4 border border-orange-200 bg-orange-50/30 dark:bg-orange-950/10 rounded-lg hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-colors overflow-hidden">
        {/* Badge e Número */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className="bg-orange-500">Disponível</Badge>
          <span className="font-bold text-sm whitespace-nowrap">
            {formatOrderNumber(order.order_number)}
          </span>
        </div>

        {/* Cliente */}
        <div className="flex items-center gap-2 text-sm font-medium flex-shrink-0 min-w-[100px]">
          <User className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{order.customer_name.split(' ')[0]}</span>
        </div>

        {/* Endereço */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{truncateAddress(order.customer_address, 35)}</span>
          </div>
        </div>

        {/* Tempo e Ganhos */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">{timeAgo}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-green-600 font-bold">
            <DollarSign className="w-4 h-4" />
            <span className="whitespace-nowrap">{formatCurrency(earnings)}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewDetails}
            className="md:flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden md:inline">Ver</span>
          </Button>

          <Button
            size="sm"
            onClick={() => onAccept(order.id)}
            className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
          >
            <span className="hidden md:inline">Aceitar Pedido</span>
            <span className="md:hidden">Aceitar</span>
          </Button>
        </div>
      </div>

      <AvailableOrderDetailDialog
        order={order}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        onAccept={(orderId) => {
          onAccept(orderId);
          setDetailDialogOpen(false);
        }}
      />
    </>
  );
}
