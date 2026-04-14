import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, TrendingUp, Package } from 'lucide-react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addDays, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

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
      gradient: 'from-blue-500/10 to-blue-600/5',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-500',
      valueColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-500/20',
      highlight: false,
    },
    {
      title: 'Hoje',
      value: todayOrders.length,
      icon: Clock,
      gradient: 'from-emerald-500/10 to-emerald-600/5',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-500',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-500/30',
      highlight: true,
    },
    {
      title: 'Amanhã',
      value: tomorrowOrders.length,
      icon: Calendar,
      gradient: 'from-amber-500/10 to-amber-600/5',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
      valueColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-500/20',
      highlight: false,
    },
    {
      title: 'Esta Semana',
      value: weekOrders.length,
      icon: TrendingUp,
      gradient: 'from-purple-500/10 to-purple-600/5',
      iconBg: 'bg-purple-500/15',
      iconColor: 'text-purple-500',
      valueColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-500/20',
      highlight: false,
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.title} 
            className={cn(
              "border transition-all duration-200 hover:shadow-md",
              stat.highlight && "ring-1 ring-emerald-500/30 shadow-sm shadow-emerald-500/10",
              stat.borderColor
            )}
          >
            <CardContent className={cn("p-3 lg:p-3.5 bg-gradient-to-br rounded-lg", stat.gradient)}>
              <div className="flex items-center gap-2.5">
                <div className={cn("p-1.5 lg:p-2 rounded-lg lg:rounded-xl", stat.iconBg)}>
                  <Icon className={cn("h-3.5 w-3.5 lg:h-4 lg:w-4", stat.iconColor)} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-xl lg:text-2xl font-bold leading-none tracking-tight", stat.valueColor)}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] lg:text-[11px] text-muted-foreground mt-0.5 truncate">
                    {stat.title}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
