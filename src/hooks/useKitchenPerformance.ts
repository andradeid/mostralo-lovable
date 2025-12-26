import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';

interface RawItem {
  product_name: string;
  added_at: string;
  prepared_at: string;
  quantity: number;
}

export interface ProductPerformance {
  product_name: string;
  total_prepared: number;
  total_quantity: number;
  avg_prep_time: number;
  min_prep_time: number;
  max_prep_time: number;
}

export interface HourlyVolume {
  hour: number;
  count: number;
}

export function useKitchenPerformance() {
  const { storeId } = useStoreAccess();

  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ['kitchen-performance', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Buscar itens prontos de comandas
      const { data: comandaItems } = await supabase
        .from('comanda_items')
        .select(`
          product_name,
          added_at,
          prepared_at,
          quantity,
          comandas!inner (store_id)
        `)
        .eq('comandas.store_id', storeId)
        .eq('preparation_status', 'ready')
        .gte('prepared_at', todayISO)
        .not('prepared_at', 'is', null);

      // Buscar itens prontos de orders
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product_name,
          created_at,
          prepared_at,
          quantity,
          orders!inner (store_id)
        `)
        .eq('orders.store_id', storeId)
        .eq('preparation_status', 'ready')
        .gte('prepared_at', todayISO)
        .not('prepared_at', 'is', null);

      const items: RawItem[] = [
        ...(comandaItems || []).map((item: any) => ({
          product_name: item.product_name,
          added_at: item.added_at,
          prepared_at: item.prepared_at,
          quantity: item.quantity,
        })),
        ...(orderItems || []).map((item: any) => ({
          product_name: item.product_name,
          added_at: item.created_at,
          prepared_at: item.prepared_at,
          quantity: item.quantity,
        })),
      ];

      return items;
    },
    enabled: !!storeId,
    refetchInterval: 60000,
  });

  // Calcular métricas por produto
  const productPerformance = useMemo(() => {
    const grouped: Record<string, { times: number[]; totalQty: number }> = {};

    rawItems.forEach((item) => {
      const prepTime = Math.floor(
        (new Date(item.prepared_at).getTime() - new Date(item.added_at).getTime()) / 60000
      );
      
      if (!grouped[item.product_name]) {
        grouped[item.product_name] = { times: [], totalQty: 0 };
      }
      grouped[item.product_name].times.push(prepTime);
      grouped[item.product_name].totalQty += item.quantity;
    });

    const products: ProductPerformance[] = Object.entries(grouped).map(([name, data]) => ({
      product_name: name,
      total_prepared: data.times.length,
      total_quantity: data.totalQty,
      avg_prep_time: Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length),
      min_prep_time: Math.min(...data.times),
      max_prep_time: Math.max(...data.times),
    }));

    // Ordenar por tempo médio (mais demorados primeiro)
    return products.sort((a, b) => b.avg_prep_time - a.avg_prep_time);
  }, [rawItems]);

  // Calcular volume por hora
  const hourlyVolume = useMemo(() => {
    const hours: Record<number, number> = {};

    rawItems.forEach((item) => {
      const hour = new Date(item.prepared_at).getHours();
      hours[hour] = (hours[hour] || 0) + item.quantity;
    });

    // Preencher horas sem dados
    const result: HourlyVolume[] = [];
    for (let h = 6; h <= 23; h++) {
      result.push({ hour: h, count: hours[h] || 0 });
    }

    return result;
  }, [rawItems]);

  // KPIs gerais
  const kpis = useMemo(() => {
    if (rawItems.length === 0) {
      return {
        totalItems: 0,
        totalQuantity: 0,
        avgPrepTime: 0,
        fastestTime: 0,
        slowestTime: 0,
      };
    }

    const times = rawItems.map((item) =>
      Math.floor(
        (new Date(item.prepared_at).getTime() - new Date(item.added_at).getTime()) / 60000
      )
    );

    const totalQty = rawItems.reduce((acc, item) => acc + item.quantity, 0);

    return {
      totalItems: rawItems.length,
      totalQuantity: totalQty,
      avgPrepTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      fastestTime: Math.min(...times),
      slowestTime: Math.max(...times),
    };
  }, [rawItems]);

  return {
    productPerformance,
    hourlyVolume,
    kpis,
    isLoading,
  };
}
