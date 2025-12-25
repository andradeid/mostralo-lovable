import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Receipt, ShoppingCart, BarChart3, History, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from '@/components/admin/reports/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesHistoryTable } from './SalesHistoryTable';

interface OrdersAnalysisProps {
  dateRange: DateRange;
  storeId: string | null;
}

const statusColors: Record<string, string> = {
  entrada: '#3b82f6',
  em_preparo: '#f59e0b',
  pronto: '#10b981',
  saiu_entrega: '#8b5cf6',
  concluido: '#059669',
  cancelado: '#ef4444',
  open: '#3b82f6',
  closed: '#059669',
};

const statusLabels: Record<string, string> = {
  entrada: 'Entrada',
  em_preparo: 'Em Preparo',
  pronto: 'Pronto',
  saiu_entrega: 'Saiu p/ Entrega',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  open: 'Aberta',
  closed: 'Fechada',
};

export function OrdersAnalysis({ dateRange, storeId }: OrdersAnalysisProps) {
  const [statusData, setStatusData] = useState<any[]>([]);
  const [comandaStatusData, setComandaStatusData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentComandas, setRecentComandas] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (storeId) {
      fetchOrdersData();
    }
  }, [dateRange, storeId]);
  
  const fetchOrdersData = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      // Buscar orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });
      
      // Buscar comandas
      const { data: comandas } = await supabase
        .from('comandas')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });
      
      const ordersData = orders || [];
      const comandasData = comandas || [];
      
      // Agrupar orders por status
      const orderStatusCount = ordersData.reduce((acc, order) => {
        const status = order.status;
        if (!acc[status]) {
          acc[status] = { name: statusLabels[status] || status, value: 0, color: statusColors[status] || '#666' };
        }
        acc[status].value += 1;
        return acc;
      }, {} as Record<string, any>);
      
      // Agrupar comandas por status
      const comandaStatusCount = comandasData.reduce((acc, comanda) => {
        const status = comanda.status;
        if (!acc[status]) {
          acc[status] = { name: statusLabels[status] || status, value: 0, color: statusColors[status] || '#666' };
        }
        acc[status].value += 1;
        return acc;
      }, {} as Record<string, any>);
      
      // Dados por fonte (orders vs comandas)
      const completedOrders = ordersData.filter(o => o.status === 'concluido');
      const closedComandas = comandasData.filter(c => c.status === 'closed');
      
      const sourceStats = [
        { 
          name: 'Pedidos Online', 
          value: completedOrders.length, 
          revenue: completedOrders.reduce((sum, o) => sum + Number(o.total), 0),
          color: '#3b82f6'
        },
        { 
          name: 'Comandas PDV', 
          value: closedComandas.length, 
          revenue: closedComandas.reduce((sum, c) => sum + Number(c.total), 0),
          color: '#8b5cf6'
        }
      ];
      
      setStatusData(Object.values(orderStatusCount));
      setComandaStatusData(Object.values(comandaStatusCount));
      setSourceData(sourceStats);
      setRecentOrders(ordersData.slice(0, 10));
      setRecentComandas(comandasData.slice(0, 10));
    } catch (error) {
      console.error('Erro ao buscar dados de pedidos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const renderSummaryContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Últimos Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Instrução do Painel Analítico */}
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
          <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
            <strong>Painel Analítico:</strong> Visualize gráficos de status, origem 
            das vendas (Online vs PDV) e uma amostra dos últimos pedidos. Para consultar 
            <strong> todos os pedidos</strong> com filtros e detalhes completos, use a aba 
            <strong> "Histórico Completo"</strong>.
          </AlertDescription>
        </Alert>
        
        {/* Cards de Origem */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sourceData.map((source, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{source.name}</p>
                    <p className="text-2xl font-bold">{source.value} vendas</p>
                    <p className="text-sm text-green-600 font-medium">R$ {source.revenue.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-full" style={{ backgroundColor: `${source.color}20` }}>
                    {source.name.includes('Online') ? (
                      <ShoppingCart className="w-6 h-6" style={{ color: source.color }} />
                    ) : (
                      <Receipt className="w-6 h-6" style={{ color: source.color }} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Geral</p>
                  <p className="text-2xl font-bold">{sourceData.reduce((sum, s) => sum + s.value, 0)} vendas</p>
                  <p className="text-sm text-green-600 font-medium">
                    R$ {sourceData.reduce((sum, s) => sum + s.revenue, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Pedidos Online</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
              <CardTitle>Vendas por Origem</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer 
                config={{
                  revenue: { label: 'Receita (R$)', color: 'hsl(var(--chart-1))' }
                }} 
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Últimas Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="orders">
              <TabsList className="mb-4">
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Pedidos Online
                </TabsTrigger>
                <TabsTrigger value="comandas" className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Comandas PDV
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="orders">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.order_number}</TableCell>
                          <TableCell>{order.customer_name}</TableCell>
                          <TableCell>R$ {Number(order.total).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge style={{ backgroundColor: statusColors[order.status] }}>
                              {statusLabels[order.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="comandas">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentComandas.map((comanda) => (
                        <TableRow key={comanda.id}>
                          <TableCell className="font-medium">#{comanda.number}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {comanda.type === 'table' ? `Mesa ${comanda.table_number}` : 'Balcão'}
                            </Badge>
                          </TableCell>
                          <TableCell>{comanda.customer_name || '-'}</TableCell>
                          <TableCell>R$ {Number(comanda.total).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge style={{ backgroundColor: statusColors[comanda.status] }}>
                              {statusLabels[comanda.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(comanda.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  return (
    <Tabs defaultValue="summary" className="space-y-4">
      <TabsList>
        <TabsTrigger value="summary" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Resumo
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="w-4 h-4" />
          Histórico Completo
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="summary">
        {renderSummaryContent()}
      </TabsContent>
      
      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesHistoryTable dateRange={dateRange} storeId={storeId} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
