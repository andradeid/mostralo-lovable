import { useRevenueByChannel } from '@/hooks/useRevenueByChannel';
import { ChannelRevenueCards } from './ChannelRevenueCards';
import { ChannelComparisonChart } from './ChannelComparisonChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Lightbulb, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelRevenueDashboardProps {
  storeId: string | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function ChannelRevenueDashboard({ storeId }: ChannelRevenueDashboardProps) {
  const { data, isLoading } = useRevenueByChannel(storeId);

  const channels = data?.channels || [];
  const monthlyData = data?.monthlyByChannel || [];
  const totalRevenue = data?.totalRevenue || 0;

  // Generate insights
  const insights: { text: string; type: 'info' | 'success' | 'warning' }[] = [];
  const sorted = [...channels].sort((a, b) => b.total - a.total);
  const activeChannels = sorted.filter(c => c.total > 0);
  const inactiveChannels = sorted.filter(c => c.total === 0);

  if (activeChannels.length > 0) {
    const top = activeChannels[0];
    insights.push({
      text: `${top.channel} representa ${top.percentage.toFixed(0)}% da sua receita (${formatCurrency(top.total)})`,
      type: 'info',
    });
  }

  if (activeChannels.length === 1) {
    insights.push({
      text: 'Toda a sua receita vem de um único canal — diversifique para reduzir riscos',
      type: 'warning',
    });
  }

  if (inactiveChannels.length > 0 && inactiveChannels.length <= 4) {
    const names = inactiveChannels.slice(0, 3).map(c => c.channel).join(', ');
    insights.push({
      text: `Nenhuma venda registrada em: ${names}`,
      type: 'warning',
    });
  }

  if (activeChannels.length >= 3) {
    insights.push({
      text: `Você tem ${activeChannels.length} canais ativos gerando receita — ótima diversificação!`,
      type: 'success',
    });
  }

  const typeStyles = {
    success: 'border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400',
    warning: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400',
    info: 'border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400',
  };

  const typeIcons = {
    success: CheckCircle2,
    warning: AlertCircle,
    info: TrendingUp,
  };

  return (
    <div className="space-y-4">
      {/* Header com total geral */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receita Total por Canal</p>
              <p className="text-2xl font-bold text-primary">
                {isLoading ? '...' : formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards por canal (ranked) */}
      <ChannelRevenueCards channels={channels} isLoading={isLoading} />

      {/* Insights */}
      {insights.length > 0 && !isLoading && (
        <Card>
          <CardHeader className="pb-3 p-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Insights por Canal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              {insights.slice(0, 3).map((insight, idx) => {
                const Icon = typeIcons[insight.type];
                return (
                  <div
                    key={idx}
                    className={cn('flex items-center gap-3 p-3 rounded-lg border text-sm', typeStyles[insight.type])}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{insight.text}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos comparativos */}
      <ChannelComparisonChart
        channels={channels}
        monthlyData={monthlyData}
        isLoading={isLoading}
      />
    </div>
  );
}
