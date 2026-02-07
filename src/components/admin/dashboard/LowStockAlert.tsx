import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PackageX, Package, ChevronRight, AlertTriangle, Pencil } from 'lucide-react';

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  stock_alert_threshold: number;
  image_url: string | null;
}

interface LowStockAlertProps {
  storeId: string | null;
  maxItems?: number;
}

export function LowStockAlert({ storeId, maxItems = 5 }: LowStockAlertProps) {
  // Buscar contagem real server-side (sem limite de 1000 linhas)
  const { data: stockCounts } = useQuery({
    queryKey: ['low-stock-count', storeId],
    queryFn: async () => {
      if (!storeId) return { low_stock_count: 0, out_of_stock_count: 0 };
      const { data, error } = await supabase
        .rpc('count_low_stock_products', { p_store_id: storeId });
      if (error) {
        console.error('Erro ao contar estoque baixo:', error);
        return { low_stock_count: 0, out_of_stock_count: 0 };
      }
      return data?.[0] || { low_stock_count: 0, out_of_stock_count: 0 };
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  // Buscar apenas os primeiros itens para exibição (limitado ao maxItems + margem)
  const { data: lowStockProducts, isLoading } = useQuery({
    queryKey: ['low-stock-products', storeId, maxItems],
    queryFn: async () => {
      if (!storeId) return [];
      
      // Buscar produtos com estoque 0 primeiro, depois os com estoque baixo
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, stock_alert_threshold, image_url')
        .eq('store_id', storeId)
        .eq('track_stock', true)
        .not('stock_quantity', 'is', null)
        .not('stock_alert_threshold', 'is', null)
        .order('stock_quantity', { ascending: true })
        .limit(200); // Buscar lote suficiente para filtrar

      if (error) {
        console.error('Erro ao buscar produtos com estoque baixo:', error);
        return [];
      }

      // Filtrar apenas os que estão abaixo ou igual ao limite
      return (data as LowStockProduct[])?.filter(
        p => p.stock_quantity <= p.stock_alert_threshold
      ) || [];
    },
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/10 dark:border-orange-800/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Usar contagem real do server-side
  const totalLowStock = Number(stockCounts?.low_stock_count) || 0;
  const totalOutOfStock = Number(stockCounts?.out_of_stock_count) || 0;

  // Não renderizar se não houver produtos com estoque baixo
  if (totalLowStock === 0 && (!lowStockProducts || lowStockProducts.length === 0)) {
    return null;
  }

  const displayProducts = (lowStockProducts || []).slice(0, maxItems);
  const hasMore = totalLowStock > maxItems;

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/10 dark:border-orange-800/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-base">
            <AlertTriangle className="w-5 h-5" />
            Estoque Baixo
          </CardTitle>
          {lowStockProducts.length > 0 && (
            <NavLink to="/dashboard/products?filter=low-stock">
              <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 h-8 px-2">
                Ver todos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </NavLink>
          )}
        </div>
        <CardDescription className="text-orange-600/80 dark:text-orange-300/80">
          {totalLowStock} produto{totalLowStock !== 1 ? 's' : ''} precisam de reposição
          {totalOutOfStock > 0 && (
            <span className="text-red-600 dark:text-red-400 font-medium ml-1">
              ({totalOutOfStock} esgotado{totalOutOfStock !== 1 ? 's' : ''})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <ScrollArea className={displayProducts.length > 3 ? 'h-[180px]' : undefined}>
          <div className="space-y-2">
            {displayProducts.map((product) => (
              <div 
                key={product.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                  product.stock_quantity === 0
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50'
                    : 'bg-white dark:bg-background border-orange-100 dark:border-orange-800/30'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-10 w-10 rounded-md flex-shrink-0">
                    <AvatarImage src={product.image_url || undefined} alt={product.name} className="object-cover" />
                    <AvatarFallback className="rounded-md bg-orange-100 dark:bg-orange-900/30">
                      <Package className="w-4 h-4 text-orange-600" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate text-foreground">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      {product.stock_quantity === 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                          <PackageX className="w-3 h-3" />
                          ESGOTADO
                        </span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          Estoque: {product.stock_quantity}
                        </span>
                      )}
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Limite: {product.stock_alert_threshold}
                      </span>
                    </div>
                  </div>
                </div>
                <NavLink to={`/dashboard/products/${product.id}`}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 flex-shrink-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </NavLink>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {hasMore && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            +{totalLowStock - maxItems} outros produtos
          </p>
        )}

        <NavLink to="/dashboard/products">
          <Button className="w-full mt-3" variant="outline" size="sm">
            <Package className="w-4 h-4 mr-2" />
            Gerenciar Estoque
          </Button>
        </NavLink>
      </CardContent>
    </Card>
  );
}
