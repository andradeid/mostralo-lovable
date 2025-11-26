import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { countOrdersByDay } from '@/utils/scheduledOrdersValidation';
import { Skeleton } from '@/components/ui/skeleton';

interface ScheduledOrdersCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  orders: any[];
  loading: boolean;
}

export function ScheduledOrdersCalendar({
  selectedDate,
  onSelectDate,
  orders,
  loading
}: ScheduledOrdersCalendarProps) {
  const ordersByDay = countOrdersByDay(orders);

  const modifiers = {
    hasOrders: (date: Date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return ordersByDay[dateKey] > 0;
    }
  };

  const modifiersClassNames = {
    hasOrders: 'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary'
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 Calendário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📅 Calendário
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          locale={ptBR}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="rounded-md border-0"
        />

        {/* Legenda */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Dias com pedidos</span>
          </div>
          
          {selectedDate && ordersByDay[format(selectedDate, 'yyyy-MM-dd')] && (
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <span className="text-sm font-medium">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </span>
              <Badge variant="secondary">
                {ordersByDay[format(selectedDate, 'yyyy-MM-dd')]} pedido(s)
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
