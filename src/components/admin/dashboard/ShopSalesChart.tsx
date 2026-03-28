import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface ShopSalesChartProps {
  storeId: string | null;
}

export function ShopSalesChart({ storeId }: ShopSalesChartProps) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['shop-sales-chart', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      // Últimos 7 dias
      const days: { date: string; label: string; total: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        days.push({ date: dateStr, label, total: 0 });
      }

      const startDate = days[0].date;
      const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('store_id', storeId)
        .gte('created_at', `${startDate}T00:00:00`)
        .not('status', 'eq', 'cancelado');

      if (orders) {
        for (const order of orders) {
          const orderDate = order.created_at.split('T')[0];
          const day = days.find(d => d.date === orderDate);
          if (day) day.total += Number(order.total || 0);
        }
      }

      return days;
    },
    enabled: !!storeId,
    retry: 2,
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Vendas — Últimos 7 dias
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                hide 
              />
              <Tooltip
                formatter={(value: number) => [
                  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                  'Vendas'
                ]}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="total" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
            Sem dados de vendas no período
          </div>
        )}
      </CardContent>
    </Card>
  );
}
