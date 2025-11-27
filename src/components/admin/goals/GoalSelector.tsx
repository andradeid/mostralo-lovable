import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Zap, Rocket } from 'lucide-react';

interface GoalOption {
  type: 'conservative' | 'realistic' | 'aggressive' | 'ultra';
  label: string;
  description: string;
  storesPerMonth: number;
  icon: React.ReactNode;
  color: string;
  badgeColor: string;
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
      description: 'Crescimento estável e seguro',
      storesPerMonth: 2,
      icon: <Target className="h-6 w-6" />,
      color: 'from-blue-500/20 to-blue-600/20',
      badgeColor: 'bg-blue-500'
    },
    {
      type: 'realistic',
      label: 'Realista',
      description: 'Meta recomendada e sustentável',
      storesPerMonth: 5,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'from-green-500/20 to-green-600/20',
      badgeColor: 'bg-green-500'
    },
    {
      type: 'aggressive',
      label: 'Agressiva',
      description: 'Crescimento acelerado',
      storesPerMonth: 10,
      icon: <Zap className="h-6 w-6" />,
      color: 'from-orange-500/20 to-orange-600/20',
      badgeColor: 'bg-orange-500'
    },
    {
      type: 'ultra',
      label: 'Ultra Agressiva',
      description: 'Crescimento explosivo',
      storesPerMonth: 20,
      icon: <Rocket className="h-6 w-6" />,
      color: 'from-red-500/20 to-red-600/20',
      badgeColor: 'bg-red-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Defina Sua Meta</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const projectedMRR = goal.storesPerMonth * avgPlanPrice;
            
            return (
              <div
                key={goal.type}
                className={`p-6 rounded-lg border-2 bg-gradient-to-br ${goal.color} hover:border-primary/50 transition-all cursor-pointer`}
                onClick={() => onSelectGoal(goal.type, goal.storesPerMonth, projectedMRR)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-background">
                    {goal.icon}
                  </div>
                  <Badge className={goal.badgeColor}>
                    {goal.label}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{goal.storesPerMonth} lojas/mês</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {goal.description}
                </p>
                
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">MRR projetado:</span>
                    <span className="font-bold">
                      R$ {projectedMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ARR projetado:</span>
                    <span className="font-bold text-green-600">
                      R$ {(projectedMRR * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  disabled={isLoading}
                >
                  Selecionar Meta
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
