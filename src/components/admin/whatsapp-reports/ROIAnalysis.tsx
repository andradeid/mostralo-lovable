import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Keyboard, Headphones, Gauge, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  const speedData = [
    { name: 'IA', segundos: data.responseSpeed.avgBotSeconds, amostras: data.responseSpeed.botSamples },
    { name: 'Humano', segundos: data.responseSpeed.avgHumanSeconds, amostras: data.responseSpeed.humanSamples },
  ];

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Cards de economia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Economia de Digitação</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{data.typingEconomy.hoursSaved}h</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.typingEconomy.messagesCount} msgs • {data.typingEconomy.totalChars.toLocaleString()} caracteres
            </p>
            <p className="text-xs text-muted-foreground">
              ≈ {data.typingEconomy.minutesSaved} minutos poupados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Headphones className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Economia de Escuta</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{data.audioEconomy.minutesSaved}min</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.audioEconomy.totalAudios} áudios recebidos
            </p>
            <p className="text-xs text-muted-foreground">
              {data.audioEconomy.transcribedAudios} transcritos automaticamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Velocidade de Resposta</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{formatTime(data.responseSpeed.avgBotSeconds)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              IA vs {formatTime(data.responseSpeed.avgHumanSeconds)} humano
            </p>
            <p className="text-xs text-muted-foreground">
              {data.responseSpeed.avgHumanSeconds > 0 ? Math.round(data.responseSpeed.avgHumanSeconds / Math.max(data.responseSpeed.avgBotSeconds, 1)) : 0}x mais rápido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Custo por Atendimento</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(data.costPerService.costPerService)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Assinatura: {formatCurrency(data.costPerService.monthlyPrice)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.costPerService.totalConversations} conversas no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de velocidade comparativa */}
      <Card>
        <CardHeader><CardTitle className="text-base">Tempo de Resposta: IA vs Humano</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="fill-muted-foreground" />
              <YAxis label={{ value: 'Segundos', angle: -90, position: 'insideLeft' }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => [`${v}s`, 'Tempo médio']} />
              <Bar dataKey="segundos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
