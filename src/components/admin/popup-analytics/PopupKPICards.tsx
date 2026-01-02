import { Card, CardContent } from '@/components/ui/card';
import { Eye, MousePointerClick, TrendingUp, Trophy } from 'lucide-react';

interface PopupKPICardsProps {
  totalViews: number;
  totalClicks: number;
  conversionRate: number;
  bestVariation: string | null;
  bestVariationRate: number;
}

export const PopupKPICards = ({
  totalViews,
  totalClicks,
  conversionRate,
  bestVariation,
  bestVariationRate
}: PopupKPICardsProps) => {
  const kpis = [
    {
      title: 'Total de Views',
      value: totalViews.toLocaleString('pt-BR'),
      icon: Eye,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Total de Cliques',
      value: totalClicks.toLocaleString('pt-BR'),
      icon: MousePointerClick,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Taxa de Conversão',
      value: `${conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Melhor Variação',
      value: bestVariation ? `${bestVariation} (${bestVariationRate.toFixed(1)}%)` : '-',
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.title}</p>
                <p className="text-lg font-bold">{kpi.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
