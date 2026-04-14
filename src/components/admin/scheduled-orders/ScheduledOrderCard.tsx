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
          "group transition-all duration-200 hover:shadow-lg cursor-pointer border-border/50",
          isUpcoming && "border-amber-500/50 ring-1 ring-amber-500/20",
          isLate && "border-destructive/50 ring-1 ring-destructive/20"
        )}
        onClick={() => setDetailsOpen(true)}
      >
        <CardContent className="p-0">
          {/* Linha 1: Identificação do pedido + Status */}
          <div className="flex items-center justify-between gap-2 p-4 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "p-1.5 rounded-lg shrink-0",
                order.delivery_type === 'delivery' 
                  ? "bg-blue-500/10" 
                  : "bg-emerald-500/10"
              )}>
                <DeliveryIcon className={cn(
                  "h-4 w-4",
                  order.delivery_type === 'delivery' ? "text-blue-500" : "text-emerald-500"
                )} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-foreground">#{order.order_number}</span>
                  <span className="text-sm text-muted-foreground truncate">{order.customer_name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
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

          {/* Linha 2: Agendamento - full width */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              <Clock className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground leading-none mb-0.5">Agendado para</p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 leading-tight">
                  {format(scheduledDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Linha 3: Telefone, Pagamento, Valor */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{order.customer_phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <CreditCard className="h-3.5 w-3.5 shrink-0" />
                  <span className="capitalize">{order.payment_method}</span>
                </div>
              </div>
              <span className="text-sm font-bold text-foreground shrink-0">
                R$ {order.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Linha 4: Botão Ver Detalhes */}
          <div className="px-4 py-3 border-t border-border/40 bg-muted/20">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-9 text-xs font-medium"
              onClick={(e) => {
                e.stopPropagation();
                setDetailsOpen(true);
              }}
            >
              Ver Detalhes
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
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
