import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Package, Users, ShoppingCart, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { NavLink } from 'react-router-dom';

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
        .limit(10);

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
        return <Badge className="bg-green-100 text-green-800">★★★★★ Excelente</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800">★★★★☆ Bom</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">★★★☆☆ Atenção</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">★☆☆☆☆ Crítico</Badge>;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'border-green-500';
      case 'good': return 'border-blue-500';
      case 'warning': return 'border-yellow-500';
      case 'critical': return 'border-red-500';
      default: return 'border-gray-300';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Saúde das Lojas
          </CardTitle>
          <CardDescription>Carregando indicadores...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="w-5 h-5 mr-2" />
          Saúde das Lojas
        </CardTitle>
        <CardDescription>
          Indicadores de performance e engajamento (top 10)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {stores.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma loja ativa no momento
            </p>
          ) : (
            stores.map((store) => (
              <NavLink key={store.storeId} to={`/dashboard/stores`}>
                <div className={`border-l-4 ${getStatusColor(store.status)} p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-semibold">{store.storeName}</h4>
                    </div>
                    {getStatusBadge(store.status)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Produtos</p>
                        <p className="text-sm font-bold">{store.totalProducts}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pedidos</p>
                        <p className="text-sm font-bold">{store.totalOrders}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Clientes</p>
                        <p className="text-sm font-bold">{store.totalCustomers}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Score de Saúde:</span>
                      <span className="font-bold">{store.healthScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          store.status === 'excellent' ? 'bg-green-500' :
                          store.status === 'good' ? 'bg-blue-500' :
                          store.status === 'warning' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${store.healthScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </NavLink>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
