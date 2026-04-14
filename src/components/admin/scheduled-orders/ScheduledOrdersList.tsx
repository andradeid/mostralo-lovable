import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduledOrderCard } from './ScheduledOrderCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarClock, Clock } from 'lucide-react';

interface ScheduledOrdersListProps {
  orders: any[];
  loading: boolean;
  onOrderUpdate: () => void;
}

export function ScheduledOrdersList({
  orders,
  loading,
  onOrderUpdate
}: ScheduledOrdersListProps) {
  const ordersByDate = orders.reduce((acc, order) => {
    const dateKey = format(new Date(order.scheduled_for), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(order);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedDates = Object.keys(ordersByDate).sort();

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-medium">Carregando pedidos...</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-3 lg:px-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <CalendarClock className="h-3.5 w-3.5 text-primary" />
            Próximos Pedidos Agendados
          </div>
          <Badge className="bg-muted text-muted-foreground border-0 text-[9px] px-1.5 py-0 font-semibold">
            {orders.length} pedido(s)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 lg:px-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 rounded-xl bg-muted/50 mb-3">
              <CalendarClock className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xs font-semibold mb-1 text-foreground">Nenhum pedido agendado</h3>
            <p className="text-[10px] text-muted-foreground max-w-[200px]">
              Não há pedidos agendados para os próximos dias
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-320px)] lg:h-[calc(100vh-280px)]">
            <div className="space-y-4">
              {sortedDates.map((dateKey) => {
                const date = new Date(dateKey);
                const dayOrders = ordersByDate[dateKey];
                
                const sortedOrders = dayOrders.sort((a: any, b: any) => 
                  new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
                );

                return (
                  <div key={dateKey} className="space-y-2">
                    {/* Date header - compact */}
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-primary/5 rounded-md border-l-2 border-primary">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-primary">
                            {format(date, "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-1.5">
                            {format(date, "EEEE", { locale: ptBR })}
                          </span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-0 text-[9px] px-1.5 py-0 font-semibold shrink-0">
                          {sortedOrders.length} pedido(s)
                        </Badge>
                      </div>
                    </div>

                    {/* Orders grid - 1 col mobile, 2 cols on xl */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                      {sortedOrders.map((order: any) => {
                        const orderTime = format(new Date(order.scheduled_for), 'HH:mm');
                        
                        return (
                          <div key={order.id} className="flex gap-1.5 items-start">
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold whitespace-nowrap mt-2.5 shrink-0">
                              <Clock className="h-2.5 w-2.5" />
                              {orderTime}
                            </div>
                            <div className="flex-1 min-w-0">
                              <ScheduledOrderCard
                                order={order}
                                onUpdate={onOrderUpdate}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
