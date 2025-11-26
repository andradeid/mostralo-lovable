import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Store, CreditCard, Phone, Clock, AlertCircle } from 'lucide-react';
import { format, isBefore, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge';
import { OrderDetailDialog } from '@/components/admin/orders/OrderDetailDialog';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { isOrderLate } from '@/utils/scheduledOrdersValidation';

interface ScheduledOrderCardProps {
  order: any;
  onUpdate: () => void;
}

export function ScheduledOrderCard({ order, onUpdate }: ScheduledOrderCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const scheduledDate = new Date(order.scheduled_for);
  const now = new Date();
  const minutesUntil = differenceInMinutes(scheduledDate, now);
  const isUpcoming = minutesUntil > 0 && minutesUntil <= 30;
  const isLate = isOrderLate(order);

  const deliveryIcon = order.delivery_type === 'delivery' ? Truck : Store;
  const DeliveryIcon = deliveryIcon;

  return (
    <>
      <Card 
        className={cn(
          "transition-all hover:shadow-md cursor-pointer",
          isUpcoming && "border-orange-500 border-2 animate-pulse",
          isLate && "border-destructive border-2"
        )}
        onClick={() => setDetailsOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <DeliveryIcon className={cn(
                  "h-5 w-5",
                  order.delivery_type === 'delivery' ? "text-blue-500" : "text-green-500"
                )} />
                <div>
                  <div className="font-semibold text-sm">#{order.order_number}</div>
                  <div className="text-xs text-muted-foreground">{order.customer_name}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <OrderStatusBadge status={order.status} />
                {isUpcoming && (
                  <Badge variant="outline" className="border-orange-500 text-orange-500">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {minutesUntil}min
                  </Badge>
                )}
                {isLate && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Atrasado
                  </Badge>
                )}
              </div>
            </div>

            {/* Informações */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Agendado para</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {format(scheduledDate, "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{order.customer_phone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span className="capitalize">{order.payment_method}</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailsOpen(true);
                }}
              >
                Ver Detalhes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <OrderDetailDialog
        order={order}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onStatusChange={onUpdate}
      />
    </>
  );
}
