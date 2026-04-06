import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, Star } from 'lucide-react';
import { useDashboardOrders } from '@/hooks/useDashboardOrders';

interface ShopCustomerStatsProps {
  storeId: string | null;
}

export function ShopCustomerStats({ storeId }: ShopCustomerStatsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['shop-customer-stats', storeId],
    queryFn: async () => {
      if (!storeId) return null;

      const today = new Date().toISOString().split('T')[0];

      // Buscar apenas customer_stores (leve, com count)
      const [{ count: newToday }, { count: totalCustomers }] = await Promise.all([
        supabase.from('customer_stores')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .gte('created_at', `${today}T00:00:00`),
        supabase.from('customer_stores')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId),
      ]);

      return {
        newToday: newToday || 0,
        total: totalCustomers || 0,
      };
    },
    enabled: !!storeId,
    staleTime: 300_000,
    retry: 2,
  });

  // Usar dados consolidados de orders para stats de clientes recorrentes
  const { data: dashOrders } = useDashboardOrders(storeId);

  // Calcular recorrentes a partir dos dados já em cache (sem query extra)
  const customerCounts: Record<string, number> = {};
  if (dashOrders?.activeOrders) {
    for (const o of dashOrders.activeOrders) {
      const name = o.customer_name || 'anon';
      customerCounts[name] = (customerCounts[name] || 0) + 1;
    }
  }
  const recurring = Object.values(customerCounts).filter(c => c > 1).length;
  const topCustomer = Object.entries(customerCounts).sort(([, a], [, b]) => b - a)[0];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3"><Skeleton className="h-5 w-28" /></CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <UserPlus className="w-4 h-4 mx-auto mb-1 text-green-600 dark:text-green-400" />
            <p className="text-lg font-bold">{data?.newToday || 0}</p>
            <p className="text-[10px] text-muted-foreground">Novos hoje</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <Users className="w-4 h-4 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
            <p className="text-lg font-bold">{recurring}</p>
            <p className="text-[10px] text-muted-foreground">Recorrentes</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{data?.total || 0}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
        </div>

        {topCustomer && topCustomer[0] !== 'anon' && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
            <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Cliente destaque (hoje)</p>
              <p className="text-sm font-medium truncate">{topCustomer[0]}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{topCustomer[1]} pedidos</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
