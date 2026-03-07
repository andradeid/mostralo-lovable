import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trophy, Clock, ShoppingCart, MessageSquare, Users, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  storeId: string | null;
  dateFrom: string;
  dateTo: string;
}

interface AttendantData {
  name: string;
  totalMessages: number;
  totalConversations: number;
  avgResponseTimeSec: number;
  ordersCount: number;
  revenue: number;
  conversionRate: number;
  responseSamples: number;
}

// Formatar segundos em texto legível
function formatTime(seconds: number): string {
  if (seconds === 0) return '--';
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

// Medalha por posição
function getMedal(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}º`;
}

export function AttendantRanking({ storeId, dateFrom, dateTo }: Props) {
  const [data, setData] = useState<AttendantData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const response = await fetch(
          `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/whatsapp-reports-attendants`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ store_id: storeId, date_from: dateFrom, date_to: dateTo }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          setData(result.ranking || []);
        }
      } catch (err) {
        console.error('Erro ao buscar ranking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">
            Nenhum atendente encontrado no período selecionado.
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Os dados aparecem quando atendentes respondem manualmente via chat.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Dados para gráfico de barras comparativo
  const chartData = data.slice(0, 8).map(a => ({
    name: a.name.split(' ')[0], // Primeiro nome apenas
    'Mensagens': a.totalMessages,
    'Conversas': a.totalConversations,
    'Pedidos': a.ordersCount,
  }));

  // Dados para gráfico de tempo de resposta
  const responseTimeChart = data
    .filter(a => a.avgResponseTimeSec > 0)
    .slice(0, 8)
    .map(a => ({
      name: a.name.split(' ')[0],
      'Tempo (seg)': a.avgResponseTimeSec,
    }));

  return (
    <div className="space-y-4">
      {/* Cards de destaque - Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.slice(0, 3).map((attendant, index) => (
          <Card
            key={attendant.name}
            className={`relative overflow-hidden ${
              index === 0
                ? 'border-primary/30 bg-primary/5'
                : 'border-border'
            }`}
          >
            <CardContent className="pt-4 pb-4">
              {/* Medalha */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getMedal(index)}</span>
                  <div>
                    <p className="font-semibold text-sm text-foreground truncate max-w-[140px]">
                      {attendant.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attendant.totalMessages} mensagens
                    </p>
                  </div>
                </div>
                {index === 0 && <Trophy className="h-5 w-5 text-primary" />}
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-background rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Resposta</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {formatTime(attendant.avgResponseTimeSec)}
                  </p>
                </div>
                <div className="bg-background rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Conversão</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {attendant.conversionRate}%
                  </p>
                </div>
              </div>

              {attendant.revenue > 0 && (
                <div className="mt-2 text-center bg-primary/10 rounded-lg p-1.5">
                  <span className="text-xs text-primary font-medium">
                    R$ {attendant.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em vendas
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela completa */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Ranking Completo</CardTitle>
            <InfoTooltip text="Comparativo completo de performance entre todos os atendentes humanos no período. Inclui volume de mensagens, tempo médio de resposta, conversões em pedidos e faturamento gerado." />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">#</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Atendente</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span className="hidden sm:inline">Msgs</span>
                      <InfoTooltip text="Total de mensagens enviadas manualmente pelo atendente no período." />
                    </div>
                  </th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="hidden sm:inline">Conversas</span>
                      <InfoTooltip text="Número de conversas atribuídas a este atendente." />
                    </div>
                  </th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="hidden sm:inline">T. Resposta</span>
                      <InfoTooltip text="Tempo médio entre a mensagem do cliente e a resposta do atendente. Quanto menor, melhor o atendimento." />
                    </div>
                  </th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      <span className="hidden sm:inline">Pedidos</span>
                      <InfoTooltip text="Pedidos gerados via WhatsApp durante as conversas atendidas." />
                    </div>
                  </th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span className="hidden sm:inline">Conversão</span>
                      <InfoTooltip text="Percentual de conversas que resultaram em pedidos. Indica a efetividade do atendente em converter atendimento em vendas." />
                    </div>
                  </th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium hidden md:table-cell">
                    Faturamento
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((attendant, index) => (
                  <tr
                    key={attendant.name}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                      index === 0 ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="py-2.5 px-2 font-medium">
                      <span className="text-base">{getMedal(index)}</span>
                    </td>
                    <td className="py-2.5 px-2 font-medium text-foreground">
                      {attendant.name}
                    </td>
                    <td className="py-2.5 px-2 text-center text-foreground">
                      {attendant.totalMessages}
                    </td>
                    <td className="py-2.5 px-2 text-center text-foreground">
                      {attendant.totalConversations}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`font-medium ${
                        attendant.avgResponseTimeSec === 0
                          ? 'text-muted-foreground'
                          : attendant.avgResponseTimeSec <= 60
                            ? 'text-green-600'
                            : attendant.avgResponseTimeSec <= 300
                              ? 'text-amber-600'
                              : 'text-red-600'
                      }`}>
                        {formatTime(attendant.avgResponseTimeSec)}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center text-foreground">
                      {attendant.ordersCount}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`font-medium ${
                        attendant.conversionRate >= 20
                          ? 'text-green-600'
                          : attendant.conversionRate >= 10
                            ? 'text-amber-600'
                            : 'text-muted-foreground'
                      }`}>
                        {attendant.conversionRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-medium text-foreground hidden md:table-cell">
                      {attendant.revenue > 0
                        ? `R$ ${attendant.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '--'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Volume por atendente */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Volume por Atendente</CardTitle>
              <InfoTooltip text="Comparativo visual de mensagens enviadas, conversas gerenciadas e pedidos gerados por cada atendente." />
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Mensagens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Conversas" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pedidos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados suficientes</p>
            )}
          </CardContent>
        </Card>

        {/* Tempo de resposta */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Tempo Médio de Resposta</CardTitle>
              <InfoTooltip text="Tempo médio em segundos que cada atendente leva para responder após a mensagem do cliente. Barras menores indicam respostas mais rápidas." />
            </div>
          </CardHeader>
          <CardContent>
            {responseTimeChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={responseTimeChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={70}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${formatTime(value)}`, 'Tempo médio']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="Tempo (seg)" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados de resposta no período</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
