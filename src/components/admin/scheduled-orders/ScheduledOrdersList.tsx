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
  // Agrupar pedidos por data
  const ordersByDate = orders.reduce((acc, order) => {
    const dateKey = format(new Date(order.scheduled_for), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(order);
    return acc;
  }, {} as Record<string, any[]>);

  // Ordenar datas (mais próximas primeiro)
  const sortedDates = Object.keys(ordersByDate).sort();

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Carregando pedidos...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarClock className="h-4 w-4 text-primary" />
            Próximos Pedidos Agendados
          </div>
          <Badge className="bg-muted text-muted-foreground border-0 text-[10px] px-2 py-0.5 font-semibold">
            {orders.length} pedido(s)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-muted/50 mb-4">
              <CalendarClock className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-sm font-semibold mb-1 text-foreground">Nenhum pedido agendado</h3>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Não há pedidos agendados para os próximos dias
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-6">
              {sortedDates.map((dateKey) => {
                const date = new Date(dateKey);
                const dayOrders = ordersByDate[dateKey];
                
                // Ordenar pedidos dentro da data por horário
                const sortedOrders = dayOrders.sort((a: any, b: any) => 
                  new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
                );

                return (
                  <div key={dateKey} className="space-y-3">
                    {/* Cabeçalho da data */}
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-1">
                      <div className="flex items-center justify-between px-3 py-2 bg-primary/5 rounded-lg border-l-[3px] border-primary">
                        <div>
                          <span className="text-sm font-bold text-primary">
                            {format(date, "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <span className="text-[11px] text-muted-foreground ml-2">
                            {format(date, "EEEE", { locale: ptBR })}
                          </span>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-2 py-0.5 font-semibold">
                          {sortedOrders.length} pedido(s)
                        </Badge>
                      </div>
                    </div>

                    {/* Pedidos da data */}
                    <div className="space-y-2.5">
                      {sortedOrders.map((order: any) => {
                        const orderTime = format(new Date(order.scheduled_for), 'HH:mm');
                        
                        return (
                          <div key={order.id} className="flex gap-2.5 items-start">
                            {/* Badge de horário */}
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold whitespace-nowrap mt-3 shrink-0">
                              <Clock className="h-3 w-3" />
                              {orderTime}
                            </div>
                            
                            {/* Card do pedido */}
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
