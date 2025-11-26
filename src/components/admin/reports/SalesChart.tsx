import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from '@/components/admin/reports/types';
import { Skeleton } from '@/components/ui/skeleton';

interface SalesChartProps {
  dateRange: DateRange;
}

export function SalesChart({ dateRange }: SalesChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchChartData();
  }, [dateRange]);
  
  const fetchChartData = async () => {
    setLoading(true);
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at, total, status')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });
      
      if (!orders) {
        setLoading(false);
        return;
      }
      
      // Agrupar por dia
      const grouped = orders.reduce((acc, order) => {
        const date = format(new Date(order.created_at), 'dd/MM', { locale: ptBR });
        if (!acc[date]) {
          acc[date] = { date, vendas: 0, pedidos: 0, ticketMedio: 0, _count: 0 };
        }
        
        if (order.status === 'concluido') {
          acc[date].vendas += Number(order.total);
          acc[date]._count += 1;
        }
        
        if (order.status !== 'cancelado') {
          acc[date].pedidos += 1;
        }
        
        return acc;
      }, {} as Record<string, any>);
      
      // Calcular ticket médio
      const result = Object.values(grouped).map((item: any) => ({
        date: item.date,
        vendas: Number(item.vendas.toFixed(2)),
        pedidos: item.pedidos,
        ticketMedio: item._count > 0 ? Number((item.vendas / item._count).toFixed(2)) : 0
      }));
      
      setChartData(result);
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução de Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer 
          config={{
            vendas: { label: 'Vendas (R$)', color: 'hsl(var(--chart-1))' },
            pedidos: { label: 'Pedidos', color: 'hsl(var(--chart-2))' },
            ticketMedio: { label: 'Ticket Médio (R$)', color: 'hsl(var(--chart-3))' }
          }} 
          className="h-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="vendas" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2} 
                name="Vendas (R$)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="pedidos" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2} 
                name="Pedidos"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="ticketMedio" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2} 
                name="Ticket Médio (R$)"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
