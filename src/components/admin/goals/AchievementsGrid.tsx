import { Badge } from '@/components/ui/badge';
import { Lock, Trophy } from 'lucide-react';
import { achievementsList } from '@/utils/motivationalMessages';
import type { Achievement } from '@/hooks/useAdminGoals';
import { cn } from '@/lib/utils';

interface AchievementsGridProps {
  unlockedAchievements: Achievement[];
}

export const AchievementsGrid = ({ unlockedAchievements }: AchievementsGridProps) => {
  const isUnlocked = (achievementId: string) => {
    return unlockedAchievements.some(a => a.achievement_type === achievementId);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Conquistas</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {unlockedAchievements.length}/{achievementsList.length}
        </span>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {achievementsList.map((achievement) => {
          const unlocked = isUnlocked(achievement.id);
          
          return (
            <div
              key={achievement.id}
              className={cn(
                "rounded-lg border p-3 text-center transition-all",
                unlocked
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : "border-transparent bg-muted/30 opacity-40 grayscale"
              )}
            >
              <div className="text-2xl mb-1">
                {unlocked ? achievement.icon : <Lock className="h-5 w-5 mx-auto text-muted-foreground" />}
              </div>
              <h3 className="font-bold text-[11px] leading-tight mb-0.5">{achievement.name}</h3>
              <p className="text-[10px] text-muted-foreground leading-tight">{achievement.description}</p>
              {unlocked && (
                <Badge className="mt-1.5 bg-yellow-500 text-[9px] h-4 px-1.5">✓</Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
