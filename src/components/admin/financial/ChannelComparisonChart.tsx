import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import {
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { ChannelRevenue, MonthlyChannelData } from '@/hooks/useRevenueByChannel';

interface ChannelComparisonChartProps {
  channels: ChannelRevenue[];
  monthlyData: MonthlyChannelData[];
  isLoading?: boolean;
}

const CHANNEL_COLORS: Record<string, string> = {
  online: '#10b981',
  ifood: '#ea1d2c',
  totem: '#f97316',
  pdv: '#3b82f6',
  mesa: '#8b5cf6',
  agendamentos: '#f59e0b',
};

const CHANNEL_LABELS: Record<string, string> = {
  online: 'Pedidos Online',
  ifood: 'iFood',
  totem: 'Totem',
  pdv: 'PDV/Balcão',
  mesa: 'Mesa',
  agendamentos: 'Agendamentos',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);

export function ChannelComparisonChart({ channels, monthlyData, isLoading }: ChannelComparisonChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const pieData = channels
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .map(channel => ({
      name: channel.channel,
      value: channel.total,
      color: channel.color,
      percentage: channel.percentage,
    }));

  const totalRevenue = channels.reduce((sum, c) => sum + c.total, 0);
  const hasData = pieData.length > 0;

  // Determine active line keys (channels with data)
  const activeKeys = Object.keys(CHANNEL_COLORS).filter(key =>
    monthlyData.some(m => (m as any)[key] > 0)
  );

  return (
    <Card>
      <CardHeader className="pb-2 p-4">
        <CardTitle className="text-sm">Comparativo de Receitas</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Tabs defaultValue="distribution" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
            <TabsTrigger value="distribution" className="gap-2 text-xs">
              <PieChartIcon className="h-3.5 w-3.5" />
              Distribuição
            </TabsTrigger>
            <TabsTrigger value="evolution" className="gap-2 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              Evolução
            </TabsTrigger>
          </TabsList>

          <TabsContent value="distribution">
            {!hasData ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                Nenhuma receita registrada ainda
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-4">
                <div className="w-full lg:w-1/2 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 space-y-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{formatCurrency(item.value)}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="evolution">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={formatCurrency}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      CHANNEL_LABELS[name] || name,
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend formatter={(value) => CHANNEL_LABELS[value] || value} wrapperStyle={{ fontSize: '11px' }} />
                  {activeKeys.map((key) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={key}
                      stroke={CHANNEL_COLORS[key]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: CHANNEL_COLORS[key] }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
