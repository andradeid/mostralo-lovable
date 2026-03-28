import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDown } from 'lucide-react';

interface ShopOrderFunnelProps {
  storeId: string | null;
}

const funnelSteps = [
  { key: 'entrada', label: 'Recebidos', color: 'bg-blue-500' },
  { key: 'em_preparo', label: 'Em preparo', color: 'bg-orange-500' },
  { key: 'em_transito', label: 'Em entrega', color: 'bg-purple-500' },
  { key: 'concluido', label: 'Finalizados', color: 'bg-green-500' },
];

export function ShopOrderFunnel({ storeId }: ShopOrderFunnelProps) {
  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['shop-order-funnel', storeId, today],
    queryFn: async () => {
      if (!storeId) return null;

      const { data: orders } = await supabase
        .from('orders')
        .select('status')
        .eq('store_id', storeId)
        .gte('created_at', `${today}T00:00:00`);

      if (!orders) return null;

      const counts: Record<string, number> = {};
      for (const o of orders) {
        counts[o.status] = (counts[o.status] || 0) + 1;
      }

      // Add aggregated counts
      counts['entrada'] = (counts['entrada'] || 0) + (counts['aguardando_pagamento'] || 0);
      counts['em_transito'] = (counts['em_transito'] || 0) + (counts['aguarda_retirada'] || 0);

      const total = orders.length;
      const cancelled = counts['cancelado'] || 0;

      return { counts, total, cancelled };
    },
    enabled: !!storeId,
    retry: 2,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3"><Skeleton className="h-5 w-36" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(1, ...funnelSteps.map(s => data?.counts?.[s.key] || 0));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowDown className="w-4 h-4 text-primary" />
            Funil de Pedidos (Hoje)
          </CardTitle>
          {(data?.cancelled || 0) > 0 && (
            <span className="text-xs text-red-600 dark:text-red-400">
              {data!.cancelled} cancelados
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {funnelSteps.map((step) => {
          const count = data?.counts?.[step.key] || 0;
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={step.key} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">{step.label}</span>
              <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${step.color} transition-all flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max(pct, count > 0 ? 15 : 0)}%` }}
                >
                  {count > 0 && (
                    <span className="text-[10px] font-bold text-white">{count}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {(data?.total || 0) === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">Nenhum pedido hoje</p>
        )}
      </CardContent>
    </Card>
  );
}
