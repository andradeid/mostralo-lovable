import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from '@/components/admin/reports/types';
import { format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface SalesTrendsProps {
  dateRange: DateRange;
}

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function SalesTrends({ dateRange }: SalesTrendsProps) {
  const [dayData, setDayData] = useState<any[]>([]);
  const [deliveryData, setDeliveryData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchTrendsData();
  }, [dateRange]);
  
  const fetchTrendsData = async () => {
    setLoading(true);
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .eq('status', 'concluido');
      
      if (!orders) {
        setLoading(false);
        return;
      }
      
      // Agrupar por dia da semana
      const byDay = orders.reduce((acc, order) => {
        const day = getDay(new Date(order.created_at));
        if (!acc[day]) {
          acc[day] = { name: dayNames[day], vendas: 0, pedidos: 0 };
        }
        acc[day].vendas += Number(order.total);
        acc[day].pedidos += 1;
        return acc;
      }, {} as Record<number, any>);
      
      setDayData(Object.values(byDay).sort((a: any, b: any) => 
        dayNames.indexOf(a.name) - dayNames.indexOf(b.name)
      ));
      
      // Agrupar por tipo de entrega
      const byDelivery = orders.reduce((acc, order) => {
        const type = order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada';
        if (!acc[type]) {
          acc[type] = { name: type, value: 0 };
        }
        acc[type].value += 1;
        return acc;
      }, {} as Record<string, any>);
      
      setDeliveryData(Object.values(byDelivery));
      
      // Agrupar por forma de pagamento
      const byPayment = orders.reduce((acc, order) => {
        const method = order.payment_method;
        const methodLabels: Record<string, string> = {
          pix: 'PIX',
          credit_card: 'Cartão de Crédito',
          debit_card: 'Cartão de Débito',
          cash: 'Dinheiro',
        };
        const name = methodLabels[method] || method;
        if (!acc[name]) {
          acc[name] = { name, value: 0 };
        }
        acc[name].value += 1;
        return acc;
      }, {} as Record<string, any>);
      
      setPaymentData(Object.values(byPayment));
    } catch (error) {
      console.error('Erro ao buscar tendências:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Vendas por Dia da Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer 
            config={{
              vendas: { label: 'Vendas (R$)', color: 'hsl(var(--chart-1))' }
            }} 
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="vendas" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer 
            config={{}} 
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deliveryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deliveryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer 
            config={{}} 
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
