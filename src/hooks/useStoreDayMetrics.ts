import { useQuery } from '@tanstack/react-query';
import { scheduleRpc, type DayMetrics } from '@/lib/scheduledOrders';

/** Null day delegates the business-day timezone to the existing server routine. */
export function useStoreDayMetrics(storeId: string | null, day: string | null = null) {
  return useQuery({
    queryKey: ['store-day-metrics', storeId, day],
    queryFn: async () => {
      try {
        return await scheduleRpc<DayMetrics>('store_day_metrics', { p_store_id: storeId, p_day: day });
      } catch (error) {
        console.warn('Métricas do dia indisponíveis; usando cálculo local.', error);
        return null;
      }
    },
    enabled: !!storeId,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}