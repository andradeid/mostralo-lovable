import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, CreditCard, Users, Percent, RotateCcw, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from '@/components/admin/reports/types';
import { Skeleton } from '@/components/ui/skeleton';

interface SalesKPICardsProps {
  dateRange: DateRange;
  storeId: string | null;
}

interface KPIData {
  totalSales: number;
  totalOrders: number;
  totalComandas: number;
  avgTicket: number;
  conversionRate: number;
  newCustomers: number;
  repeatRate: number;
  serviceFee: number;
  trends: {
    sales: number;
    orders: number;
    ticket: number;
    conversion: number;
    newCustomers: number;
    repeat: number;
    comandas: number;
  };
}

export function SalesKPICards({ dateRange, storeId }: SalesKPICardsProps) {
  const [kpis, setKpis] = useState<KPIData>({
    totalSales: 0,
    totalOrders: 0,
    totalComandas: 0,
    avgTicket: 0,
    conversionRate: 0,
    newCustomers: 0,
    repeatRate: 0,
    serviceFee: 0,
    trends: { sales: 0, orders: 0, ticket: 0, conversion: 0, newCustomers: 0, repeat: 0, comandas: 0 }
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (storeId) {
      fetchKPIs();
    }
  }, [dateRange, storeId]);
  
  const fetchKPIs = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      // Buscar orders no período atual
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());
      
      // Buscar comandas fechadas no período atual
      const { data: comandas } = await supabase
        .from('comandas')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'closed')
        .gte('closed_at', dateRange.from.toISOString())
        .lte('closed_at', dateRange.to.toISOString());
      
      const ordersData = orders || [];
      const comandasData = comandas || [];
      
      // Calcular métricas de orders
      const completedOrders = ordersData.filter(o => o.status === 'concluido');
      const ordersSales = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const ordersCount = ordersData.filter(o => o.status !== 'cancelado').length;
      
      // Calcular métricas de comandas
      const comandasSales = comandasData.reduce((sum, c) => sum + Number(c.total), 0);
      const comandasCount = comandasData.length;
      const serviceFee = comandasData.reduce((sum, c) => sum + Number(c.service_fee || 0), 0);
      
      // Totais combinados
      const totalSales = ordersSales + comandasSales;
      const totalOrders = ordersCount + comandasCount;
      const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
      const conversionRate = ordersData.length > 0 ? (completedOrders.length / ordersData.length) * 100 : 0;
      
      // Clientes únicos (apenas de orders)
      const uniqueCustomers = new Set(ordersData.map(o => o.customer_id).filter(Boolean));
      const newCustomers = uniqueCustomers.size;
      
      // Taxa de recompra
      const customerOrderCount = ordersData.reduce((acc, order) => {
        if (order.customer_id) {
          acc[order.customer_id] = (acc[order.customer_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const repeatCustomers = Object.values(customerOrderCount).filter(count => count > 1).length;
      const repeatRate = uniqueCustomers.size > 0 ? (repeatCustomers / uniqueCustomers.size) * 100 : 0;
      
      // Período anterior para comparação
      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const previousFrom = new Date(dateRange.from);
      previousFrom.setDate(previousFrom.getDate() - daysDiff);
      
      // Orders do período anterior
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', previousFrom.toISOString())
        .lt('created_at', dateRange.from.toISOString());
      
      // Comandas do período anterior
      const { data: previousComandas } = await supabase
        .from('comandas')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'closed')
        .gte('closed_at', previousFrom.toISOString())
        .lt('closed_at', dateRange.from.toISOString());
      
      let trends = { sales: 0, orders: 0, ticket: 0, conversion: 0, newCustomers: 0, repeat: 0, comandas: 0 };
      
      const prevOrdersData = previousOrders || [];
      const prevComandasData = previousComandas || [];
      
      if (prevOrdersData.length > 0 || prevComandasData.length > 0) {
        const prevCompleted = prevOrdersData.filter(o => o.status === 'concluido');
        const prevOrdersSales = prevCompleted.reduce((sum, o) => sum + Number(o.total), 0);
        const prevComandasSales = prevComandasData.reduce((sum, c) => sum + Number(c.total), 0);
        const prevTotalSales = prevOrdersSales + prevComandasSales;
        
        const prevOrdersCount = prevOrdersData.filter(o => o.status !== 'cancelado').length;
        const prevTotalOrders = prevOrdersCount + prevComandasData.length;
        const prevAvgTicket = prevTotalOrders > 0 ? prevTotalSales / prevTotalOrders : 0;
        const prevConversionRate = prevOrdersData.length > 0 ? (prevCompleted.length / prevOrdersData.length) * 100 : 0;
        
        trends.sales = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
        trends.orders = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0;
        trends.ticket = prevAvgTicket > 0 ? ((avgTicket - prevAvgTicket) / prevAvgTicket) * 100 : 0;
        trends.conversion = prevConversionRate > 0 ? conversionRate - prevConversionRate : 0;
        trends.comandas = prevComandasData.length > 0 ? ((comandasCount - prevComandasData.length) / prevComandasData.length) * 100 : 0;
      }
      
      setKpis({
        totalSales,
        totalOrders,
        totalComandas: comandasCount,
        avgTicket,
        conversionRate,
        newCustomers,
        repeatRate,
        serviceFee,
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
      color: 'text-green-600',
      subtitle: 'Pedidos + Comandas'
    },
    { 
      title: 'Pedidos Online', 
      value: kpis.totalOrders - kpis.totalComandas, 
      icon: ShoppingCart, 
      trend: kpis.trends.orders,
      color: 'text-blue-600',
      subtitle: 'Delivery/Retirada'
    },
    { 
      title: 'Comandas PDV', 
      value: kpis.totalComandas, 
      icon: Receipt, 
      trend: kpis.trends.comandas,
      color: 'text-purple-600',
      subtitle: `Taxa: R$ ${kpis.serviceFee.toFixed(2)}`
    },
    { 
      title: 'Ticket Médio', 
      value: `R$ ${kpis.avgTicket.toFixed(2)}`, 
      icon: CreditCard, 
      trend: kpis.trends.ticket,
      color: 'text-orange-600',
      subtitle: 'Média por venda'
    },
    { 
      title: 'Novos Clientes', 
      value: kpis.newCustomers, 
      icon: Users, 
      trend: kpis.trends.newCustomers,
      color: 'text-cyan-600',
      subtitle: 'Clientes únicos'
    },
    { 
      title: 'Taxa de Recompra', 
      value: `${kpis.repeatRate.toFixed(1)}%`, 
      icon: RotateCcw, 
      trend: kpis.trends.repeat,
      color: 'text-pink-600',
      subtitle: 'Clientes recorrentes'
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
            <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
            <p className={`text-xs flex items-center mt-1 ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpi.trend >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {kpi.trend >= 0 ? '+' : ''}{kpi.trend.toFixed(1)}% vs anterior
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
