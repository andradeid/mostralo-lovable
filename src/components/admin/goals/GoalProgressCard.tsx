import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalProgressCardProps {
  goalType: string;
  targetStoresPerMonth: number;
  currentStores: number;
  targetStores: number;
  progressPercentage: number;
  daysInMonth: number;
  currentDay: number;
}

const goalTypeLabels = {
  conservative: { label: 'Conservadora', color: 'bg-blue-500' },
  realistic: { label: 'Realista', color: 'bg-green-500' },
  aggressive: { label: 'Agressiva', color: 'bg-orange-500' },
  ultra: { label: 'Ultra', color: 'bg-red-500' }
};

export const GoalProgressCard = ({
  goalType,
  targetStoresPerMonth,
  currentStores,
  targetStores,
  progressPercentage,
  daysInMonth,
  currentDay
}: GoalProgressCardProps) => {
  const expectedProgress = (currentDay / daysInMonth) * 100;
  const isAhead = progressPercentage >= expectedProgress;
  const remaining = targetStores - currentStores;
  const daysLeft = daysInMonth - currentDay;
  const ratePerDay = daysLeft > 0 ? (remaining / daysLeft).toFixed(1) : '0';
  const currentRate = currentDay > 0 ? (currentStores / currentDay).toFixed(1) : '0';
  const goalInfo = goalTypeLabels[goalType as keyof typeof goalTypeLabels] || goalTypeLabels.realistic;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Top bar with progress */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Meta do Mês</span>
          </div>
          <Badge className={cn("text-[10px]", goalInfo.color)}>
            {goalInfo.label}
          </Badge>
        </div>

        {/* Big progress */}
        <div className="flex items-end gap-3 mb-2">
          <span className="text-5xl font-black tracking-tight leading-none">
            {currentStores}
          </span>
          <span className="text-xl text-muted-foreground font-medium leading-none mb-1">
            / {targetStores}
          </span>
          <div className="ml-auto flex items-center gap-1 mb-1">
            {isAhead ? (
              <span className="text-xs text-green-500 font-medium flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> Acima
              </span>
            ) : (
              <span className="text-xs text-orange-500 font-medium flex items-center gap-0.5">
                <TrendingDown className="h-3 w-3" /> Abaixo
              </span>
            )}
          </div>
        </div>

        <Progress value={progressPercentage} className="h-2.5 mb-1" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{progressPercentage.toFixed(0)}% alcançado</span>
          <span>Esperado: {expectedProgress.toFixed(0)}%</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 border-t divide-x">
        {[
          { label: 'Dia', value: `${currentDay}/${daysInMonth}`, icon: Calendar },
          { label: 'Faltam', value: `${remaining}`, sublabel: 'lojas' },
          { label: 'Ritmo', value: `${currentRate}`, sublabel: '/dia' },
          { label: 'Necessário', value: `${ratePerDay}`, sublabel: '/dia' },
        ].map((stat, i) => (
          <div key={i} className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">{stat.label}</p>
            <p className="text-lg font-bold leading-tight">
              {stat.value}
              {stat.sublabel && <span className="text-[10px] text-muted-foreground font-normal">{stat.sublabel}</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
