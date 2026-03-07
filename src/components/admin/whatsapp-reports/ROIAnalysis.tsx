import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Cpu, Headphones, Gauge, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  storeId: string | null;
  dateFrom: string;
  dateTo: string;
}

interface ROIData {
  typingEconomy: { totalChars: number; minutesSaved: number; hoursSaved: number; messagesCount: number };
  audioEconomy: { totalAudios: number; transcribedAudios: number; totalSeconds: number; minutesSaved: number };
  responseSpeed: { avgBotSeconds: number; avgHumanSeconds: number; botSamples: number; humanSamples: number };
  costPerService: { monthlyPrice: number; totalConversations: number; costPerService: number };
}

export function ROIAnalysis({ storeId, dateFrom, dateTo }: Props) {
  const [data, setData] = useState<ROIData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    fetchData();
  }, [storeId, dateFrom, dateTo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('whatsapp-reports-roi', {
        body: { store_id: storeId, date_from: `${dateFrom}T00:00:00`, date_to: `${dateTo}T23:59:59` },
      });
      if (error) throw error;
      setData(result);
    } catch (err) {
      console.error('Erro ao buscar dados de ROI:', err);
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

  // Estimativa de custo humano por atendimento (baseado em salário mínimo + encargos)
  const estimatedHumanCost = 15.0;
  const savingsPerService = Math.max(0, estimatedHumanCost - data.costPerService.costPerService);
  const totalSavings = savingsPerService * data.costPerService.totalConversations;

  const speedData = [
    { name: 'IA', segundos: data.responseSpeed.avgBotSeconds, amostras: data.responseSpeed.botSamples },
    { name: 'Humano', segundos: data.responseSpeed.avgHumanSeconds, amostras: data.responseSpeed.humanSamples },
  ];

  const speedColors = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))'];

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  };

  const speedMultiplier = data.responseSpeed.avgHumanSeconds > 0
    ? Math.round(data.responseSpeed.avgHumanSeconds / Math.max(data.responseSpeed.avgBotSeconds, 1))
    : 0;

  return (
    <div className="space-y-4 mt-4">
      {/* Faixa de economia total */}
      {totalSavings > 0 && (
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Economia estimada no período</p>
              <p className="text-xs text-muted-foreground">Comparado ao custo estimado de um atendente humano (R$ 15/atendimento)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalSavings)}</p>
            <InfoTooltip text="Cálculo baseado na diferença entre o custo estimado de um atendente humano (R$ 15 por atendimento, considerando salário + encargos) e o custo real por atendimento da IA no período." />
          </div>
        </div>
      )}

      {/* Cards de economia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Cpu className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Horas de Trabalho Automatizadas</span>
              </div>
              <InfoTooltip text="Total de horas que a IA economizou digitando respostas automáticas. Calculado com base nos caracteres enviados pela IA ÷ velocidade média de digitação humana (150 caracteres/minuto)." />
            </div>
            <p className="text-4xl font-bold text-foreground">{data.typingEconomy.hoursSaved}h</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.typingEconomy.messagesCount.toLocaleString()} mensagens automáticas
            </p>
            <p className="text-xs text-muted-foreground">
              {data.typingEconomy.totalChars.toLocaleString()} caracteres digitados pela IA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Headphones className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Tempo de Equipe Recuperado</span>
              </div>
              <InfoTooltip text="Tempo que sua equipe economizou ao não precisar ouvir áudios dos clientes. A IA transcreveu automaticamente os áudios em texto, permitindo leitura rápida em vez de escuta." />
            </div>
            <p className="text-4xl font-bold text-foreground">{data.audioEconomy.minutesSaved}min</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.audioEconomy.totalAudios} áudios recebidos
            </p>
            <p className="text-xs text-muted-foreground">
              {data.audioEconomy.transcribedAudios} transcritos automaticamente pela IA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <Gauge className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Velocidade de Resposta</span>
              </div>
              <InfoTooltip text="Tempo médio que a IA leva para responder uma mensagem do cliente. Comparado com o tempo médio de resposta quando um humano intervém. Quanto menor, melhor a experiência do cliente." />
            </div>
            <p className="text-4xl font-bold text-foreground">{formatTime(data.responseSpeed.avgBotSeconds)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              IA vs {formatTime(data.responseSpeed.avgHumanSeconds)} do atendente
            </p>
            {speedMultiplier > 1 && (
              <p className="text-xs font-semibold text-primary mt-0.5">
                ⚡ {speedMultiplier}x mais rápido que humano
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Custo por Atendimento</span>
              </div>
              <InfoTooltip text="Quanto custa cada atendimento usando a IA. Calculado dividindo o valor da assinatura pelo total de conversas no período. Compare com o custo estimado de R$ 15,00 por atendimento humano." />
            </div>
            <p className="text-4xl font-bold text-foreground">{formatCurrency(data.costPerService.costPerService)}</p>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs text-muted-foreground">
                vs {formatCurrency(estimatedHumanCost)} estimado humano
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.costPerService.totalConversations} conversas • Assinatura: {formatCurrency(data.costPerService.monthlyPrice)}
            </p>
            {data.costPerService.costPerService < estimatedHumanCost && (
              <p className="text-xs font-semibold text-green-600 mt-0.5">
                ✓ {formatCurrency(savingsPerService)} mais barato por atendimento
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de velocidade comparativa */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Tempo de Resposta: IA vs Humano</CardTitle>
            <InfoTooltip text="Comparação visual do tempo médio de resposta entre a IA (laranja) e o atendente humano (cinza). A barra menor significa resposta mais rápida." />
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="fill-muted-foreground" />
              <YAxis label={{ value: 'Segundos', angle: -90, position: 'insideLeft' }} className="fill-muted-foreground" />
              <Tooltip
                formatter={(v: number, _: string, props: any) => [
                  `${v}s (${props.payload.amostras} amostras)`,
                  'Tempo médio',
                ]}
              />
              <Bar dataKey="segundos" radius={[6, 6, 0, 0]}>
                {speedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={speedColors[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
