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
          "group transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 cursor-pointer border-border/50",
          isUpcoming && "border-amber-500/50 ring-1 ring-amber-500/20 shadow-amber-500/10",
          isLate && "border-destructive/50 ring-1 ring-destructive/20"
        )}
        onClick={() => setDetailsOpen(true)}
      >
        <CardContent className="p-0">
          {/* Top section - order identity */}
          <div className="flex items-center justify-between p-3 pb-2">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "p-1.5 rounded-lg",
                order.delivery_type === 'delivery' 
                  ? "bg-blue-500/10" 
                  : "bg-emerald-500/10"
              )}>
                <DeliveryIcon className={cn(
                  "h-4 w-4",
                  order.delivery_type === 'delivery' ? "text-blue-500" : "text-emerald-500"
                )} />
              </div>
              <div>
                <span className="font-bold text-sm text-foreground">#{order.order_number}</span>
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                <span className="text-sm text-muted-foreground">{order.customer_name}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <OrderStatusBadge status={order.status} />
              {isUpcoming && (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[10px] px-1.5 py-0 animate-pulse">
                  <AlertCircle className="h-3 w-3 mr-0.5" />
                  {minutesUntil}min
                </Badge>
              )}
              {isLate && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  <AlertCircle className="h-3 w-3 mr-0.5" />
                  Atrasado
                </Badge>
              )}
            </div>
          </div>

          {/* Scheduled info pill */}
          <div className="mx-3 mb-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/8 dark:bg-blue-500/10 rounded-lg border border-blue-500/10">
              <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-muted-foreground">Agendado para</span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {format(scheduledDate, "dd/MM 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom section - details row */}
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-border/50 bg-muted/30">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{order.customer_phone}</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                <span className="capitalize">{order.payment_method}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                R$ {order.total.toFixed(2)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-primary hover:text-primary font-medium group-hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailsOpen(true);
                }}
              >
                Ver Detalhes
                <ChevronRight className="h-3 w-3 ml-0.5 transition-transform group-hover:translate-x-0.5" />
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
