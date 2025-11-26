import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Navigation,
  Package,
  CheckCircle2,
  Eye,
  User,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  status: string;
  accepted_at?: string;
  picked_up_at?: string;
  orders: Order;
}

interface DeliveryOrderCardProps {
  order?: Order;
  assignment?: Assignment;
  type: 'available' | 'mine';
  driverEarnings?: number;
  onAccept?: (orderId: string) => void;
  onViewDetails?: () => void;
  onMarkAsPickedUp?: () => void;
  onMarkAsDelivered?: () => void;
  onNavigate?: () => void;
}

export function DeliveryOrderCard({
  order,
  assignment,
  type,
  driverEarnings,
  onAccept,
  onViewDetails,
  onMarkAsPickedUp,
  onMarkAsDelivered,
  onNavigate
}: DeliveryOrderCardProps) {
  const currentOrder = assignment?.orders || order;
  
  console.log('🎴 DeliveryOrderCard renderizando:', {
    type,
    hasOrder: !!order,
    hasAssignment: !!assignment,
    hasCurrentOrder: !!currentOrder,
    orderNumber: currentOrder?.order_number,
    orderId: currentOrder?.id?.substring(0, 8) + '...'
  });
  
  if (!currentOrder) {
    console.warn('⚠️ DeliveryOrderCard: Sem order ou assignment, retornando null');
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getFirstName = (fullName: string) => fullName.split(' ')[0];

  const timeAgo = formatDistanceToNow(new Date(currentOrder.created_at), {
    addSuffix: true,
    locale: ptBR
  });

  const getStatusColor = () => {
    if (!assignment) return 'bg-blue-500';
    switch (assignment.status) {
      case 'accepted':
        return 'bg-blue-500';
      case 'picked_up':
        return 'bg-orange-500';
      case 'delivered':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    if (!assignment) return null;
    switch (assignment.status) {
      case 'assigned':
        return 'Atribuído';
      case 'accepted':
        return 'Aceito';
      case 'picked_up':
        return 'Em trânsito';
      case 'delivered':
        return 'Entregue';
      default:
        return assignment.status;
    }
  };

  return (
    <Card className="hover:shadow-md transition-all hover:border-primary/50">
      {/* Header com indicador de status */}
      <div className="relative">
        <div className={`h-1.5 rounded-t-lg ${getStatusColor()}`} />
        
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">{formatOrderNumber(currentOrder.order_number)}</h3>
                {type === 'mine' && assignment && (
                  <Badge variant="secondary" className="text-xs">
                    {getStatusLabel()}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                <span>
                  {type === 'available' 
                    ? currentOrder.customer_name 
                    : `${getFirstName(currentOrder.customer_name)} (protegido)`
                  }
                </span>
              </div>
            </div>

            {type === 'available' && (
              <Badge variant="outline" className="gap-1.5 text-xs">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </Badge>
            )}
          </div>

          {/* Endereço */}
          <div className="flex items-start gap-2 mb-3 p-2.5 bg-muted/50 rounded-lg">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span className="text-sm leading-relaxed">
              {truncateAddress(currentOrder.customer_address || 'Endereço não informado', 50)}
            </span>
          </div>

          {/* Valor */}
          <div className="flex items-center justify-between mb-3 p-2.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Você ganha</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(driverEarnings ?? currentOrder.delivery_fee)}
            </span>
          </div>

          {/* Observações */}
          {currentOrder.notes && (
            <div className="flex items-start gap-2 mb-3 p-2.5 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium text-yellow-900 dark:text-yellow-100">Observação: </span>
                <span className="text-yellow-800 dark:text-yellow-200">{currentOrder.notes}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {type === 'available' && (
              <>
                <Button 
                  onClick={onViewDetails}
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalhes
                </Button>
                <Button 
                  onClick={() => onAccept?.(currentOrder.id)}
                  className="w-full gap-2"
                  size="lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aceitar Pedido
                </Button>
              </>
            )}

            {type === 'mine' && assignment && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={onViewDetails}
                    variant="outline"
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Detalhes
                  </Button>
                  <Button 
                    onClick={onNavigate}
                    variant="outline"
                    className="gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Navegar
                  </Button>
                </div>

                {assignment.status === 'accepted' && (
                  <Button 
                    onClick={onMarkAsPickedUp}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Package className="w-4 h-4" />
                    Marcar como Retirado
                  </Button>
                )}

                {assignment.status === 'picked_up' && (
                  <Button 
                    onClick={onMarkAsDelivered}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Entrega
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
