import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface AnalysisItem {
  houve_intencao_compra: boolean;
  houve_fechamento: boolean;
  last_message_at: string | null;
  analyzed_at: string | null;
}

interface TemporalTrendProps {
  analyses: AnalysisItem[];
}

export function TemporalTrend({ analyses }: TemporalTrendProps) {
  const chartData = useMemo(() => {
    if (!analyses.length) return [];

    const byDay: Record<string, { conversas: number; intencao: number; fechamento: number }> = {};

    analyses.forEach(a => {
      const dateStr = a.last_message_at || a.analyzed_at;
      if (!dateStr) return;
      const day = dateStr.split('T')[0];
      if (!byDay[day]) byDay[day] = { conversas: 0, intencao: 0, fechamento: 0 };
      byDay[day].conversas++;
      if (a.houve_intencao_compra) byDay[day].intencao++;
      if (a.houve_fechamento) byDay[day].fechamento++;
    });

    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(date + 'T12:00:00')),
        ...data,
      }));
  }, [analyses]);

  if (chartData.length < 2) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Tendência Temporal
            <InfoTooltip text="Evolução diária das conversas analisadas, mostrando quantas tiveram intenção de compra e quantas resultaram em fechamento ao longo do tempo." />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          Dados insuficientes para gráfico de tendência
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Tendência Temporal
            <InfoTooltip text="Evolução diária das conversas analisadas, mostrando quantas tiveram intenção de compra e quantas resultaram em fechamento ao longo do tempo." />
          </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  conversas: 'Conversas',
                  intencao: 'Com Intenção',
                  fechamento: 'Fechamentos',
                };
                return [value, labels[name] || name];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  conversas: 'Conversas',
                  intencao: 'Intenção',
                  fechamento: 'Fechamento',
                };
                return labels[value] || value;
              }}
            />
            <Line type="monotone" dataKey="conversas" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="intencao" stroke="hsl(45, 93%, 47%)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="fechamento" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
