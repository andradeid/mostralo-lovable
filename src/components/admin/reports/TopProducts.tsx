import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from '@/components/admin/reports/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp, Package } from 'lucide-react';
interface TopProductsProps {
  dateRange: DateRange;
  storeId: string | null;
}

export function TopProducts({ dateRange, storeId }: TopProductsProps) {
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (storeId) {
      fetchTopProducts();
    }
  }, [dateRange, storeId]);
  
  const fetchTopProducts = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      // Buscar order_items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product_name,
          product_id,
          quantity,
          subtotal,
          order:orders!inner(store_id, status, created_at)
        `)
        .eq('order.store_id', storeId)
        .eq('order.status', 'concluido')
        .gte('order.created_at', dateRange.from.toISOString())
        .lte('order.created_at', dateRange.to.toISOString());
      
      // Buscar comanda_items
      const { data: comandaItems } = await supabase
        .from('comanda_items')
        .select(`
          product_name,
          product_id,
          quantity,
          total_price,
          comanda:comandas!inner(store_id, status, closed_at)
        `)
        .eq('comanda.store_id', storeId)
        .eq('comanda.status', 'closed')
        .gte('comanda.closed_at', dateRange.from.toISOString())
        .lte('comanda.closed_at', dateRange.to.toISOString());
      
      const orderItemsData = orderItems || [];
      const comandaItemsData = comandaItems || [];
      
      // Agrupar por produto (combinando ambas fontes)
      const grouped: Record<string, any> = {};
      
      // Processar order_items
      orderItemsData.forEach((item: any) => {
        const name = item.product_name;
        if (!grouped[name]) {
          grouped[name] = { name, quantity: 0, revenue: 0, source: { orders: 0, comandas: 0 } };
        }
        grouped[name].quantity += item.quantity;
        grouped[name].revenue += Number(item.subtotal);
        grouped[name].source.orders += item.quantity;
      });
      
      // Processar comanda_items
      comandaItemsData.forEach((item: any) => {
        const name = item.product_name;
        if (!grouped[name]) {
          grouped[name] = { name, quantity: 0, revenue: 0, source: { orders: 0, comandas: 0 } };
        }
        grouped[name].quantity += item.quantity;
        grouped[name].revenue += Number(item.total_price);
        grouped[name].source.comandas += item.quantity;
      });
      
      // Ordenar por quantidade vendida
      const sorted = Object.values(grouped)
        .sort((a: any, b: any) => b.quantity - a.quantity)
        .slice(0, 10);
      
      // Calcular % do total
      const totalRevenue = sorted.reduce((sum: number, p: any) => sum + p.revenue, 0);
      const withPercentage = sorted.map((p: any, index: number) => ({
        ...p,
        position: index + 1,
        percentage: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0
      }));
      
      setTopProducts(withPercentage);
    } catch (error) {
      console.error('Erro ao buscar produtos mais vendidos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Alert className="bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800">
        <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <AlertDescription className="text-purple-800 dark:text-purple-200 text-sm">
          <strong>🏆 Ranking de Produtos:</strong> Os <strong>10 produtos mais vendidos</strong> no período selecionado, combinando <strong>Pedidos Online + Comandas PDV</strong>. O ranking é ordenado por <strong>quantidade vendida</strong>. Veja também a receita gerada e o percentual de contribuição de cada item para o faturamento total.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Produtos por Quantidade (Pedidos + Comandas)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer 
            config={{
              quantity: { label: 'Quantidade', color: 'hsl(var(--chart-1))' }
            }} 
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="quantity" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd Vendida</TableHead>
                  <TableHead>Online</TableHead>
                  <TableHead>PDV</TableHead>
                  <TableHead>Receita Total</TableHead>
                  <TableHead>% do Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.name}>
                    <TableCell>
                      {product.position === 1 && <Trophy className="inline w-5 h-5 text-yellow-500 mr-1" />}
                      {product.position === 2 && <Trophy className="inline w-5 h-5 text-gray-400 mr-1" />}
                      {product.position === 3 && <Trophy className="inline w-5 h-5 text-orange-600 mr-1" />}
                      <span className="font-semibold">{product.position}º</span>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.quantity} un</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-blue-600">{product.source.orders}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-purple-600">{product.source.comandas}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      R$ {product.revenue.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        {product.percentage.toFixed(1)}%
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
