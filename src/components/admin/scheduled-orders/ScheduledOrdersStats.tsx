import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, CalendarDays, Inbox, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduleSummary } from '@/lib/scheduledOrders';
import { Skeleton } from '@/components/ui/skeleton';

export interface ScheduledOrdersStatsProps { summary?: ScheduleSummary; loading?: boolean }
export function ScheduledOrdersStats({ summary, loading }: ScheduledOrdersStatsProps) {
  const stats = [
    { label: 'Aguardando aceite', value: summary?.awaiting_acceptance || 0, icon: Inbox },
    { label: 'Hoje', value: summary?.today || 0, icon: Clock },
    { label: 'Amanhã', value: summary?.tomorrow || 0, icon: Calendar },
    { label: 'Próximos 7 dias', value: summary?.next_7_days || 0, icon: CalendarDays },
    { label: 'Atrasadas', value: summary?.overdue || 0, icon: AlertCircle },
  ];
  return <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">{stats.map(({ label, value, icon: Icon }) =>
    <Card key={label} className={cn('border-border/50', label === 'Atrasadas' && value > 0 && 'border-destructive/50 text-destructive')}><CardContent className="p-3 flex items-center gap-3">
      <Icon className="h-5 w-5 shrink-0" /><div>{loading ? <Skeleton className="h-6 w-10" /> : <p className="text-xl font-bold">{value}</p>}<p className="text-xs">{label}</p></div>
    </CardContent></Card>)}</div>;
}
