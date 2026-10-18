import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { ScheduledOrdersCalendar } from '@/components/admin/scheduled-orders/ScheduledOrdersCalendar';
import { ScheduledOrdersList } from '@/components/admin/scheduled-orders/ScheduledOrdersList';
import { ScheduledOrdersStats } from '@/components/admin/scheduled-orders/ScheduledOrdersStats';
import { ScheduledOrdersFilters } from '@/components/admin/scheduled-orders/ScheduledOrdersFilters';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { CalendarClock } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { activeStoreScope } from '@/lib/activeStoreScope';

export default function ScheduledOrdersPage() {
  const navigate = useNavigate();
  const { profile, userRole } = useAuth();
  const { storeId: validatedStoreId } = useStoreAccess();
  const isMasterAdmin = userRole === 'master_admin' || profile?.user_type === 'master_admin';
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allOrders, setAllOrders] = useState<Database['public']['Tables']['orders']['Row'][]>([]);
  const [allScheduledOrders, setAllScheduledOrders] = useState<Database['public']['Tables']['orders']['Row'][]>([]);
  const [dayOrders, setDayOrders] = useState<Database['public']['Tables']['orders']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    deliveryType: 'all',
    paymentMethod: 'all'
  });

  // Proteção de rota
  useEffect(() => {
    if (isMasterAdmin || !validatedStoreId) return;
    let cancelled = false;
    const checkAccess = async () => {
        try {
          const { data: store, error } = await supabase
            .from('stores')
            .select('delivery_config')
            .eq('id', validatedStoreId)
            .maybeSingle();

          if (cancelled) return;
          if (error) throw error;
          const deliveryConfig = store?.delivery_config;
          const scheduledOrders = deliveryConfig && typeof deliveryConfig === 'object' && !Array.isArray(deliveryConfig)
            ? deliveryConfig.scheduled_orders : null;
          const enabled = scheduledOrders && typeof scheduledOrders === 'object' && !Array.isArray(scheduledOrders)
            ? scheduledOrders.enabled === true : false;
          if (!enabled) {
            toast.error('Funcionalidade não habilitada. Ative Pedidos Agendados nas Configurações da Loja.');
            navigate('/dashboard/my-store');
          }
        } catch (error) {
          console.error('Erro ao verificar acesso:', error);
        }
    };

    checkAccess();
    return () => { cancelled = true; };
  }, [isMasterAdmin, validatedStoreId, navigate]);

  useEffect(() => {
    fetchDayOrders();
  }, [selectedDate, allOrders, filters]);

  const fetchMonthOrders = useCallback(async () => {
    // Não executar uma consulta sem escopo enquanto a loja ativa é resolvida.
    if (!isMasterAdmin && !validatedStoreId) return;
    try {
      setLoading(true);
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);

      let query = supabase
        .from('orders')
        .select('*')
        .not('scheduled_for', 'is', null)
        .gte('scheduled_for', start.toISOString())
        .lte('scheduled_for', end.toISOString())
        .order('scheduled_for', { ascending: true });

      const scope = activeStoreScope(isMasterAdmin, validatedStoreId);
      if (scope.kind === 'waiting') return;
      if (scope.kind === 'store') query = query.eq('store_id', scope.storeId);
      const { data, error } = await query;

      if (error) throw error;
      setAllOrders(data || []);
    } catch (error: unknown) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos agendados');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, isMasterAdmin, validatedStoreId]);

  const fetchAllScheduledOrders = useCallback(async () => {
    if (!isMasterAdmin && !validatedStoreId) return;
    try {
      const now = new Date();
      
      let query = supabase
        .from('orders')
        .select('*')
        .not('scheduled_for', 'is', null)
        .gte('scheduled_for', now.toISOString())
        .order('scheduled_for', { ascending: true });

      const scope = activeStoreScope(isMasterAdmin, validatedStoreId);
      if (scope.kind === 'waiting') return;
      if (scope.kind === 'store') query = query.eq('store_id', scope.storeId);
      const { data, error } = await query;

      if (error) throw error;
      setAllScheduledOrders(data || []);
    } catch (error: unknown) {
      console.error('Erro ao buscar todos os pedidos agendados:', error);
    }
  }, [isMasterAdmin, validatedStoreId]);

  useEffect(() => {
    setAllScheduledOrders([]);
    fetchAllScheduledOrders();
  }, [fetchAllScheduledOrders]);

  useEffect(() => {
    setAllOrders([]);
    fetchMonthOrders();
  }, [fetchMonthOrders]);

  function fetchDayOrders() {
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    let filtered = allOrders.filter(order => {
      if (!order.scheduled_for) return false;
      const scheduledDate = new Date(order.scheduled_for);
      return scheduledDate >= start && scheduledDate <= end;
    });

    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }
    if (filters.deliveryType !== 'all') {
      filtered = filtered.filter(order => order.delivery_type === filters.deliveryType);
    }
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(order => order.payment_method === filters.paymentMethod);
    }

    setDayOrders(filtered);
  }

  return (
    <ModuleGate moduleKey="scheduled_orders" storeId={validatedStoreId}>
    <div className="min-h-screen bg-background">
      <div className="mx-auto p-2 md:p-3 lg:p-4 space-y-2 lg:space-y-3">
        {/* Header + KPIs compact */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <CalendarClock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-foreground tracking-tight leading-tight">
                Pedidos Agendados
              </h1>
              <p className="text-[10px] lg:text-xs text-muted-foreground">
                Visualize e gerencie todos os pedidos agendados
              </p>
            </div>
          </div>

          <ScheduledOrdersStats orders={allScheduledOrders} />
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-3">
          {/* Left: Calendar + Filters */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-2">
            <ScheduledOrdersCalendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              orders={allOrders}
              loading={loading}
            />

            <ScheduledOrdersFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Right: Orders list */}
          <div className="lg:col-span-9 xl:col-span-9">
            <ScheduledOrdersList
              orders={allScheduledOrders}
              loading={loading}
              onOrderUpdate={fetchAllScheduledOrders}
            />
          </div>
        </div>
      </div>
    </div>
    </ModuleGate>
  );
}
