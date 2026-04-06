import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar, ShoppingCart, Wallet, TrendingUp, Users, Clock,
  TrendingDown
} from 'lucide-react';
import { getDashboardOccupancyStats } from './dashboardOccupancyStats';
import { useDashboardOrders } from '@/hooks/useDashboardOrders';

interface AdaptiveKPIsProps {
  storeId: string | null;
  bookingEnabled: boolean;
  shopEnabled: boolean;
}

export function AdaptiveKPIs({ storeId, bookingEnabled, shopEnabled }: AdaptiveKPIsProps) {
  // Usar hook consolidado em vez de query independente
  const { data: dashOrders, isLoading: loadingOrders } = useDashboardOrders(
    shopEnabled ? storeId : null
  );

  const today = new Date().toISOString().split('T')[0];

  const { data: bookingStats, isLoading: loadingBookings } = useQuery({
    queryKey: ['adaptive-kpi-bookings', storeId, today],
    queryFn: async () => {
      if (!storeId) return null;

      const [{ data: bookings }, occupancyStats] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, status')
          .eq('store_id', storeId)
          .eq('booking_date', today),
        getDashboardOccupancyStats(storeId),
      ]);

      const total = bookings?.length || 0;
      const confirmed = bookings?.filter((booking) => booking.status === 'confirmed').length || 0;
      const inProgress = bookings?.filter((booking) => booking.status === 'in_progress').length || 0;
      const completed = bookings?.filter((booking) => booking.status === 'completed').length || 0;
      const cancelled = bookings?.filter((booking) => booking.status === 'cancelled').length || 0;
      const noShow = bookings?.filter((booking) => booking.status === 'no_show').length || 0;

      return {
        total, confirmed, inProgress, completed, cancelled, noShow,
        occupancy: occupancyStats.occupancy,
        profCount: occupancyStats.scheduledProfessionalCount,
      };
    },
    enabled: !!storeId && bookingEnabled,
    staleTime: 30_000,
  });

  const isLoading = (shopEnabled && loadingOrders) || (bookingEnabled && loadingBookings);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  const orderStats = dashOrders ? {
    revenue: dashOrders.revenueToday,
    orders: dashOrders.orderCount,
    avgTicket: dashOrders.avgTicket,
  } : null;

  const kpis: Array<{
    label: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
  }> = [];

  if (bookingEnabled && bookingStats) {
    kpis.push({
      label: 'Agendamentos', value: bookingStats.total,
      icon: Calendar, color: 'text-blue-600 dark:text-blue-400',
      subtitle: `${bookingStats.completed} concluídos`,
    });
    kpis.push({
      label: 'Em atendimento', value: bookingStats.inProgress,
      icon: Clock, color: 'text-orange-600 dark:text-orange-400',
      subtitle: `${bookingStats.confirmed} confirmados`,
    });
    kpis.push({
      label: 'Ocupação', value: `${bookingStats.occupancy}%`,
      icon: TrendingUp,
      color: bookingStats.occupancy > 70 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-amber-600 dark:text-amber-400',
      subtitle: `${bookingStats.profCount} profissionais`,
    });
  }

  if (shopEnabled && orderStats) {
    kpis.push({
      label: 'Receita hoje',
      value: orderStats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: Wallet, color: 'text-green-600 dark:text-green-400',
      subtitle: `${orderStats.orders} pedidos`,
    });
    if (!bookingEnabled) {
      kpis.push({
        label: 'Pedidos', value: orderStats.orders,
        icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400',
      });
      kpis.push({
        label: 'Ticket médio',
        value: orderStats.avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400',
      });
    }
  }

  if (bookingEnabled && bookingStats && (bookingStats.cancelled + bookingStats.noShow) > 0) {
    kpis.push({
      label: 'Cancelamentos', value: bookingStats.cancelled + bookingStats.noShow,
      icon: TrendingDown, color: 'text-red-600 dark:text-red-400',
      subtitle: `${bookingStats.noShow} não compareceu`,
    });
  }

  if (bookingEnabled && bookingStats && kpis.length < 4) {
    kpis.push({
      label: 'Profissionais', value: bookingStats.profCount,
      icon: Users, color: 'text-violet-600 dark:text-violet-400',
      subtitle: 'ativos hoje',
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.slice(0, 4).map((kpi, i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
            {kpi.subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
