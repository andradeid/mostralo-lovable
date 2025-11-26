import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduledOrderCard } from './ScheduledOrderCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <CardTitle>Carregando pedidos...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            📅 Próximos Pedidos Agendados
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {orders.length} pedido(s)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido agendado</h3>
            <p className="text-muted-foreground">
              Não há pedidos agendados para os próximos dias
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="space-y-8">
              {sortedDates.map((dateKey) => {
                const date = new Date(dateKey);
                const dayOrders = ordersByDate[dateKey];
                
                // Ordenar pedidos dentro da data por horário
                const sortedOrders = dayOrders.sort((a, b) => 
                  new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
                );

                return (
                  <div key={dateKey} className="space-y-4">
                    {/* Cabeçalho da data */}
                    <div className="sticky top-0 z-10 bg-background pb-2">
                      <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border-l-4 border-primary rounded">
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-primary">
                            {format(date, "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(date, "EEEE", { locale: ptBR })} • {sortedOrders.length} pedido(s)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pedidos da data */}
                    <div className="space-y-3 pl-2">
                      {sortedOrders.map((order) => {
                        const orderTime = format(new Date(order.scheduled_for), 'HH:mm');
                        
                        return (
                          <div key={order.id} className="flex flex-col sm:flex-row gap-3 items-start">
                            {/* Badge de horário */}
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold whitespace-nowrap">
                              <Clock className="h-3 w-3" />
                              {orderTime}
                            </div>
                            
                            {/* Card do pedido */}
                            <div className="flex-1 w-full">
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
