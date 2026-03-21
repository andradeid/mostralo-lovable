import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ShopDashboardMode = 'onboarding' | 'parado' | 'ativo';

export function useShopDashboardMode(storeId: string | null) {
  return useQuery({
    queryKey: ['shop-dashboard-mode', storeId],
    queryFn: async (): Promise<ShopDashboardMode> => {
      if (!storeId) return 'onboarding';

      const today = new Date().toISOString().split('T')[0];

      // Total de pedidos (all time) — para detectar onboarding
      const { count: totalAllTime } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId);

      if ((totalAllTime ?? 0) < 5) return 'onboarding';

      // Pedidos de hoje
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('created_at')
        .eq('store_id', storeId)
        .gte('created_at', `${today}T00:00:00`)
        .not('status', 'eq', 'cancelado')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!todayOrders || todayOrders.length === 0) {
        return 'parado';
      }

      // Verifica se última venda foi há mais de 4h
      const lastOrderTime = new Date(todayOrders[0].created_at).getTime();
      const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
      if (lastOrderTime < fourHoursAgo) {
        return 'parado';
      }

      return 'ativo';
    },
    enabled: !!storeId,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
