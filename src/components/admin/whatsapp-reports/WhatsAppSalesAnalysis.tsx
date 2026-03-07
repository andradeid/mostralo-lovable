import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
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

  return (
    <div className="space-y-4 mt-4">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Pedidos</p>
            <p className="text-2xl font-bold text-foreground">{data.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Faturamento</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Ticket Médio</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.ticketMedio)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Faturamento por dia */}
      {revenueChartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Faturamento por Dia</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="text-base">Pedidos por Status</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="text-base">Faturamento por Canal</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top produtos */}
      {data.topProducts && data.topProducts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Top Produtos Vendidos via WhatsApp</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-6">#{i + 1}</span>
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
