import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';

interface ShopTopProductsProps {
  storeId: string | null;
}

export function ShopTopProducts({ storeId }: ShopTopProductsProps) {
  const { data: topProducts, isLoading } = useQuery({
    queryKey: ['shop-top-products', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      // Últimos 30 dias
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceStr = since.toISOString();

      const { data: items } = await supabase
        .from('order_items')
        .select('product_name, quantity, orders!inner(store_id, status, created_at)')
        .eq('orders.store_id', storeId)
        .gte('orders.created_at', sinceStr)
        .not('orders.status', 'eq', 'cancelado');

      if (!items || items.length === 0) return [];

      // Agrupar por produto
      const productMap: Record<string, number> = {};
      for (const item of items) {
        const name = item.product_name || 'Sem nome';
        productMap[name] = (productMap[name] || 0) + (item.quantity || 1);
      }

      return Object.entries(productMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, qty], i) => ({ name, qty, rank: i + 1 }));
    },
    enabled: !!storeId,
    retry: 2,
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3"><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    );
  }

  const medals = ['🥇', '🥈', '🥉', '4.', '5.'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Mais Vendidos (30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {topProducts && topProducts.length > 0 ? (
          <div className="space-y-2">
            {topProducts.map((p) => {
              const maxQty = topProducts[0].qty;
              const pct = maxQty > 0 ? (p.qty / maxQty) * 100 : 0;
              return (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-sm w-6 text-center shrink-0">{medals[p.rank - 1]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{p.qty} un.</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Sem dados de vendas</p>
        )}
      </CardContent>
    </Card>
  );
}
