import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Store, CreditCard, Phone, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
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

  const DeliveryIcon = order.delivery_type === 'delivery' ? Truck : Store;

  return (
    <>
      <Card 
        className={cn(
          "group transition-all duration-200 hover:shadow-md cursor-pointer border-border/50",
          isUpcoming && "border-amber-500/50 ring-1 ring-amber-500/20",
          isLate && "border-destructive/50 ring-1 ring-destructive/20"
        )}
        onClick={() => setDetailsOpen(true)}
      >
        <CardContent className="p-0">
          {/* Header: ID + Nome + Status */}
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 lg:px-4 lg:py-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "p-1 rounded-md shrink-0",
                order.delivery_type === 'delivery' 
                  ? "bg-blue-500/10" 
                  : "bg-emerald-500/10"
              )}>
                <DeliveryIcon className={cn(
                  "h-3.5 w-3.5",
                  order.delivery_type === 'delivery' ? "text-blue-500" : "text-emerald-500"
                )} />
              </div>
              <span className="font-bold text-xs text-foreground">#{order.order_number}</span>
              <span className="text-xs text-muted-foreground truncate">{order.customer_name}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <OrderStatusBadge status={order.status} />
              {isUpcoming && (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[9px] px-1.5 py-0 animate-pulse">
                  <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                  {minutesUntil}min
                </Badge>
              )}
              {isLate && (
                <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                  <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                  Atrasado
                </Badge>
              )}
            </div>
          </div>

          {/* Agendamento */}
          <div className="px-3 pb-2 lg:px-4">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-md border border-blue-200/50 dark:border-blue-800/30">
              <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground leading-none mb-0.5">Agendado para</p>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 leading-tight">
                  {format(scheduledDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Metadados + Botão (inline no desktop) */}
          <div className="px-3 pb-2.5 lg:px-4 lg:pb-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground min-w-0">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span className="truncate">{order.customer_phone}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                  <CreditCard className="h-3 w-3 shrink-0" />
                  <span className="capitalize">{order.payment_method}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-foreground">
                  R$ {order.total.toFixed(2)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailsOpen(true);
                  }}
                >
                  Ver Detalhes
                  <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </div>
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
