import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bot, DollarSign, Zap, Image, MessageSquare, TrendingUp, Clock } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UsageSummary {
  total_tokens: number;
  total_cost_usd: number;
  total_cost_brl: number;
  text_tokens: number;
  image_tokens: number;
  text_cost_usd: number;
  image_cost_usd: number;
  text_count: number;
  image_count: number;
  average_tokens_per_interaction: number;
}

interface StoreUsage {
  store_id: string;
  store_name: string;
  store_slug: string | null;
  total_tokens: number;
  cost_usd: number;
  interactions: number;
  text_count: number;
  image_count: number;
}

interface DailyUsage {
  date: string;
  tokens: number;
  cost: number;
  count: number;
}

interface UsageReport {
  summary: UsageSummary;
  by_store: StoreUsage[];
  daily_chart: DailyUsage[];
  period_days: string;
  total_records: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export default function OpenAIUsagePage() {
  const [period, setPeriod] = useState('30');
  
  const { data: report, isLoading, error } = useQuery<UsageReport>({
    queryKey: ['openai-usage', period],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Não autenticado');

      const response = await supabase.functions.invoke('openai-usage-report', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { period }
      });

      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    refetchInterval: 60000 // Atualizar a cada minuto
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">Erro ao carregar dados: {(error as Error).message}</p>
      </div>
    );
  }

  const summary = report?.summary;
  const pieData = [
    { name: 'Texto', value: summary?.text_cost_usd || 0 },
    { name: 'Imagem (Vision)', value: summary?.image_cost_usd || 0 }
  ].filter(d => d.value > 0);

  // Verificar se há dados do dia atual
  const today = new Date().toISOString().split('T')[0];
  const hasTodayData = report?.daily_chart?.some(d => d.date === today);

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custos OpenAI</h2>
          <p className="text-muted-foreground">Monitoramento de uso das APIs de IA por loja</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="60">Últimos 60 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Aviso de dados em andamento */}
      {hasTodayData && (
        <Alert className="bg-muted/50 border-muted-foreground/20">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Os dados incluem o consumo de <strong>hoje</strong>, que ainda está em andamento e pode aumentar ao longo do dia.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total (USD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.total_cost_usd?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              ≈ R$ {summary?.total_cost_brl?.toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary?.total_tokens || 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: {summary?.average_tokens_per_interaction || 0}/interação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interações Texto</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.text_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${summary?.text_cost_usd?.toFixed(2) || '0.00'} ({summary?.text_tokens?.toLocaleString('pt-BR') || 0} tokens)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interações Imagem</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.image_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${summary?.image_cost_usd?.toFixed(2) || '0.00'} ({summary?.image_tokens?.toLocaleString('pt-BR') || 0} tokens)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Gráfico de Consumo Diário */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Consumo Diário
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report?.daily_chart && report.daily_chart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={report.daily_chart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value: string) => {
                      const [year, month, day] = value.split('-');
                      return `${parseInt(day)}/${parseInt(month)}`;
                    }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{ fontSize: 12 }} 
                    tickFormatter={(value: number) => value.toLocaleString('pt-BR')}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'Custo ($)') return [`$${value.toFixed(4)}`, 'Custo'];
                      if (name === 'Tokens') return [value.toLocaleString('pt-BR'), 'Tokens'];
                      if (name === 'Interações') return [value, 'Interações'];
                      return [value, name];
                    }}
                    labelFormatter={(label: string) => {
                      const [year, month, day] = label.split('-');
                      return `${day}/${month}/${year}`;
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="tokens" 
                    fill="hsl(var(--primary))" 
                    name="Tokens" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Interações"
                    dot={{ fill: 'hsl(var(--chart-2))' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado disponível no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(4)}`, 'Custo']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Ranking por Loja */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Consumo por Loja</CardTitle>
        </CardHeader>
        <CardContent>
          {report?.by_store && report.by_store.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-right">Interações</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Texto</TableHead>
                  <TableHead className="text-right">Imagem</TableHead>
                  <TableHead className="text-right">Custo USD</TableHead>
                  <TableHead className="text-right">Custo BRL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.by_store.map((store, index) => (
                  <TableRow key={store.store_id}>
                    <TableCell>
                      {index < 3 ? (
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          {index + 1}º
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{store.store_name}</p>
                        {store.store_slug && (
                          <p className="text-xs text-muted-foreground">{store.store_slug}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{store.interactions}</TableCell>
                    <TableCell className="text-right">{store.total_tokens.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right">{store.text_count}</TableCell>
                    <TableCell className="text-right">{store.image_count}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${store.cost_usd.toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-muted-foreground">
                      R$ {(store.cost_usd * 5.80).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma loja utilizou a API no período selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer com Total de Registros */}
      <div className="text-sm text-muted-foreground text-center">
        Total de {report?.total_records || 0} registros no período de {report?.period_days || 30} dias
      </div>
    </div>
  );
}
