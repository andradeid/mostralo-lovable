import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from '@/components/admin/reports/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, TrendingUp } from 'lucide-react';

interface TopProductsProps {
  dateRange: DateRange;
}

export function TopProducts({ dateRange }: TopProductsProps) {
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchTopProducts();
  }, [dateRange]);
  
  const fetchTopProducts = async () => {
    setLoading(true);
    try {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          product_name,
          product_id,
          quantity,
          subtotal,
          order:orders!inner(store_id, status, created_at)
        `)
        .eq('order.status', 'concluido')
        .gte('order.created_at', dateRange.from.toISOString())
        .lte('order.created_at', dateRange.to.toISOString());
      
      if (!orderItems) {
        setLoading(false);
        return;
      }
      
      // Agrupar por produto
      const grouped = orderItems.reduce((acc, item: any) => {
        const name = item.product_name;
        if (!acc[name]) {
          acc[name] = {
            name,
            quantity: 0,
            revenue: 0
          };
        }
        acc[name].quantity += item.quantity;
        acc[name].revenue += Number(item.subtotal);
        return acc;
      }, {} as Record<string, any>);
      
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
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Produtos por Quantidade</CardTitle>
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
