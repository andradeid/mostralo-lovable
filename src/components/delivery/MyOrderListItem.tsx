import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, CheckCircle2, Package, Eye, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MyOrderDetailDialog } from './MyOrderDetailDialog';
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
}

interface Assignment {
  id: string;
  order_id: string;
  status: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  orders: Order;
}

interface MyOrderListItemProps {
  assignment: Assignment;
  onUpdate: () => void;
  driverEarningsConfig?: EarningsConfig;
}

export function MyOrderListItem({ assignment, onUpdate, driverEarningsConfig }: MyOrderListItemProps) {
  const { orders: order } = assignment;
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  const earnings = calculateDriverEarnings(order.delivery_fee, driverEarningsConfig);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  // ✅ STATUS MESTRE: Atualizar orders.status para 'em_transito' quando entregador retirar
  const handleMarkAsPickedUp = async () => {
    try {
      // 1. Atualizar order.status para 'em_transito' (status mestre)
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'em_transito',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 2. Atualizar assignment.status para 'picked_up' (controle interno)
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({
          status: 'picked_up',
          picked_up_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      if (assignmentError) throw assignmentError;

      toast.success('Pedido marcado como retirado!');
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao marcar como retirado:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleMarkAsDelivered = async () => {
    try {
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      if (assignmentError) throw assignmentError;

      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'concluido',
          completed_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      toast.success('Pedido entregue com sucesso!');
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao marcar como entregue:', error);
      toast.error('Erro ao finalizar entrega');
    }
  };

  const openGoogleMaps = () => {
    const address = encodeURIComponent(order.customer_address || '');
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  const openWaze = () => {
    const address = encodeURIComponent(order.customer_address || '');
    window.open(`https://waze.com/ul?q=${address}`, '_blank');
  };

  // ✅ STATUS MESTRE: Usar order.status do lojista ao invés de assignment.status
  const getStatusBadge = () => {
    switch (order.status) {
      case 'entrada':
        return { variant: 'default' as const, className: 'bg-blue-500', label: 'Pedido Recebido' };
      case 'em_preparo':
        return { variant: 'default' as const, className: 'bg-orange-500', label: 'Em Preparo' };
      case 'aguarda_retirada':
        return { variant: 'secondary' as const, className: 'bg-yellow-500', label: 'Aguardando Retirada' };
      case 'em_transito':
        return { variant: 'secondary' as const, className: 'bg-blue-500', label: 'Em Trânsito' };
      case 'concluido':
        return { variant: 'default' as const, className: 'bg-green-600', label: 'Entregue' };
      case 'cancelado':
        return { variant: 'destructive' as const, className: '', label: 'Cancelado' };
      default:
        return { variant: 'outline' as const, className: '', label: order.status };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
        {/* Status e Número do Pedido */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={statusBadge.variant} className={statusBadge.className}>
            {statusBadge.label}
          </Badge>
          <span className="font-bold text-sm whitespace-nowrap">
            {formatOrderNumber(order.order_number)}
          </span>
        </div>

        {/* Cliente e Endereço */}
        <div className="flex-1 min-w-0 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{getFirstName(order.customer_name)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{truncateAddress(order.customer_address, 35)}</span>
          </div>
        </div>

        {/* Ganhos */}
        <div className="flex items-center gap-1.5 text-green-600 font-bold flex-shrink-0">
          <DollarSign className="w-4 h-4" />
          <span className="whitespace-nowrap">{formatCurrency(earnings)}</span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailDialogOpen(true)}
            className="md:flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden md:inline">Ver</span>
          </Button>

          {/* ✅ STATUS MESTRE: Mostrar botão quando status for 'aguarda_retirada' */}
          {order.status === 'aguarda_retirada' && (
            <Button
              size="sm"
              onClick={handleMarkAsPickedUp}
              className="bg-orange-500 hover:bg-orange-600 whitespace-nowrap"
            >
              <Package className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Retirar</span>
            </Button>
          )}

          {/* Mostrar botões quando status for 'em_transito' */}
          {order.status === 'em_transito' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={openGoogleMaps}
                className="hidden md:flex items-center gap-1"
              >
                <Navigation className="w-4 h-4" />
                Maps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openWaze}
                className="hidden md:flex items-center gap-1"
              >
                <Navigation className="w-4 h-4" />
                Waze
              </Button>
              <Button
                size="sm"
                onClick={handleMarkAsDelivered}
                className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">Entregar</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <MyOrderDetailDialog
        assignment={assignment}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
      />
    </>
  );
}
