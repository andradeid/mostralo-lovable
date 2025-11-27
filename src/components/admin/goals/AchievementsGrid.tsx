import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import { achievementsList } from '@/utils/motivationalMessages';
import type { Achievement } from '@/hooks/useAdminGoals';

interface AchievementsGridProps {
  unlockedAchievements: Achievement[];
}

export const AchievementsGrid = ({ unlockedAchievements }: AchievementsGridProps) => {
  const isUnlocked = (achievementId: string) => {
    return unlockedAchievements.some(a => a.achievement_type === achievementId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Conquistas
          <Badge variant="secondary">
            {unlockedAchievements.length}/{achievementsList.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {achievementsList.map((achievement) => {
            const unlocked = isUnlocked(achievement.id);
            
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  unlocked
                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50'
                    : 'bg-muted/50 border-muted opacity-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2 relative">
                    {unlocked ? achievement.icon : <Lock className="h-8 w-8 mx-auto text-muted-foreground" />}
                  </div>
                  <h3 className="font-bold text-sm mb-1">
                    {achievement.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                  </p>
                  {unlocked && (
                    <Badge className="mt-2 bg-yellow-500 text-xs">
                      Desbloqueado!
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
