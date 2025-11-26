import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, TrendingUp, Package } from 'lucide-react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addDays, isWithinInterval } from 'date-fns';

interface ScheduledOrdersStatsProps {
  orders: any[];
}

export function ScheduledOrdersStats({ orders }: ScheduledOrdersStatsProps) {
  const now = new Date();
  const today = { start: startOfDay(now), end: endOfDay(now) };
  const tomorrow = { start: startOfDay(addDays(now, 1)), end: endOfDay(addDays(now, 1)) };
  const thisWeek = { start: startOfWeek(now), end: endOfWeek(now) };

  const todayOrders = orders.filter(order => 
    isWithinInterval(new Date(order.scheduled_for), today)
  );

  const tomorrowOrders = orders.filter(order => 
    isWithinInterval(new Date(order.scheduled_for), tomorrow)
  );

  const weekOrders = orders.filter(order => 
    isWithinInterval(new Date(order.scheduled_for), thisWeek)
  );

  const stats = [
    {
      title: 'Total Agendado',
      value: orders.length,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Hoje',
      value: todayOrders.length,
      icon: Clock,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Amanhã',
      value: tomorrowOrders.length,
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Esta Semana',
      value: weekOrders.length,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
