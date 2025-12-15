import { useEffect, useState } from 'react';
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

export function StoreHealthIndicators() {
  const [stores, setStores] = useState<StoreHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoreHealth();
  }, []);

  const fetchStoreHealth = async () => {
    try {
      // Buscar lojas ativas
      const { data: activeStores } = await supabase
        .from('stores')
        .select('id, name')
        .eq('status', 'active')
        .limit(8);

      if (!activeStores) {
        setLoading(false);
        return;
      }

      const healthData: StoreHealth[] = [];

      for (const store of activeStores) {
        // Produtos
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', store.id);

        // Pedidos
        const { data: orders } = await supabase
          .from('orders')
          .select('id, created_at')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Clientes únicos
        const { data: customerStores } = await supabase
          .from('customer_stores')
          .select('customer_id')
          .eq('store_id', store.id);

        const totalProducts = products?.length || 0;
        const totalOrders = orders?.length || 0;
        const totalCustomers = customerStores?.length || 0;
        const lastOrderDate = orders?.[0]?.created_at || null;

        // Calcular health score (0-100)
        let healthScore = 0;
        
        // Produtos (30 pontos)
        if (totalProducts >= 10) healthScore += 30;
        else if (totalProducts >= 5) healthScore += 20;
        else if (totalProducts >= 1) healthScore += 10;

        // Pedidos (30 pontos)
        if (totalOrders >= 50) healthScore += 30;
        else if (totalOrders >= 20) healthScore += 20;
        else if (totalOrders >= 1) healthScore += 10;

        // Clientes (20 pontos)
        if (totalCustomers >= 20) healthScore += 20;
        else if (totalCustomers >= 10) healthScore += 15;
        else if (totalCustomers >= 1) healthScore += 10;

        // Atividade recente (20 pontos)
        if (lastOrderDate) {
          const daysSinceLastOrder = Math.floor(
            (new Date().getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceLastOrder <= 1) healthScore += 20;
          else if (daysSinceLastOrder <= 7) healthScore += 15;
          else if (daysSinceLastOrder <= 30) healthScore += 10;
          else if (daysSinceLastOrder <= 60) healthScore += 5;
        }

        // Determinar status
        let status: 'excellent' | 'good' | 'warning' | 'critical' = 'critical';
        if (healthScore >= 80) status = 'excellent';
        else if (healthScore >= 60) status = 'good';
        else if (healthScore >= 40) status = 'warning';

        healthData.push({
          storeId: store.id,
          storeName: store.name,
          healthScore,
          totalProducts,
          totalOrders,
          totalCustomers,
          lastOrderDate,
          status
        });
      }

      // Ordenar por health score (pior primeiro para destacar problemas)
      healthData.sort((a, b) => a.healthScore - b.healthScore);

      setStores(healthData);
    } catch (error) {
      console.error('Erro ao buscar saúde das lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 text-[10px]">★★★★★</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800 text-[10px]">★★★★</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">★★★</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 text-[10px]">★★</Badge>;
      default:
        return null;
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

  if (loading) {
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

  return (
    <Card>
      <CardHeader className="pb-2 p-3 md:p-4">
        <CardTitle className="flex items-center text-sm md:text-base">
          <Star className="w-4 h-4 mr-2" />
          Saúde das Lojas
        </CardTitle>
        <CardDescription className="text-xs">
          Top 8 lojas por engajamento
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:p-4 pt-0">
        <ScrollArea className="max-h-[300px] md:max-h-[380px]">
          <div className="space-y-2">
            {stores.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma loja ativa
              </p>
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
                        <div 
                          className={`h-1.5 rounded-full transition-all ${getProgressColor(store.status)}`}
                          style={{ width: `${store.healthScore}%` }}
                        />
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
