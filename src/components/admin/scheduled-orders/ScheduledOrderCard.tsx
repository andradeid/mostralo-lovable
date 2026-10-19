import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Printer, Eye, Check, X, CalendarDays } from 'lucide-react';
import { OrderStatusBadge } from '@/components/admin/orders/OrderStatusBadge';
import { OrderDetailDialog } from '@/components/admin/orders/OrderDetailDialog';
import { DeliveryTimeSelector } from '@/components/admin/orders/DeliveryTimeSelector';
import { CancelOrderDialog } from '@/components/admin/orders/CancelOrderDialog';
import { RescheduleOrderDialog } from './RescheduleOrderDialog';
import { updateOrderStatus } from '@/lib/orderStatus';
import { formatBRL, scheduledLabel, type ScheduledOrder } from '@/lib/scheduledOrders';
import { printOrder } from '@/utils/printOrder';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ScheduledOrderCardProps { order: ScheduledOrder; onUpdate: () => void }
export function ScheduledOrderCard({ order, onUpdate }: ScheduledOrderCardProps) {
  const [details, setDetails] = useState(false);
  const [accept, setAccept] = useState(false);
  const [reschedule, setReschedule] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = order.status !== 'cancelado' && order.status !== 'concluido';
  const update = async (status: 'em_preparo' | 'cancelado', at?: string, reason?: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await updateOrderStatus({ orderId: order.id, status, cancellationReason: reason });
      if (!result.success) throw new Error(result.error || 'Não foi possível atualizar a encomenda');
      toast.success(status === 'em_preparo' ? `Encomenda confirmada para ${scheduledLabel(at || order.scheduled_for || '')}` : 'Encomenda cancelada');
      setAccept(false); setCancel(false); onUpdate();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao atualizar encomenda'); }
    finally { setBusy(false); }
  };
  const print = async () => {
    try {
      const { data, error } = await supabase.from('stores').select('name').eq('id', order.store_id).maybeSingle();
      if (error) throw error;
      await printOrder(order, data?.name || 'Loja');
    } catch { toast.error('Não foi possível imprimir a encomenda'); }
  };
  return <>
    <Card className={cn('border-border/50', order.is_overdue && active && 'border-destructive/50')}><CardContent className="p-3 space-y-3">
      <div className="flex justify-between gap-2 flex-wrap"><span className="text-sm font-semibold">#{order.order_number} · {order.customer_name}</span><OrderStatusBadge status={order.status} /></div>
      <div className={cn('flex items-center gap-2 text-info text-sm', order.is_overdue && active && 'text-destructive')}><CalendarClock className="h-4 w-4" /><span>{order.day_label} · {order.local_time}</span>{order.is_overdue && active && <Badge variant="destructive">Atrasada</Badge>}</div>
      <p className="text-xs text-muted-foreground">{order.items_summary}</p>
      <div className="flex justify-between gap-2 text-xs"><span>{order.delivery_label} · {order.payment_label}</span><strong className="text-sm">{formatBRL(order.total)}</strong></div>
      <div className="flex gap-2 flex-wrap">
        {order.status === 'entrada' && <Button size="sm" onClick={() => setAccept(true)} disabled={busy}><Check className="h-4 w-4 mr-1" />Aceitar</Button>}
        {active && <><Button size="sm" variant="outline" onClick={() => setReschedule(true)}><CalendarDays className="h-4 w-4 mr-1" />Remarcar</Button><Button size="sm" variant="outline" onClick={() => setCancel(true)}><X className="h-4 w-4 mr-1" />Cancelar</Button></>}
        <Button size="sm" variant="outline" onClick={print}><Printer className="h-4 w-4 mr-1" />Imprimir</Button><Button size="sm" variant="ghost" onClick={() => setDetails(true)}><Eye className="h-4 w-4 mr-1" />Ver detalhes</Button>
      </div>
    </CardContent></Card>
    <OrderDetailDialog order={order} open={details} onOpenChange={setDetails} onStatusChange={onUpdate} />
    <DeliveryTimeSelector open={accept} onOpenChange={setAccept} onConfirm={(_, at) => void update('em_preparo', at)} scheduledFor={order.scheduled_for} orderId={order.id} storeId={order.store_id} isPickup={order.delivery_type === 'pickup'} isLoading={busy} />
    <RescheduleOrderDialog open={reschedule} onOpenChange={setReschedule} order={order} onSuccess={onUpdate} />
    <CancelOrderDialog open={cancel} onOpenChange={setCancel} onConfirm={(reason) => void update('cancelado', undefined, reason)} isLoading={busy} />
  </>;
}
