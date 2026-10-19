import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { ScheduledOrdersCalendar } from '@/components/admin/scheduled-orders/ScheduledOrdersCalendar';
import { ScheduledOrdersList } from '@/components/admin/scheduled-orders/ScheduledOrdersList';
import { ScheduledOrdersStats } from '@/components/admin/scheduled-orders/ScheduledOrdersStats';
import { ScheduledOrdersFilters } from '@/components/admin/scheduled-orders/ScheduledOrdersFilters';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarClock, Loader2 } from 'lucide-react';
import { scheduleRpc, type ScheduledOrder, type ScheduleSummary } from '@/lib/scheduledOrders';

export default function ScheduledOrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, userRole } = useAuth();
  const { storeId, isLoading: accessLoading } = useStoreAccess();
  const isMaster = userRole === 'master_admin' || profile?.user_type === 'master_admin';
  const [masterStoreId, setMasterStoreId] = useState<string>();
  const masterStores = useQuery({ queryKey: ['scheduled-master-stores'], enabled: isMaster && !accessLoading, queryFn: async () => { const { data, error } = await supabase.from('stores').select('id, name').order('name'); if (error) throw error; return data || []; } });
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [month, setMonth] = useState(new Date());
  const [filters, setFilters] = useState({ status: 'all', deliveryType: 'all', paymentMethod: 'all' });
  const access = useQuery({
    queryKey: ['scheduled-access', storeId, isMaster], enabled: !accessLoading && (!!storeId || isMaster),
    queryFn: async () => {
      if (isMaster) return true;
      const { data, error } = await supabase.from('stores').select('delivery_config').eq('id', storeId || '').maybeSingle();
      if (error) throw new Error(error.message);
      const config = data?.delivery_config;
      const schedule = config && typeof config === 'object' && !Array.isArray(config) ? config.scheduled_orders : null;
      const enabled = !!schedule && typeof schedule === 'object' && !Array.isArray(schedule) && schedule.enabled === true;
      if (!enabled) { toast.error('Funcionalidade não habilitada. Ative Pedidos Agendados nas Configurações da Loja.'); navigate('/dashboard/my-store'); }
      return enabled;
    },
  });
  const scope = storeId || masterStoreId || masterStores.data?.[0]?.id || null;
  const ready = !accessLoading && access.data === true && !!scope;
  const selectedDay = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const summary = useQuery({ queryKey: ['scheduled-summary', scope], enabled: ready,
    queryFn: () => scheduleRpc<ScheduleSummary>('scheduled_orders_summary', { p_store_id: scope }), refetchInterval: 60000 });
  const orders = useQuery({ queryKey: ['scheduled-list', scope, selectedDay, filters], enabled: ready,
    queryFn: async () => {
      const projected = await scheduleRpc<ScheduledOrder[]>('get_scheduled_orders', { p_store_id: scope, p_from: selectedDay, p_to: selectedDay, p_statuses: filters.status === 'all' ? null : [filters.status], p_delivery_type: filters.deliveryType === 'all' ? null : filters.deliveryType, p_payment_method: filters.paymentMethod === 'all' ? null : filters.paymentMethod });
      if (!projected.length) return [];
      // RPC projection intentionally omits fields required by printing and detail dialogs.
      const { data, error } = await supabase.from('orders').select('*').eq('store_id', scope || '').in('id', projected.map(order => order.id));
      if (error) throw error;
      const rows = new Map((data || []).map(order => [order.id, order]));
      return projected.flatMap(order => { const row = rows.get(order.id); return row ? [{ ...row, ...order, store_id: row.store_id }] : []; });
    }, refetchInterval: 30000 });
  const calendar = useQuery({ queryKey: ['scheduled-calendar', scope, format(month, 'yyyy-MM')], enabled: ready,
    queryFn: () => scheduleRpc<ScheduledOrder[]>('get_scheduled_orders', { p_store_id: scope, p_from: format(startOfMonth(month), 'yyyy-MM-dd'), p_to: format(endOfMonth(month), 'yyyy-MM-dd'), p_statuses: null, p_delivery_type: null, p_payment_method: null }), refetchInterval: 60000 });
  const refresh = () => { for (const key of ['scheduled-list', 'scheduled-summary', 'scheduled-calendar', 'store-day-metrics']) void queryClient.invalidateQueries({ queryKey: [key] }); };
  if (accessLoading || access.isPending) return <div className="flex items-center justify-center py-16 gap-2"><Loader2 className="h-5 w-5 animate-spin" />Carregando loja...</div>;
  if (access.error) return <div className="p-4 text-destructive">Não foi possível carregar a configuração da loja.<Button variant="outline" onClick={() => void access.refetch()}>Tentar novamente</Button></div>;
  if (isMaster && masterStores.isPending) return <p className="p-4">Carregando lojas...</p>;
  if (!ready) return <p className="p-4 text-muted-foreground">Selecione uma loja para visualizar encomendas.</p>;
  return <ModuleGate moduleKey="scheduled_orders" storeId={storeId}><div className="min-h-screen bg-background p-2 md:p-3 lg:p-4 space-y-3">
    <h1 className="flex items-center gap-2 text-xl font-bold"><CalendarClock className="h-5 w-5 text-primary" />Pedidos Agendados</h1>
    {isMaster && <Select value={scope || ''} onValueChange={(id) => { setMasterStoreId(id); setSelectedDate(undefined); }}><SelectTrigger className="max-w-sm"><SelectValue placeholder="Selecionar loja" /></SelectTrigger><SelectContent>{masterStores.data?.map(store => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}</SelectContent></Select>}
    <ScheduledOrdersStats summary={summary.data} loading={summary.isPending} />
    {(summary.error || calendar.error || orders.error) && <div role="alert" className="text-destructive text-sm">{orders.error?.message || calendar.error?.message || summary.error?.message}<Button variant="ghost" onClick={refresh}>Tentar novamente</Button></div>}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      <aside className="lg:col-span-3 space-y-3"><ScheduledOrdersCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} month={month} onMonthChange={setMonth} orders={calendar.data || []} loading={calendar.isFetching} />
        {selectedDate && <Button variant="outline" onClick={() => setSelectedDate(undefined)}>Limpar</Button>}
        <ScheduledOrdersFilters filters={filters} onFiltersChange={setFilters} orders={orders.data || []} />
      </aside>
      <section className="lg:col-span-9"><ScheduledOrdersList orders={orders.data || []} loading={orders.isPending} onOrderUpdate={refresh} /></section>
    </div>
  </div></ModuleGate>;
}
