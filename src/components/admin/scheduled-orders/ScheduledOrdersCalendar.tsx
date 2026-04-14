import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { countOrdersByDay } from '@/utils/scheduledOrdersValidation';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays } from 'lucide-react';

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
    hasOrders: 'relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary'
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="flex items-center gap-2 text-xs font-medium">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            Calendário
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2">
          <Skeleton className="h-[240px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="flex items-center gap-2 text-xs font-medium text-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          Calendário
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectDate(date)}
          locale={ptBR}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="rounded-md border-0 w-full"
        />

        <div className="mx-2 mt-1 pt-2 border-t border-border/50 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span>Dias com pedidos</span>
          </div>
          
          {selectedDate && ordersByDay[format(selectedDate, 'yyyy-MM-dd')] && (
            <div className="flex items-center justify-between p-2 bg-primary/5 rounded-md border border-primary/10">
              <span className="text-[10px] font-medium text-foreground">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </span>
              <Badge className="bg-primary/15 text-primary border-0 text-[9px] px-1.5 py-0 font-semibold">
                {ordersByDay[format(selectedDate, 'yyyy-MM-dd')]} pedido(s)
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
