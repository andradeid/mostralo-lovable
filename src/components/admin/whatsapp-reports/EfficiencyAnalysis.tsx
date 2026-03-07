import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { InfoTooltip } from './InfoTooltip';

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

const STATUS_COLORS = ['hsl(var(--primary))', '#94a3b8', '#f59e0b', '#ef4444'];

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

  const autonomyData = data.autonomyByHour.filter(h => h.total > 0);

  const slaChartData = [
    { faixa: '< 30s', IA: data.slaData.bot.under30s, Humano: data.slaData.human.under30s },
    { faixa: '< 1min', IA: data.slaData.bot.under1m, Humano: data.slaData.human.under1m },
    { faixa: '< 5min', IA: data.slaData.bot.under5m, Humano: data.slaData.human.under5m },
    { faixa: '> 5min', IA: data.slaData.bot.over5m, Humano: data.slaData.human.over5m },
  ];

  const statusData = Object.entries(data.statusDistribution || {}).map(([status, count]) => ({
    name: status === 'active' ? 'Ativas' : status === 'closed' ? 'Fechadas' : status === 'paused' ? 'Pausadas' : status,
    value: count,
  }));

  // Decisões da IA: autônomas vs pausadas
  const totalAutonomous = autonomyData.reduce((sum, h) => sum + h.autonomous, 0);
  const totalPaused = autonomyData.reduce((sum, h) => sum + h.paused, 0);
  const totalDecisions = totalAutonomous + totalPaused;
  const aiDecisionData = totalDecisions > 0 ? [
    { name: 'IA resolveu sozinha', value: totalAutonomous },
    { name: 'Humano interveio', value: totalPaused },
  ] : [];
  const aiDecisionColors = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))'];

  const conversionCards = [
    {
      title: 'Total Conversas',
      value: data.conversion.totalConversations,
      tooltip: 'Número total de conversas únicas no período. Cada conversa representa um cliente diferente que interagiu no WhatsApp.',
    },
    {
      title: 'Pedidos Gerados',
      value: data.conversion.ordersCreated,
      tooltip: 'Quantos pedidos foram efetivamente criados a partir das conversas do WhatsApp. Indica o poder de conversão do canal.',
    },
    {
      title: 'Taxa de Conversão',
      value: `${data.conversion.conversionRate}%`,
      tooltip: 'Percentual de conversas que resultaram em um pedido. Fórmula: (Pedidos ÷ Conversas) × 100. Quanto maior, melhor o desempenho de vendas.',
      highlight: data.conversion.conversionRate > 0,
    },
  ];

  return (
    <div className="space-y-4 mt-4">
      {/* Cards de conversão */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {conversionCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <InfoTooltip text={card.tooltip} />
              </div>
              <p className={`text-3xl font-bold ${card.highlight ? 'text-primary' : 'text-foreground'}`}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Autonomia por horário */}
      {autonomyData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Taxa de Autonomia da IA por Horário</CardTitle>
              <InfoTooltip text="Mostra em quais horários a IA trabalha sozinha (laranja) e em quais precisou de intervenção humana (amarelo). Use isso para identificar horários que precisam de mais treinamento da IA." />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={autonomyData}>
                <defs>
                  <linearGradient id="gradientAutonomous" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip />
                <Legend />
                <Bar dataKey="autonomous" name="Autônomo (IA)" fill="url(#gradientAutonomous)" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="paused" name="Intervenção Humana" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SLA */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">SLA de Resposta: IA vs Humano</CardTitle>
              <InfoTooltip text="Distribuição do tempo de resposta por faixa. Mostra quantas respostas da IA e do humano caíram em cada intervalo de tempo. O ideal é ter mais respostas na faixa '< 30s'." />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={slaChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="faixa" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip />
                <Legend />
                <Bar dataKey="IA" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Humano" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Decisões da IA (novo gráfico de rosca) */}
        {aiDecisionData.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Decisões da IA</CardTitle>
                <InfoTooltip text="Percentual de conversas que a IA resolveu 100% sozinha vs. conversas onde o botão 'Pausar IA' foi acionado e um humano assumiu. Quanto maior a fatia laranja, mais autônoma está a IA." />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={220}>
                  <PieChart>
                    <Pie
                      data={aiDecisionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {aiDecisionData.map((_, i) => (
                        <Cell key={i} fill={aiDecisionColors[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {totalDecisions > 0 ? Math.round((totalAutonomous / totalDecisions) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">IA resolveu sozinha</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-muted-foreground">
                      {totalDecisions > 0 ? Math.round((totalPaused / totalDecisions) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Humano interveio</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70">{totalDecisions} decisões no período</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Fallback: status das conversas
          statusData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Conversas por Status</CardTitle>
                  <InfoTooltip text="Distribuição das conversas pelo status atual: ativas (em andamento), fechadas (finalizadas) ou pausadas (aguardando ação humana)." />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
