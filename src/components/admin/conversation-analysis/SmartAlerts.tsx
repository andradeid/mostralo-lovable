import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, Calendar, TrendingDown } from "lucide-react";

interface AnalysisItem {
  houve_intencao_compra: boolean;
  houve_fechamento: boolean;
  valor_estimado: number;
  last_message_at: string | null;
}

interface SmartAlertsProps {
  analyses: AnalysisItem[];
}

interface Alert {
  icon: React.ReactNode;
  title: string;
  description: string;
  severity: 'warning' | 'info' | 'danger';
}

const DAYS_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function SmartAlerts({ analyses }: SmartAlertsProps) {
  const alerts = useMemo<Alert[]>(() => {
    if (analyses.length < 5) return [];
    const result: Alert[] = [];

    // Análise por hora: onde perde mais vendas
    const hourlyIntent: Record<number, { intencao: number; fechamento: number; valor: number }> = {};
    analyses.forEach(a => {
      if (!a.last_message_at) return;
      const hour = new Date(a.last_message_at).getHours();
      if (!hourlyIntent[hour]) hourlyIntent[hour] = { intencao: 0, fechamento: 0, valor: 0 };
      if (a.houve_intencao_compra) hourlyIntent[hour].intencao++;
      if (a.houve_fechamento) hourlyIntent[hour].fechamento++;
      if (a.houve_intencao_compra && !a.houve_fechamento) {
        hourlyIntent[hour].valor += a.valor_estimado || 0;
      }
    });

    // Hora com mais perdas
    let worstHour = -1;
    let worstLosses = 0;
    let worstValue = 0;
    Object.entries(hourlyIntent).forEach(([h, data]) => {
      const losses = data.intencao - data.fechamento;
      if (losses > worstLosses && data.intencao >= 3) {
        worstHour = Number(h);
        worstLosses = losses;
        worstValue = data.valor;
      }
    });

    if (worstHour >= 0 && worstLosses >= 2) {
      const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(worstValue);
      result.push({
        icon: <Clock className="h-4 w-4" />,
        title: `Perdas concentradas às ${String(worstHour).padStart(2, '0')}h`,
        description: `${worstLosses} conversas com intenção não fecharam nesse horário (${formatted} em potencial). Considere reforçar o atendimento.`,
        severity: 'warning',
      });
    }

    // Análise por dia da semana
    const dailyStats: Record<number, { intencao: number; fechamento: number }> = {};
    analyses.forEach(a => {
      if (!a.last_message_at) return;
      const day = new Date(a.last_message_at).getDay();
      if (!dailyStats[day]) dailyStats[day] = { intencao: 0, fechamento: 0 };
      if (a.houve_intencao_compra) dailyStats[day].intencao++;
      if (a.houve_fechamento) dailyStats[day].fechamento++;
    });

    let worstDay = -1;
    let worstDayRate = 100;
    let worstDayIntencao = 0;
    Object.entries(dailyStats).forEach(([d, data]) => {
      if (data.intencao >= 3) {
        const rate = (data.fechamento / data.intencao) * 100;
        if (rate < worstDayRate) {
          worstDay = Number(d);
          worstDayRate = rate;
          worstDayIntencao = data.intencao;
        }
      }
    });

    if (worstDay >= 0 && worstDayRate < 30) {
      result.push({
        icon: <Calendar className="h-4 w-4" />,
        title: `${DAYS_PT[worstDay]} com baixa conversão`,
        description: `Apenas ${worstDayRate.toFixed(0)}% das ${worstDayIntencao} conversas com intenção fecharam nesse dia. Investigue o que está diferente.`,
        severity: 'danger',
      });
    }

    // Taxa geral baixa
    const totalIntencao = analyses.filter(a => a.houve_intencao_compra).length;
    const totalFechamento = analyses.filter(a => a.houve_fechamento).length;
    if (totalIntencao > 0) {
      const overallRate = (totalFechamento / totalIntencao) * 100;
      if (overallRate < 25) {
        result.push({
          icon: <TrendingDown className="h-4 w-4" />,
          title: 'Taxa de conversão abaixo de 25%',
          description: `Apenas ${overallRate.toFixed(0)}% das conversas com intenção de compra estão convertendo. Considere melhorar o follow-up e agilizar respostas.`,
          severity: 'info',
        });
      }
    }

    return result;
  }, [analyses]);

  if (alerts.length === 0) return null;

  const severityStyles = {
    warning: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
    danger: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20',
    info: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
  };

  const iconStyles = {
    warning: 'text-amber-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Alertas Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert, i) => (
          <div key={i} className={`border-l-4 rounded-r-lg p-3 ${severityStyles[alert.severity]}`}>
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 shrink-0 ${iconStyles[alert.severity]}`}>
                {alert.icon}
              </span>
              <div>
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
