import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, CreditCard, Users, Percent, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from '@/components/admin/reports/types';
import { Skeleton } from '@/components/ui/skeleton';

interface SalesKPICardsProps {
  dateRange: DateRange;
}

interface KPIData {
  totalSales: number;
  totalOrders: number;
  avgTicket: number;
  conversionRate: number;
  newCustomers: number;
  repeatRate: number;
  trends: {
    sales: number;
    orders: number;
    ticket: number;
    conversion: number;
    newCustomers: number;
    repeat: number;
  };
}

export function SalesKPICards({ dateRange }: SalesKPICardsProps) {
  const [kpis, setKpis] = useState<KPIData>({
    totalSales: 0,
    totalOrders: 0,
    avgTicket: 0,
    conversionRate: 0,
    newCustomers: 0,
    repeatRate: 0,
    trends: { sales: 0, orders: 0, ticket: 0, conversion: 0, newCustomers: 0, repeat: 0 }
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchKPIs();
  }, [dateRange]);
  
  const fetchKPIs = async () => {
    setLoading(true);
    try {
      // Buscar orders no período atual
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());
      
      if (!orders) {
        setLoading(false);
        return;
      }
      
      const completed = orders.filter(o => o.status === 'concluido');
      const totalSales = completed.reduce((sum, o) => sum + Number(o.total), 0);
      const totalOrders = orders.filter(o => o.status !== 'cancelado').length;
      const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
      const conversionRate = orders.length > 0 ? (completed.length / orders.length) * 100 : 0;
      
      // Contar clientes únicos no período
      const uniqueCustomers = new Set(orders.map(o => o.customer_id).filter(Boolean));
      const newCustomers = uniqueCustomers.size;
      
      // Calcular taxa de recompra (clientes com mais de 1 pedido)
      const customerOrderCount = orders.reduce((acc, order) => {
        if (order.customer_id) {
          acc[order.customer_id] = (acc[order.customer_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const repeatCustomers = Object.values(customerOrderCount).filter(count => count > 1).length;
      const repeatRate = uniqueCustomers.size > 0 ? (repeatCustomers / uniqueCustomers.size) * 100 : 0;
      
      // Calcular período anterior para comparação
      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const previousFrom = new Date(dateRange.from);
      previousFrom.setDate(previousFrom.getDate() - daysDiff);
      
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', previousFrom.toISOString())
        .lt('created_at', dateRange.from.toISOString());
      
      let trends = { sales: 0, orders: 0, ticket: 0, conversion: 0, newCustomers: 0, repeat: 0 };
      
      if (previousOrders && previousOrders.length > 0) {
        const prevCompleted = previousOrders.filter(o => o.status === 'concluido');
        const prevTotalSales = prevCompleted.reduce((sum, o) => sum + Number(o.total), 0);
        const prevTotalOrders = previousOrders.filter(o => o.status !== 'cancelado').length;
        const prevAvgTicket = prevTotalOrders > 0 ? prevTotalSales / prevTotalOrders : 0;
        const prevConversionRate = previousOrders.length > 0 ? (prevCompleted.length / previousOrders.length) * 100 : 0;
        
        trends.sales = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
        trends.orders = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0;
        trends.ticket = prevAvgTicket > 0 ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100 : 0;
        trends.conversion = prevConversionRate > 0 ? conversionRate - prevConversionRate : 0;
      }
      
      setKpis({
        totalSales,
        totalOrders,
        avgTicket,
        conversionRate,
        newCustomers,
        repeatRate,
        trends
      });
    } catch (error) {
      console.error('Erro ao buscar KPIs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const kpiCards = [
    { 
      title: 'Total de Vendas', 
      value: `R$ ${kpis.totalSales.toFixed(2)}`, 
      icon: DollarSign, 
      trend: kpis.trends.sales,
      color: 'text-green-600'
    },
    { 
      title: 'Pedidos', 
      value: kpis.totalOrders, 
      icon: ShoppingCart, 
      trend: kpis.trends.orders,
      color: 'text-blue-600'
    },
    { 
      title: 'Ticket Médio', 
      value: `R$ ${kpis.avgTicket.toFixed(2)}`, 
      icon: CreditCard, 
      trend: kpis.trends.ticket,
      color: 'text-purple-600'
    },
    { 
      title: 'Taxa de Conversão', 
      value: `${kpis.conversionRate.toFixed(1)}%`, 
      icon: Percent, 
      trend: kpis.trends.conversion,
      color: 'text-orange-600'
    },
    { 
      title: 'Novos Clientes', 
      value: kpis.newCustomers, 
      icon: Users, 
      trend: kpis.trends.newCustomers,
      color: 'text-cyan-600'
    },
    { 
      title: 'Taxa de Recompra', 
      value: `${kpis.repeatRate.toFixed(1)}%`, 
      icon: RotateCcw, 
      trend: kpis.trends.repeat,
      color: 'text-pink-600'
    }
  ];
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpiCards.map((kpi, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className={`text-xs flex items-center mt-1 ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpi.trend >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {kpi.trend >= 0 ? '+' : ''}{kpi.trend.toFixed(1)}% vs período anterior
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
