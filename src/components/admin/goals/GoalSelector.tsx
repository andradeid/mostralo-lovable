import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Zap, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalOption {
  type: 'conservative' | 'realistic' | 'aggressive' | 'ultra';
  label: string;
  description: string;
  storesPerMonth: number;
  icon: React.ReactNode;
  badgeColor: string;
  recommended?: boolean;
}

interface GoalSelectorProps {
  avgPlanPrice: number;
  onSelectGoal: (type: 'conservative' | 'realistic' | 'aggressive' | 'ultra', storesPerMonth: number, targetMRR: number) => void;
  isLoading?: boolean;
}

export const GoalSelector = ({ avgPlanPrice, onSelectGoal, isLoading }: GoalSelectorProps) => {
  const goals: GoalOption[] = [
    {
      type: 'conservative',
      label: 'Conservadora',
      description: 'Crescimento estável',
      storesPerMonth: 2,
      icon: <Target className="h-4 w-4" />,
      badgeColor: 'bg-blue-500',
    },
    {
      type: 'realistic',
      label: 'Realista',
      description: 'Recomendada',
      storesPerMonth: 5,
      icon: <TrendingUp className="h-4 w-4" />,
      badgeColor: 'bg-green-500',
      recommended: true,
    },
    {
      type: 'aggressive',
      label: 'Agressiva',
      description: 'Acelerado',
      storesPerMonth: 10,
      icon: <Zap className="h-4 w-4" />,
      badgeColor: 'bg-orange-500',
    },
    {
      type: 'ultra',
      label: 'Ultra',
      description: 'Explosivo',
      storesPerMonth: 20,
      icon: <Rocket className="h-4 w-4" />,
      badgeColor: 'bg-red-500',
    }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Target className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Defina Sua Meta</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {goals.map((goal) => {
          const projectedMRR = goal.storesPerMonth * avgPlanPrice;
          
          return (
            <div
              key={goal.type}
              className={cn(
                "rounded-xl border bg-card p-4 hover:border-primary/40 transition-all cursor-pointer relative",
                goal.recommended && "border-green-500/30 ring-1 ring-green-500/20"
              )}
              onClick={() => onSelectGoal(goal.type, goal.storesPerMonth, projectedMRR)}
            >
              {goal.recommended && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-500 text-[9px] h-4 px-2">Recomendada</Badge>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="p-1.5 rounded-md bg-muted">{goal.icon}</div>
                <Badge className={cn("text-[10px]", goal.badgeColor)}>{goal.label}</Badge>
              </div>
              
              <p className="text-2xl font-black mb-0.5">{goal.storesPerMonth}</p>
              <p className="text-xs text-muted-foreground mb-3">lojas/mês</p>
              
              <div className="space-y-1.5 pt-3 border-t text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MRR</span>
                  <span className="font-bold">R$ {projectedMRR.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ARR</span>
                  <span className="font-bold text-green-500">
                    R$ {(projectedMRR * 12 / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
              
              <Button 
                className="w-full mt-3 h-8 text-xs" 
                size="sm"
                variant={goal.recommended ? "default" : "outline"}
                disabled={isLoading}
              >
                Selecionar
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
