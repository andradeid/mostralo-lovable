import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { ScheduledOrdersCalendar } from '@/components/admin/scheduled-orders/ScheduledOrdersCalendar';
import { ScheduledOrdersList } from '@/components/admin/scheduled-orders/ScheduledOrdersList';
import { ScheduledOrdersStats } from '@/components/admin/scheduled-orders/ScheduledOrdersStats';
import { ScheduledOrdersFilters } from '@/components/admin/scheduled-orders/ScheduledOrdersFilters';

export default function ScheduledOrdersPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allOrders, setAllOrders] = useState<any[]>([]); // Pedidos do mês
  const [allScheduledOrders, setAllScheduledOrders] = useState<any[]>([]); // TODOS os pedidos agendados futuros
  const [dayOrders, setDayOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    deliveryType: 'all',
    paymentMethod: 'all'
  });

  // Proteção de rota: verificar se pedidos agendados estão habilitados
  useEffect(() => {
    const checkAccess = async () => {
      if (profile?.user_type === 'store_admin' && profile?.id) {
        try {
          // Buscar loja do usuário com delivery_config
          const { data: store } = await supabase
            .from('stores')
            .select('delivery_config')
            .eq('owner_id', profile.id)
            .single();

          // Se pedidos agendados não estiverem habilitados, redirecionar
          const deliveryConfig = (store as any)?.delivery_config;
          if (!deliveryConfig?.scheduled_orders?.enabled) {
            toast.error('Funcionalidade não habilitada. Ative Pedidos Agendados nas Configurações da Loja.');
            navigate('/dashboard/my-store');
          }
        } catch (error) {
          console.error('Erro ao verificar acesso:', error);
        }
      }
    };

    checkAccess();
  }, [profile, navigate]);

  // Buscar TODOS os pedidos agendados para as estatísticas
  useEffect(() => {
    fetchAllScheduledOrders();
  }, [profile]);

  // Buscar pedidos do mês
  useEffect(() => {
    fetchMonthOrders();
  }, [selectedDate, profile]);

  // Buscar pedidos do dia selecionado
  useEffect(() => {
    fetchDayOrders();
  }, [selectedDate, allOrders, filters]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('scheduled-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'scheduled_for=not.is.null'
        },
        () => {
          fetchMonthOrders();
          fetchAllScheduledOrders(); // Atualizar também os totais
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  async function fetchMonthOrders() {
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

      // Filtrar por loja se não for master admin
      if (profile?.user_type !== 'master_admin') {
        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', profile?.id);
        
        if (stores && stores.length > 0) {
          query = query.in('store_id', stores.map(s => s.id));
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setAllOrders(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos agendados');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllScheduledOrders() {
    try {
      const now = new Date();
      
      let query = supabase
        .from('orders')
        .select('*')
        .not('scheduled_for', 'is', null)
        .gte('scheduled_for', now.toISOString()) // Apenas pedidos futuros
        .order('scheduled_for', { ascending: true });

      // Filtrar por loja se não for master admin
      if (profile?.user_type !== 'master_admin') {
        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', profile?.id);
        
        if (stores && stores.length > 0) {
          query = query.in('store_id', stores.map(s => s.id));
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setAllScheduledOrders(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar todos os pedidos agendados:', error);
    }
  }

  function fetchDayOrders() {
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    let filtered = allOrders.filter(order => {
      const scheduledDate = new Date(order.scheduled_for);
      return scheduledDate >= start && scheduledDate <= end;
    });

    // Aplicar filtros
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
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pedidos Agendados</h1>
            <p className="text-muted-foreground mt-1">
              Visualize e gerencie todos os pedidos agendados
            </p>
          </div>

          {/* Estatísticas */}
          <ScheduledOrdersStats orders={allScheduledOrders} />
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna esquerda: Calendário e Filtros */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
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

          {/* Coluna direita: Lista de pedidos */}
          <div className="lg:col-span-8 xl:col-span-9">
          <ScheduledOrdersList
            orders={allScheduledOrders}
            loading={loading}
            onOrderUpdate={fetchAllScheduledOrders}
          />
          </div>
        </div>
      </div>
    </div>
  );
}
