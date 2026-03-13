import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, SmilePlus, Meh, Frown, TrendingUp, Phone, Bot, User } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import { InfoTooltip } from './InfoTooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  storeId: string | null;
  dateFrom: string;
  dateTo: string;
}

interface ConversationSentiment {
  remoteJid: string;
  phoneNumber: string;
  openedAt: string;
  closedAt: string;
  score: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  factors: string[];
  messageCount: number;
  durationMinutes: number;
  source: string;
  hadOrder: boolean;
  avgResponseTimeSec: number;
}

interface SentimentData {
  summary: {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
    avgScore: number;
  };
  conversations: ConversationSentiment[];
  dailyTrend: {
    date: string;
    avgScore: number;
    count: number;
    positive: number;
    neutral: number;
    negative: number;
  }[];
  sourceBreakdown: {
    ia_only: number;
    human_intervened: number;
    cellphone_only: number;
  };
  responseTimeImpact: {
    fast: number;
    medium: number;
    slow: number;
  };
}

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#f59e0b',
  negative: '#ef4444',
};

const SENTIMENT_LABELS = {
  positive: 'Positivo',
  neutral: 'Neutro',
  negative: 'Negativo',
};

function getSentimentIcon(sentiment: string, size = 16) {
  switch (sentiment) {
    case 'positive': return <SmilePlus className="text-green-500" style={{ width: size, height: size }} />;
    case 'neutral': return <Meh className="text-yellow-500" style={{ width: size, height: size }} />;
    case 'negative': return <Frown className="text-red-500" style={{ width: size, height: size }} />;
    default: return null;
  }
}

function getScoreColor(score: number): string {
  if (score >= 65) return 'text-green-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? `${m}min` : ''}`;
}

function formatPhone(phone: string): string {
  // Formatar número para exibição parcial
  if (phone.length > 8) {
    return `***${phone.slice(-4)}`;
  }
  return phone;
}

export function SentimentAnalysis({ storeId, dateFrom, dateTo }: Props) {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    fetchData();
  }, [storeId, dateFrom, dateTo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('whatsapp-reports-sentiment', {
        body: { store_id: storeId, date_from: `${dateFrom}T00:00:00`, date_to: `${dateTo}T23:59:59` },
      });
      if (error) throw error;
      setData(result);
    } catch (err) {
      console.error('Erro ao buscar dados de sentimento:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!data || data.summary.total === 0) {
    return (
      <div className="mt-4 text-center py-12 text-muted-foreground">
        <Meh className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Nenhum atendimento finalizado no período selecionado</p>
        <p className="text-xs mt-1">Os sentimentos são calculados ao finalizar conversas</p>
      </div>
    );
  }

  const { summary, conversations, dailyTrend, sourceBreakdown, responseTimeImpact } = data;

  // Dados para gráfico de pizza de sentimento
  const sentimentPieData = [
    { name: 'Positivo', value: summary.positive },
    { name: 'Neutro', value: summary.neutral },
    { name: 'Negativo', value: summary.negative },
  ].filter(d => d.value > 0);

  // Dados para gráfico de origem
  const sourceData = [
    { name: 'IA resolveu', value: sourceBreakdown.ia_only, fill: 'hsl(var(--primary))' },
    { name: 'Humano interveio', value: sourceBreakdown.human_intervened, fill: '#94a3b8' },
    { name: 'Só celular', value: sourceBreakdown.cellphone_only, fill: '#f59e0b' },
  ].filter(d => d.value > 0);

  // Dados para gráfico de tempo de resposta
  const responseData = [
    { faixa: '< 1min', count: responseTimeImpact.fast },
    { faixa: '1-5min', count: responseTimeImpact.medium },
    { faixa: '> 5min', count: responseTimeImpact.slow },
  ];

  // Formatar datas para tendência
  const trendData = dailyTrend.map(d => ({
    ...d,
    dateLabel: format(new Date(d.date + 'T12:00:00'), 'dd/MM', { locale: ptBR }),
  }));

  return (
    <div className="space-y-4 mt-4">
      {/* Score geral e resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-sm text-muted-foreground">Score Geral</p>
              <InfoTooltip text="Média do score de sentimento de todos os atendimentos finalizados. Escala de 0-100: acima de 65 = positivo, 40-64 = neutro, abaixo de 40 = negativo." />
            </div>
            <p className={`text-4xl font-bold ${getScoreColor(summary.avgScore)}`}>
              {summary.avgScore}
            </p>
            <p className="text-xs text-muted-foreground mt-1">de 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <SmilePlus className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">Positivos</p>
            </div>
            <p className="text-3xl font-bold text-green-500">{summary.positive}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.total > 0 ? Math.round((summary.positive / summary.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Meh className="h-4 w-4 text-yellow-500" />
              <p className="text-sm text-muted-foreground">Neutros</p>
            </div>
            <p className="text-3xl font-bold text-yellow-500">{summary.neutral}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.total > 0 ? Math.round((summary.neutral / summary.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Frown className="h-4 w-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Negativos</p>
            </div>
            <p className="text-3xl font-bold text-red-500">{summary.negative}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.total > 0 ? Math.round((summary.negative / summary.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tendência diária */}
      {trendData.length > 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Tendência de Sentimento</CardTitle>
              <InfoTooltip text="Evolução do score médio de sentimento ao longo dos dias. Linha verde acima de 65 indica tendência positiva, abaixo de 40 indica problemas nos atendimentos." />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradientScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-xs">
                        <p className="font-semibold mb-1">{label}</p>
                        <p>Score médio: <span className={`font-bold ${getScoreColor(d.avgScore)}`}>{d.avgScore}</span></p>
                        <p className="text-muted-foreground">{d.count} atendimentos</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-green-500">😊 {d.positive}</span>
                          <span className="text-yellow-500">😐 {d.neutral}</span>
                          <span className="text-red-500">😟 {d.negative}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                {/* Linha de referência para "bom" */}
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#gradientScore)"
                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Distribuição de sentimento */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Distribuição de Sentimento</CardTitle>
              <InfoTooltip text="Proporção de atendimentos positivos, neutros e negativos. O cálculo considera tempo de resposta, resolução (venda), autonomia da IA e duração do atendimento." />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={sentimentPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {sentimentPieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.name === 'Positivo' ? SENTIMENT_COLORS.positive :
                          entry.name === 'Neutro' ? SENTIMENT_COLORS.neutral :
                          SENTIMENT_COLORS.negative
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {sentimentPieData.map(d => {
                  const pct = Math.round((d.value / summary.total) * 100);
                  return (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: d.name === 'Positivo' ? SENTIMENT_COLORS.positive : d.name === 'Neutro' ? SENTIMENT_COLORS.neutral : SENTIMENT_COLORS.negative }}
                        />
                        <span className="text-sm">{d.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{d.value} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impacto do tempo de resposta */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Impacto do Tempo de Resposta</CardTitle>
              <InfoTooltip text="Quantos atendimentos tiveram resposta rápida (<1min), moderada (1-5min) ou lenta (>5min). Respostas rápidas tendem a gerar sentimentos mais positivos." />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={responseData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="faixa" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="count" name="Atendimentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sentimento por origem */}
      {sourceData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Atendimentos por Origem</CardTitle>
              <InfoTooltip text="Distribuição dos atendimentos por quem resolveu: IA sozinha, IA + humano, ou apenas celular. Atendimentos da IA que geram pedidos são considerados mais positivos." />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'IA resolveu', value: sourceBreakdown.ia_only, icon: <Bot className="h-5 w-5 text-primary" />, color: 'text-primary' },
                { label: 'Humano interveio', value: sourceBreakdown.human_intervened, icon: <User className="h-5 w-5 text-muted-foreground" />, color: 'text-muted-foreground' },
                { label: 'Só celular', value: sourceBreakdown.cellphone_only, icon: <Phone className="h-5 w-5 text-yellow-500" />, color: 'text-yellow-500' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className="flex justify-center mb-1">{item.icon}</div>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de conversas recentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Últimos Atendimentos Analisados</CardTitle>
            <InfoTooltip text="Detalhamento dos últimos 50 atendimentos finalizados com seus scores de sentimento, fatores que influenciaram a avaliação e dados principais." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b border-border">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">Contato</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Score</th>
                  <th className="text-center p-3 font-medium text-muted-foreground hidden md:table-cell">Duração</th>
                  <th className="text-center p-3 font-medium text-muted-foreground hidden md:table-cell">Msgs</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Fatores</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Origem</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conv, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <p className="font-medium">{formatPhone(conv.phoneNumber)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conv.openedAt), 'dd/MM HH:mm', { locale: ptBR })}
                      </p>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getSentimentIcon(conv.sentiment)}
                        <span className={`font-bold ${getScoreColor(conv.score)}`}>{conv.score}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center hidden md:table-cell text-muted-foreground">
                      {formatDuration(conv.durationMinutes)}
                    </td>
                    <td className="p-3 text-center hidden md:table-cell text-muted-foreground">
                      {conv.messageCount}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {conv.factors.slice(0, 3).map((f, fi) => (
                          <Badge
                            key={fi}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {f}
                          </Badge>
                        ))}
                        {conv.hadOrder && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-500/20">
                            💰 Pedido
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {conv.source === 'ia_only' && <Bot className="h-4 w-4 mx-auto text-primary" />}
                      {conv.source === 'human_intervened' && <User className="h-4 w-4 mx-auto text-muted-foreground" />}
                      {conv.source === 'cellphone_only' && <Phone className="h-4 w-4 mx-auto text-yellow-500" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
