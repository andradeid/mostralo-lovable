import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from "recharts";
import { 
  BarChart3, TrendingUp, MessageSquare, CheckCircle2, XCircle, 
  Clock, DollarSign, Package, Loader2 
} from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface SentinelaAnalyticsProps {
  storeId: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function SentinelaAnalytics({ storeId }: SentinelaAnalyticsProps) {
  const [period, setPeriod] = useState('30');

  // Buscar estatísticas gerais incluindo ROI
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['sentinela-analytics-stats', storeId, period],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(period)).toISOString();
      
      const { data, error } = await supabase
        .from('sentinela_reminders')
        .select('status, converted_at, converted_order_value')
        .eq('store_id', storeId)
        .gte('created_at', startDate);
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const sent = data?.filter(r => r.status === 'sent').length || 0;
      const failed = data?.filter(r => r.status === 'failed').length || 0;
      const converted = data?.filter(r => r.status === 'converted' || r.converted_at).length || 0;
      const pending = data?.filter(r => r.status === 'pending').length || 0;
      
      // Calcular receita gerada
      const receitaTotal = data?.reduce((acc, r) => {
        if ((r.status === 'converted' || r.converted_at) && r.converted_order_value) {
          return acc + Number(r.converted_order_value);
        }
        return acc;
      }, 0) || 0;
      
      const ticketMedio = converted > 0 ? receitaTotal / converted : 0;
      
      return {
        total,
        sent,
        failed,
        converted,
        pending,
        receitaTotal,
        ticketMedio,
        successRate: total > 0 ? Math.round(((sent + converted) / (sent + converted + failed)) * 100) || 0 : 0,
        conversionRate: sent > 0 ? Math.round((converted / sent) * 100) || 0 : 0
      };
    },
    enabled: !!storeId
  });

  // Buscar mensagens por período
  const { data: messagesByPeriod, isLoading: loadingMessages } = useQuery({
    queryKey: ['sentinela-analytics-messages', storeId, period],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(period)).toISOString();
      
      const { data, error } = await supabase
        .from('sentinela_reminders')
        .select('status, sent_at, converted_at, created_at')
        .eq('store_id', storeId)
        .gte('created_at', startDate)
        .order('created_at');
      
      if (error) throw error;
      
      // Agrupar por data
      const byDate: Record<string, { sent: number; failed: number; converted: number }> = {};
      
      data?.forEach(reminder => {
        const date = reminder.sent_at 
          ? format(parseISO(reminder.sent_at), 'dd/MM')
          : format(parseISO(reminder.created_at), 'dd/MM');
        
        if (!byDate[date]) {
          byDate[date] = { sent: 0, failed: 0, converted: 0 };
        }
        
        if (reminder.status === 'sent') byDate[date].sent++;
        if (reminder.status === 'failed') byDate[date].failed++;
        if (reminder.status === 'converted' || reminder.converted_at) byDate[date].converted++;
      });
      
      return Object.entries(byDate).map(([date, values]) => ({
        date,
        ...values
      }));
    },
    enabled: !!storeId
  });

  // Buscar distribuição de status
  const { data: statusDistribution, isLoading: loadingStatus } = useQuery({
    queryKey: ['sentinela-analytics-status', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sentinela_reminders')
        .select('status')
        .eq('store_id', storeId);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(r => {
        counts[r.status] = (counts[r.status] || 0) + 1;
      });
      
      const labels: Record<string, string> = {
        pending: 'Pendentes',
        sent: 'Enviados',
        converted: 'Convertidos',
        failed: 'Falhas',
        cancelled: 'Cancelados'
      };
      
      return Object.entries(counts).map(([status, value]) => ({
        name: labels[status] || status,
        value,
        status
      }));
    },
    enabled: !!storeId
  });

  // Buscar top produtos por conversão
  const { data: topProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ['sentinela-analytics-products', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sentinela_reminders')
        .select('product_id, status, converted_at, product:products(name)')
        .eq('store_id', storeId)
        .not('product_id', 'is', null);
      
      if (error) throw error;
      
      // Agrupar por produto
      const byProduct: Record<string, { name: string; total: number; converted: number }> = {};
      
      data?.forEach(reminder => {
        if (!reminder.product_id) return;
        const productName = (reminder.product as any)?.name || 'Produto Desconhecido';
        
        if (!byProduct[reminder.product_id]) {
          byProduct[reminder.product_id] = { name: productName, total: 0, converted: 0 };
        }
        
        byProduct[reminder.product_id].total++;
        if (reminder.status === 'converted' || reminder.converted_at) {
          byProduct[reminder.product_id].converted++;
        }
      });
      
      return Object.values(byProduct)
        .map(p => ({
          ...p,
          rate: p.total > 0 ? Math.round((p.converted / p.total) * 100) : 0
        }))
        .sort((a, b) => b.converted - a.converted)
        .slice(0, 5);
    },
    enabled: !!storeId
  });

  // Buscar logs de execução
  const { data: executionLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ['sentinela-analytics-logs', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sentinela_logs')
        .select('*')
        .eq('store_id', storeId)
        .order('executed_at', { ascending: false })
        .limit(20);
      
      if (error) {
        // Se a tabela não existir, retorna array vazio
        if (error.code === '42P01') return [];
        throw error;
      }
      
      return data || [];
    },
    enabled: !!storeId
  });

  const isLoading = loadingStats || loadingMessages || loadingStatus || loadingProducts;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="15">Últimos 15 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="60">Últimos 60 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total de Lembretes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.successRate || 0}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.conversionRate || 0}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Novos cards de ROI */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  R$ {(stats?.receitaTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground">Receita Gerada</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  R$ {(stats?.ticketMedio || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de área - Mensagens por período */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Mensagens por Período
            </CardTitle>
            <CardDescription>
              Evolução de envios, falhas e conversões
            </CardDescription>
          </CardHeader>
          <CardContent>
            {messagesByPeriod && messagesByPeriod.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={messagesByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sent" 
                    name="Enviados"
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="converted" 
                    name="Convertidos"
                    stackId="1"
                    stroke="hsl(142, 76%, 36%)" 
                    fill="hsl(142, 76%, 36%)"
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="failed" 
                    name="Falhas"
                    stackId="1"
                    stroke="hsl(0, 84%, 60%)" 
                    fill="hsl(0, 84%, 60%)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
                <p>Sem dados para o período selecionado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de pizza - Distribuição de status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Status</CardTitle>
            <CardDescription>
              Status atual de todos os lembretes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution && statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.status === 'sent' ? 'hsl(var(--primary))' :
                          entry.status === 'converted' ? 'hsl(142, 76%, 36%)' :
                          entry.status === 'failed' ? 'hsl(0, 84%, 60%)' :
                          entry.status === 'pending' ? 'hsl(45, 93%, 47%)' :
                          'hsl(var(--muted-foreground))'
                        }
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <TrendingUp className="w-12 h-12 mb-2 opacity-50" />
                <p>Nenhum lembrete registrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top produtos por conversão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            Top 5 Produtos por Conversão
          </CardTitle>
          <CardDescription>
            Produtos com maior número de recompras
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topProducts && topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={150} 
                  className="text-xs"
                  tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name) => [
                    value, 
                    name === 'converted' ? 'Conversões' : 
                    name === 'total' ? 'Total Lembretes' : name
                  ]}
                />
                <Bar dataKey="converted" name="Conversões" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
              <Package className="w-12 h-12 mb-2 opacity-50" />
              <p>Nenhuma conversão registrada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de execuções */}
      {executionLogs && executionLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Execuções</CardTitle>
            <CardDescription>
              Últimas execuções do sistema SENTINELA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executionLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(parseISO(log.executed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.action === 'check' ? 'Verificação' : 'Envio'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.result_message || `${log.reminders_processed || 0} processado(s)`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.trigger_type === 'manual' ? 'default' : 'secondary'}>
                        {log.trigger_type === 'manual' ? 'Manual' : 'Automático'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
