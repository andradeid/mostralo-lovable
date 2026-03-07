import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

interface Props {
  storeId: string | null;
  dateFrom: string;
  dateTo: string;
}

interface EfficiencyData {
  autonomyByHour: { hour: string; total: number; paused: number; autonomous: number; rate: number }[];
  slaData: {
    bot: { under30s: number; under1m: number; under5m: number; over5m: number };
    human: { under30s: number; under1m: number; under5m: number; over5m: number };
  };
  conversion: { totalConversations: number; ordersCreated: number; conversionRate: number };
  statusDistribution: Record<string, number>;
}

const COLORS = ['hsl(var(--primary))', '#f59e0b', '#ef4444', '#8b5cf6'];

export function EfficiencyAnalysis({ storeId, dateFrom, dateTo }: Props) {
  const [data, setData] = useState<EfficiencyData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    fetchData();
  }, [storeId, dateFrom, dateTo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('whatsapp-reports-efficiency', {
        body: { store_id: storeId, date_from: `${dateFrom}T00:00:00`, date_to: `${dateTo}T23:59:59` },
      });
      if (error) throw error;
      setData(result);
    } catch (err) {
      console.error('Erro ao buscar dados de eficiência:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!data) return null;

  // Filtrar horas com dados
  const autonomyData = data.autonomyByHour.filter(h => h.total > 0);

  const slaChartData = [
    { faixa: '< 30s', IA: data.slaData.bot.under30s, Humano: data.slaData.human.under30s },
    { faixa: '< 1min', IA: data.slaData.bot.under1m, Humano: data.slaData.human.under1m },
    { faixa: '< 5min', IA: data.slaData.bot.under5m, Humano: data.slaData.human.under5m },
    { faixa: '> 5min', IA: data.slaData.bot.over5m, Humano: data.slaData.human.over5m },
  ];

  const statusData = Object.entries(data.statusDistribution || {}).map(([status, count]) => ({
    name: status === 'active' ? 'Ativas' : status === 'closed' ? 'Fechadas' : status,
    value: count,
  }));

  return (
    <div className="space-y-4 mt-4">
      {/* Cards de conversão */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Conversas</p>
            <p className="text-2xl font-bold text-foreground">{data.conversion.totalConversations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Pedidos Criados</p>
            <p className="text-2xl font-bold text-foreground">{data.conversion.ordersCreated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
            <p className="text-2xl font-bold text-foreground">{data.conversion.conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Autonomia por horário */}
      {autonomyData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Taxa de Autonomia da IA por Horário</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={autonomyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip />
                <Legend />
                <Bar dataKey="autonomous" name="Autônomo (IA)" fill="hsl(var(--primary))" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="paused" name="Pausa Humana" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SLA */}
        <Card>
          <CardHeader><CardTitle className="text-base">SLA de Resposta: IA vs Humano</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={slaChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="faixa" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip />
                <Legend />
                <Bar dataKey="IA" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Humano" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status das conversas */}
        {statusData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Conversas por Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {statusData.map((_, i) => (
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
      </div>
    </div>
  );
}
