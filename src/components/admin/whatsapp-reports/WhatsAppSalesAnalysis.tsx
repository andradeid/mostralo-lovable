import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Receipt, Target } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  storeId: string | null;
  dateFrom: string;
  dateTo: string;
}

interface SalesData {
  totalOrders: number;
  totalRevenue: number;
  ticketMedio: number;
  revenueByDay: Record<string, number>;
  ordersByStatus: Record<string, number>;
  topProducts: { name: string; quantity: number; revenue: number }[];
  channelComparison: Record<string, number>;
}

const COLORS = ['hsl(var(--primary))', '#94a3b8', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const STATUS_LABELS: Record<string, string> = {
  entrada: 'Entrada', preparo: 'Preparo', pronto: 'Pronto',
  entregando: 'Entregando', entregue: 'Entregue', cancelado: 'Cancelado',
};

export function WhatsAppSalesAnalysis({ storeId, dateFrom, dateTo }: Props) {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    fetchData();
  }, [storeId, dateFrom, dateTo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('whatsapp-reports-sales', {
        body: { store_id: storeId, date_from: `${dateFrom}T00:00:00`, date_to: `${dateTo}T23:59:59` },
      });
      if (error) throw error;
      setData(result);
    } catch (err) {
      console.error('Erro ao buscar dados de vendas:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!data) return null;

  const revenueChartData = Object.entries(data.revenueByDay || {}).map(([date, value]) => ({
    date: date.split('-').slice(1).join('/'),
    valor: value,
  }));

  const statusChartData = Object.entries(data.ordersByStatus || {}).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
  }));

  const channelData = Object.entries(data.channelComparison || {})
    .filter(([, v]) => v > 0)
    .map(([channel, value]) => ({
      name: channel === 'whatsapp' ? 'WhatsApp Chat' : channel === 'manual' ? 'Manual' : channel === 'whatsapp_bot' ? 'Bot' : channel,
      valor: value,
    }));

  const summaryCards = [
    {
      title: 'Total Pedidos',
      value: data.totalOrders,
      icon: Receipt,
      tooltip: 'Quantidade total de pedidos criados via WhatsApp no período. Inclui todos os status (entrada, preparo, entregue, cancelado).',
    },
    {
      title: 'Faturamento',
      value: formatCurrency(data.totalRevenue),
      icon: TrendingUp,
      tooltip: 'Receita bruta total dos pedidos criados pelo WhatsApp. Soma de todos os pedidos independente do status.',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(data.ticketMedio),
      icon: Target,
      tooltip: 'Valor médio por pedido. Fórmula: Faturamento Total ÷ Número de Pedidos. Use para entender o perfil de compra dos clientes via WhatsApp.',
    },
  ];

  return (
    <div className="space-y-4 mt-4">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
                  <card.icon className="h-4 w-4 text-primary" />
                </div>
                <InfoTooltip text={card.tooltip} />
              </div>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Faturamento por dia */}
      {revenueChartData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Faturamento por Dia</CardTitle>
              <InfoTooltip text="Evolução diária do faturamento gerado por pedidos do WhatsApp. Acompanhe tendências e identifique os dias com melhor desempenho de vendas." />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pedidos por status */}
        {statusChartData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Pedidos por Status</CardTitle>
                <InfoTooltip text="Distribuição dos pedidos do WhatsApp por status atual. Ajuda a identificar gargalos na operação (ex: muitos pedidos parados em 'Preparo')." />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {statusChartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Comparativo de canais */}
        {channelData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Faturamento por Canal</CardTitle>
                <InfoTooltip text="Comparação de faturamento entre os canais de venda. 'WhatsApp Chat' são pedidos criados pelo atendimento no chat. 'Manual' são pedidos registrados pelo painel administrativo." />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={channelData}>
                  <defs>
                    <linearGradient id="gradientChannel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="valor" fill="url(#gradientChannel)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top produtos */}
      {data.topProducts && data.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Top Produtos Vendidos via WhatsApp</CardTitle>
              <InfoTooltip text="Ranking dos produtos mais vendidos através do canal WhatsApp. Use para entender quais itens têm maior demanda neste canal e otimizar o cardápio/estoque." />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-primary w-6">#{i + 1}</span>
                    <span className="text-sm font-medium text-foreground">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{product.quantity}x</span>
                    <span className="font-semibold text-foreground">{formatCurrency(product.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
