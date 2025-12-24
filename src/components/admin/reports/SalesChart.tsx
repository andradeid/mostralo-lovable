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
  storeId: string | null;
}

export function SalesChart({ dateRange, storeId }: SalesChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (storeId) {
      fetchChartData();
    }
  }, [dateRange, storeId]);
  
  const fetchChartData = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      // Buscar orders
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at, total, status')
        .eq('store_id', storeId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });
      
      // Buscar comandas fechadas
      const { data: comandas } = await supabase
        .from('comandas')
        .select('closed_at, total, status')
        .eq('store_id', storeId)
        .eq('status', 'closed')
        .gte('closed_at', dateRange.from.toISOString())
        .lte('closed_at', dateRange.to.toISOString())
        .order('closed_at', { ascending: true });
      
      const ordersData = orders || [];
      const comandasData = comandas || [];
      
      // Agrupar por dia - combinando orders e comandas
      const grouped: Record<string, any> = {};
      
      // Processar orders
      ordersData.forEach(order => {
        const date = format(new Date(order.created_at), 'dd/MM', { locale: ptBR });
        if (!grouped[date]) {
          grouped[date] = { date, vendas: 0, pedidos: 0, comandas: 0, _countOrders: 0, _countComandas: 0 };
        }
        
        if (order.status === 'concluido') {
          grouped[date].vendas += Number(order.total);
          grouped[date]._countOrders += 1;
        }
        
        if (order.status !== 'cancelado') {
          grouped[date].pedidos += 1;
        }
      });
      
      // Processar comandas
      comandasData.forEach(comanda => {
        if (!comanda.closed_at) return;
        const date = format(new Date(comanda.closed_at), 'dd/MM', { locale: ptBR });
        if (!grouped[date]) {
          grouped[date] = { date, vendas: 0, pedidos: 0, comandas: 0, _countOrders: 0, _countComandas: 0 };
        }
        
        grouped[date].vendas += Number(comanda.total);
        grouped[date].comandas += 1;
        grouped[date]._countComandas += 1;
      });
      
      // Calcular ticket médio
      const result = Object.values(grouped).map((item: any) => ({
        date: item.date,
        vendas: Number(item.vendas.toFixed(2)),
        pedidos: item.pedidos,
        comandas: item.comandas,
        ticketMedio: (item._countOrders + item._countComandas) > 0 
          ? Number((item.vendas / (item._countOrders + item._countComandas)).toFixed(2)) 
          : 0
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
        <CardTitle>Evolução de Vendas (Pedidos + Comandas)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer 
          config={{
            vendas: { label: 'Vendas (R$)', color: 'hsl(var(--chart-1))' },
            pedidos: { label: 'Pedidos Online', color: 'hsl(var(--chart-2))' },
            comandas: { label: 'Comandas PDV', color: 'hsl(var(--chart-4))' },
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
                name="Pedidos Online"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="comandas" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={2} 
                name="Comandas PDV"
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
