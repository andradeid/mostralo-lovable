import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCounterProps {
  streak: number;
}

export const StreakCounter = ({ streak }: StreakCounterProps) => {
  const getStreakMessage = () => {
    if (streak === 0) return 'Comece hoje!';
    if (streak === 1) return 'Primeiro dia!';
    if (streak < 7) return 'Criando hábito!';
    if (streak < 30) return 'Impressionante!';
    return 'LENDÁRIO!';
  };

  const getFlameColor = () => {
    if (streak === 0) return 'text-muted-foreground';
    if (streak < 7) return 'text-orange-500';
    if (streak < 30) return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5 p-4">
      <div className="flex items-center gap-3">
        <Flame className={cn("h-8 w-8", getFlameColor())} fill="currentColor" />
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black">{streak}</span>
            <span className="text-sm text-muted-foreground">
              {streak === 1 ? 'dia' : 'dias'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{getStreakMessage()}</p>
        </div>
      </div>
    </div>
  );
};
