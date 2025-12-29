import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChannelRevenue, MonthlyChannelData } from '@/hooks/useRevenueByChannel';

interface ChannelComparisonChartProps {
  channels: ChannelRevenue[];
  monthlyData: MonthlyChannelData[];
  isLoading?: boolean;
}

const CHANNEL_COLORS = {
  online: '#10b981',
  totem: '#f97316',
  pdv: '#3b82f6',
  mesa: '#8b5cf6',
  agendamentos: '#f59e0b',
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function ChannelComparisonChart({ channels, monthlyData, isLoading }: ChannelComparisonChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const pieData = channels
    .filter(c => c.total > 0)
    .map(channel => ({
      name: channel.channel,
      value: channel.total,
      color: channel.color,
    }));

  const hasData = channels.some(c => c.total > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-lg">Comparativo de Receitas</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="distribution" className="gap-2 text-xs md:text-sm">
              <PieChartIcon className="h-4 w-4" />
              Distribuição
            </TabsTrigger>
            <TabsTrigger value="evolution" className="gap-2 text-xs md:text-sm">
              <BarChart3 className="h-4 w-4" />
              Evolução
            </TabsTrigger>
          </TabsList>

          <TabsContent value="distribution">
            {!hasData ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma receita registrada ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="evolution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      online: 'Pedidos Online',
                      totem: 'Totem',
                      pdv: 'PDV/Balcão',
                      mesa: 'Mesa',
                      agendamentos: 'Agendamentos',
                    };
                    return labels[value] || value;
                  }}
                />
                <Bar dataKey="online" name="online" fill={CHANNEL_COLORS.online} radius={[4, 4, 0, 0]} />
                <Bar dataKey="totem" name="totem" fill={CHANNEL_COLORS.totem} radius={[4, 4, 0, 0]} />
                <Bar dataKey="pdv" name="pdv" fill={CHANNEL_COLORS.pdv} radius={[4, 4, 0, 0]} />
                <Bar dataKey="mesa" name="mesa" fill={CHANNEL_COLORS.mesa} radius={[4, 4, 0, 0]} />
                <Bar dataKey="agendamentos" name="agendamentos" fill={CHANNEL_COLORS.agendamentos} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
