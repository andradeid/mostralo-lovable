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
      title: 'Total Views',
      value: totalViews.toLocaleString('pt-BR'),
      icon: Eye,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Total Cliques',
      value: totalClicks.toLocaleString('pt-BR'),
      icon: MousePointerClick,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Conversão',
      value: `${conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Melhor Var.',
      value: bestVariation ? `${bestVariation} (${bestVariationRate.toFixed(1)}%)` : '-',
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`p-1.5 md:p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 md:h-5 md:w-5 ${kpi.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">{kpi.title}</p>
                <p className="text-sm md:text-lg font-bold truncate">{kpi.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
