import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, DollarSign, Clock, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AvailableOrderDetailDialog } from './AvailableOrderDetailDialog';

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

interface AvailableOrderCardProps {
  order: Order;
  onAccept: (orderId: string) => void;
  driverEarnings?: number;
}

export function AvailableOrderCard({ order, onAccept, driverEarnings }: AvailableOrderCardProps) {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const maskPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ****-${cleaned.slice(-4)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ****-${cleaned.slice(-4)}`;
    }
    return '****-****';
  };

  const timeAgo = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: true,
    locale: ptBR
  });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">#{order.order_number}</h3>
            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-muted-foreground">{order.customer_address || 'Endereço não informado'}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground font-mono">{maskPhone(order.customer_phone)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-green-600">{formatCurrency(driverEarnings ?? order.delivery_fee ?? order.total)}</span>
        </div>

        {order.notes && (
          <div className="p-2 bg-muted rounded text-sm">
            <p className="text-muted-foreground">
              <strong>Obs:</strong> {order.notes}
            </p>
          </div>
        )}

        <Button 
          onClick={() => setDetailDialogOpen(true)} 
          className="w-full gap-2"
          variant="outline"
        >
          <Eye className="w-4 h-4" />
          Ver Detalhes
        </Button>
      </CardContent>

      <AvailableOrderDetailDialog
        order={order}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        onAccept={onAccept}
      />
    </Card>
  );
}
