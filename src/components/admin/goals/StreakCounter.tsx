import { Card, CardContent } from '@/components/ui/card';
import { Flame } from 'lucide-react';

interface StreakCounterProps {
  streak: number;
}

export const StreakCounter = ({ streak }: StreakCounterProps) => {
  const getStreakMessage = () => {
    if (streak === 0) return 'Comece sua sequência hoje!';
    if (streak === 1) return 'Primeiro dia! Continue assim!';
    if (streak < 7) return 'Você está criando um hábito!';
    if (streak < 30) return 'Sequência impressionante!';
    return 'LENDÁRIO! Você é imparável!';
  };

  const getFlameColor = () => {
    if (streak === 0) return 'text-muted-foreground';
    if (streak < 7) return 'text-orange-500';
    if (streak < 30) return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`${getFlameColor()} transition-colors`}>
            <Flame className="h-12 w-12" fill="currentColor" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{streak}</span>
              <span className="text-lg text-muted-foreground">
                {streak === 1 ? 'dia' : 'dias'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {getStreakMessage()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
