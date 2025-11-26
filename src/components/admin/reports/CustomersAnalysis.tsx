import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from '@/components/admin/reports/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, UserPlus, UserX, Crown } from 'lucide-react';

interface CustomersAnalysisProps {
  dateRange: DateRange;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function CustomersAnalysis({ dateRange }: CustomersAnalysisProps) {
  const [kpis, setKpis] = useState({
    total: 0,
    active: 0,
    new: 0,
    inactive: 0
  });
  const [segmentation, setSegmentation] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCustomersData();
  }, [dateRange]);
  
  const fetchCustomersData = async () => {
    setLoading(true);
    try {
      // Buscar todos os clientes
      const { data: customers } = await supabase
        .from('customers')
        .select('*');
      
      // Buscar pedidos no período
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .eq('status', 'concluido');
      
      if (!customers || !orders) {
        setLoading(false);
        return;
      }
      
      // Calcular KPIs
      const activeCustomerIds = new Set(orders.map(o => o.customer_id));
      const newCustomers = orders.filter(o => {
        const customer = customers.find(c => c.id === o.customer_id);
        return customer && new Date(customer.created_at) >= dateRange.from;
      }).length;
      
      setKpis({
        total: customers.length,
        active: activeCustomerIds.size,
        new: newCustomers,
        inactive: customers.length - activeCustomerIds.size
      });
      
      // Segmentação por número de pedidos
      const customerOrderCount = orders.reduce((acc, order) => {
        if (order.customer_id) {
          acc[order.customer_id] = (acc[order.customer_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const segments = {
        novos: 0,
        recorrentes: 0,
        vips: 0,
        inativos: customers.length - activeCustomerIds.size
      };
      
      Object.values(customerOrderCount).forEach(count => {
        if (count === 1) segments.novos++;
        else if (count <= 5) segments.recorrentes++;
        else segments.vips++;
      });
      
      setSegmentation([
        { name: 'Novos (1 pedido)', value: segments.novos },
        { name: 'Recorrentes (2-5)', value: segments.recorrentes },
        { name: 'VIPs (6+)', value: segments.vips },
        { name: 'Inativos', value: segments.inativos }
      ]);
      
      // Top clientes
      const customerStats = Object.entries(customerOrderCount).map(([customerId, orderCount]) => {
        const customer = customers.find(c => c.id === customerId);
        const customerOrders = orders.filter(o => o.customer_id === customerId);
        const totalSpent = customerOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const lastOrder = customerOrders.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        return {
          name: customer?.name || 'Cliente',
          phone: customer?.phone || '',
          totalOrders: orderCount,
          totalSpent,
          lastOrderAt: lastOrder?.created_at
        };
      });
      
      const sorted = customerStats
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);
      
      setTopCustomers(sorted);
    } catch (error) {
      console.error('Erro ao buscar dados de clientes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <UserCheck className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpis.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Compraram no período
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <UserPlus className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{kpis.new}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Primeira compra no período
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Inativos</CardTitle>
            <UserX className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kpis.inactive}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sem compras no período
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Segmentação de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer 
            config={{}} 
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {segmentation.map((entry, index) => (
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
          <CardTitle>Top 10 Clientes (Maiores Compradores)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Total Pedidos</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Última Compra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((customer, index) => (
                  <TableRow key={customer.phone}>
                    <TableCell className="font-medium">
                      {index < 3 && <Crown className="inline w-4 h-4 text-yellow-500 mr-1" />}
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{customer.totalOrders}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      R$ {customer.totalSpent.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {customer.lastOrderAt && format(new Date(customer.lastOrderAt), "dd/MM/yyyy", { locale: ptBR })}
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
