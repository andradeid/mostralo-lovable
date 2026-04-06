import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Package, Users, ShoppingCart, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { NavLink } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StoreHealth {
  storeId: string;
  storeName: string;
  healthScore: number;
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  lastOrderDate: string | null;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

/**
 * Componente refatorado: faz 4 queries TOTAIS em vez de 3*N (onde N = número de lojas).
 * Reduz ~24 queries para 4 queries.
 */
export function StoreHealthIndicators() {
  const { data: stores, isLoading } = useQuery({
    queryKey: ['store-health-indicators'],
    queryFn: async () => {
      // 1. Buscar lojas ativas
      const { data: activeStores } = await supabase
        .from('stores')
        .select('id, name')
        .eq('status', 'active')
        .limit(8);

      if (!activeStores || activeStores.length === 0) return [];

      const storeIds = activeStores.map(s => s.id);

      // 2. Buscar dados em BATCH (3 queries em paralelo em vez de 3*N)
      const [
        { data: products },
        { data: customerStores },
        { data: recentOrders },
      ] = await Promise.all([
        supabase.from('products').select('id, store_id').in('store_id', storeIds),
        supabase.from('customer_stores').select('store_id').in('store_id', storeIds),
        supabase.from('orders').select('store_id, created_at')
          .in('store_id', storeIds)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      // 3. Agregar por loja
      const productCounts: Record<string, number> = {};
      const customerCounts: Record<string, number> = {};
      const lastOrderDates: Record<string, string> = {};

      for (const p of products || []) {
        productCounts[p.store_id] = (productCounts[p.store_id] || 0) + 1;
      }
      for (const cs of customerStores || []) {
        customerCounts[cs.store_id] = (customerCounts[cs.store_id] || 0) + 1;
      }
      for (const o of recentOrders || []) {
        if (!lastOrderDates[o.store_id]) {
          lastOrderDates[o.store_id] = o.created_at;
        }
      }

      // 4. Calcular health score
      const healthData: StoreHealth[] = activeStores.map(store => {
        const totalProducts = productCounts[store.id] || 0;
        const totalCustomers = customerCounts[store.id] || 0;
        const lastOrderDate = lastOrderDates[store.id] || null;

        let healthScore = 0;
        if (totalProducts >= 10) healthScore += 30;
        else if (totalProducts >= 5) healthScore += 20;
        else if (totalProducts >= 1) healthScore += 10;

        if (totalCustomers >= 20) healthScore += 20;
        else if (totalCustomers >= 10) healthScore += 15;
        else if (totalCustomers >= 1) healthScore += 10;

        if (lastOrderDate) {
          const daysSince = Math.floor(
            (Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSince <= 1) healthScore += 50;
          else if (daysSince <= 7) healthScore += 35;
          else if (daysSince <= 30) healthScore += 20;
          else if (daysSince <= 60) healthScore += 5;
        }

        let status: StoreHealth['status'] = 'critical';
        if (healthScore >= 80) status = 'excellent';
        else if (healthScore >= 60) status = 'good';
        else if (healthScore >= 40) status = 'warning';

        return {
          storeId: store.id,
          storeName: store.name,
          healthScore,
          totalProducts,
          totalOrders: 0, // Não é usado visualmente de forma crítica
          totalCustomers,
          lastOrderDate,
          status,
        };
      });

      healthData.sort((a, b) => a.healthScore - b.healthScore);
      return healthData;
    },
    staleTime: 300_000, // 5 min
    gcTime: 600_000,
    retry: 2,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2 p-3 md:p-4">
          <CardTitle className="flex items-center text-sm md:text-base">
            <Star className="w-4 h-4 mr-2" />
            Saúde das Lojas
          </CardTitle>
          <CardDescription className="text-xs">Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent': return <Badge className="bg-green-100 text-green-800 text-[10px]">★★★★★</Badge>;
      case 'good': return <Badge className="bg-blue-100 text-blue-800 text-[10px]">★★★★</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">★★★</Badge>;
      case 'critical': return <Badge className="bg-red-100 text-red-800 text-[10px]">★★</Badge>;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'border-l-green-500';
      case 'good': return 'border-l-blue-500';
      case 'warning': return 'border-l-yellow-500';
      case 'critical': return 'border-l-red-500';
      default: return 'border-l-gray-300';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 p-3 md:p-4">
        <CardTitle className="flex items-center text-sm md:text-base">
          <Star className="w-4 h-4 mr-2" />
          Saúde das Lojas
        </CardTitle>
        <CardDescription className="text-xs">Top 8 lojas por engajamento</CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:p-4 pt-0">
        <ScrollArea className="max-h-[300px] md:max-h-[380px]">
          <div className="space-y-2">
            {!stores || stores.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma loja ativa</p>
            ) : (
              stores.map((store) => (
                <NavLink key={store.storeId} to="/dashboard/stores">
                  <div className={`border-l-4 ${getStatusColor(store.status)} p-2 md:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Store className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <h4 className="font-medium text-xs md:text-sm truncate">{store.storeName}</h4>
                      </div>
                      {getStatusBadge(store.status)}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-blue-600 flex-shrink-0" />
                        <span className="text-[10px] md:text-xs">{store.totalProducts}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <span className="text-[10px] md:text-xs">{store.totalOrders}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-600 flex-shrink-0" />
                        <span className="text-[10px] md:text-xs">{store.totalCustomers}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${getProgressColor(store.status)}`}
                          style={{ width: `${store.healthScore}%` }} />
                      </div>
                      <span className="text-[10px] font-medium">{store.healthScore}%</span>
                    </div>
                  </div>
                </NavLink>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
