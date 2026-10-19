import { ScheduledOrderCard } from './ScheduledOrderCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { ScheduledOrder } from '@/lib/scheduledOrders';

export interface ScheduledOrdersListProps { orders: ScheduledOrder[]; loading: boolean; onOrderUpdate: () => void }
export function ScheduledOrdersList({ orders, loading, onOrderUpdate }: ScheduledOrdersListProps) {
  if (loading) return <div className="space-y-3">{[1, 2, 3].map((id) => <Skeleton key={id} className="h-36 w-full" />)}</div>;
  if (!orders.length) return <p className="py-12 text-center text-muted-foreground">Nenhuma encomenda para este período.</p>;
  const groups = orders.reduce<Record<string, ScheduledOrder[]>>((acc, order) => { (acc[order.local_date] ||= []).push(order); return acc; }, {});
  return <div className="space-y-5">{Object.keys(groups).sort().map((day) => <section key={day} className="space-y-2">
    <h2 className="border-l-2 border-primary pl-3 py-1 font-semibold text-sm">{groups[day][0].day_label} <span className="text-muted-foreground font-normal">· {groups[day].length} pedido(s)</span></h2>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">{[...groups[day]].sort((a, b) => a.local_time.localeCompare(b.local_time)).map((order) => <ScheduledOrderCard key={order.id} order={order} onUpdate={onOrderUpdate} />)}</div>
  </section>)}</div>;
}
