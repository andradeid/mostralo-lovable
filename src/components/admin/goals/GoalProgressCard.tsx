import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Calendar } from 'lucide-react';

interface GoalProgressCardProps {
  goalType: string;
  targetStoresPerMonth: number;
  currentStores: number;
  targetStores: number;
  progressPercentage: number;
  daysInMonth: number;
  currentDay: number;
}

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

  const goalTypeLabels = {
    conservative: { label: 'Conservadora', color: 'bg-blue-500' },
    realistic: { label: 'Realista', color: 'bg-green-500' },
    aggressive: { label: 'Agressiva', color: 'bg-orange-500' },
    ultra: { label: 'Ultra Agressiva', color: 'bg-red-500' }
  };

  const goalInfo = goalTypeLabels[goalType as keyof typeof goalTypeLabels] || goalTypeLabels.realistic;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progresso da Meta
          </CardTitle>
          <Badge className={goalInfo.color}>
            {goalInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progresso Principal */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Meta do Mês</span>
            <span className="text-2xl font-bold">
              {currentStores} / {targetStores}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {progressPercentage.toFixed(1)}% alcançado
            </span>
            {isAhead ? (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Acima do esperado
              </span>
            ) : (
              <span className="text-xs text-orange-600 font-medium">
                Abaixo do esperado
              </span>
            )}
          </div>
        </div>

        {/* Meta Diária */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Meta por dia</p>
            <p className="text-lg font-bold flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {(targetStoresPerMonth / daysInMonth).toFixed(1)} lojas
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Progresso esperado</p>
            <p className="text-lg font-bold">
              {expectedProgress.toFixed(1)}%
            </p>
            <Progress value={expectedProgress} className="h-1 mt-1" />
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Dia do mês</p>
            <p className="text-xl font-bold">{currentDay}/{daysInMonth}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Faltam</p>
            <p className="text-xl font-bold">{targetStores - currentStores}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ritmo</p>
            <p className="text-xl font-bold">
              {currentDay > 0 ? (currentStores / currentDay).toFixed(1) : '0'}/dia
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
