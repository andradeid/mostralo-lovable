import { Badge } from '@/components/ui/badge';
import { Lock, Trophy } from 'lucide-react';
import { achievementsList } from '@/utils/motivationalMessages';
import type { Achievement } from '@/hooks/useAdminGoals';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AchievementsGridProps {
  unlockedAchievements: Achievement[];
}

export const AchievementsGrid = ({ unlockedAchievements }: AchievementsGridProps) => {
  const [showAll, setShowAll] = useState(false);

  const isUnlocked = (achievementId: string) => {
    return unlockedAchievements.some(a => a.achievement_type === achievementId);
  };

  // Sort: unlocked first, then locked
  const sorted = [...achievementsList].sort((a, b) => {
    const aU = isUnlocked(a.id) ? 0 : 1;
    const bU = isUnlocked(b.id) ? 0 : 1;
    return aU - bU;
  });

  const visible = showAll ? sorted : sorted.slice(0, 6);

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-xs font-semibold">Conquistas</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {unlockedAchievements.length}/{achievementsList.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {visible.map((achievement) => {
          const unlocked = isUnlocked(achievement.id);
          
          return (
            <div
              key={achievement.id}
              className={cn(
                "rounded-md p-2 text-center transition-all",
                unlocked
                  ? "bg-yellow-500/10 border border-yellow-500/20"
                  : "bg-muted/20 opacity-30 grayscale"
              )}
              title={achievement.description}
            >
              <div className="text-lg leading-none mb-0.5">
                {unlocked ? achievement.icon : <Lock className="h-3.5 w-3.5 mx-auto text-muted-foreground" />}
              </div>
              <p className="text-[9px] font-medium leading-tight truncate">{achievement.name}</p>
            </div>
          );
        })}
      </div>

      {achievementsList.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors pt-1"
        >
          {showAll ? 'Ver menos' : `Ver todas (${achievementsList.length})`}
        </button>
      )}
    </div>
  );
};
