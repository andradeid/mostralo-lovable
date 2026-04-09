import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyMotivationBanner } from '@/components/admin/goals/DailyMotivationBanner';
import { GoalProgressCard } from '@/components/admin/goals/GoalProgressCard';
import { StreakCounter } from '@/components/admin/goals/StreakCounter';
import { GoalSelector } from '@/components/admin/goals/GoalSelector';
import { ProjectedRewards } from '@/components/admin/goals/ProjectedRewards';
import { AchievementsGrid } from '@/components/admin/goals/AchievementsGrid';
import { DailyTasksChecklist } from '@/components/admin/goals/DailyTasksChecklist';
import { useAdminGoals } from '@/hooks/useAdminGoals';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GoalsPage() {
  const { 
    activeGoal, 
    achievements, 
    isLoading, 
    setGoal, 
    isSettingGoal,
    streak,
    currentMonthProgress 
  } = useAdminGoals();

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data: stores } = await supabase
        .from('stores')
        .select('id, status, subscription_expires_at')
        .eq('status', 'active');

      const { data: subscriptions } = await supabase
        .from('payment_approvals')
        .select('payment_amount, plan_id')
        .eq('status', 'approved');

      const currentActiveStores = stores?.length || 0;
      const totalRevenue = subscriptions?.reduce((sum, s) => sum + s.payment_amount, 0) || 0;
      const avgPlanPrice = currentActiveStores > 0 ? totalRevenue / currentActiveStores : 349;

      return { currentActiveStores, avgPlanPrice };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();

  const handleSelectGoal = (
    type: 'conservative' | 'realistic' | 'aggressive' | 'ultra',
    storesPerMonth: number,
    targetMRR: number
  ) => {
    setGoal({
      goal_type: type,
      target_stores_per_month: storesPerMonth,
      target_mrr: targetMRR
    });
  };

  return (
    <div className="space-y-4 p-4 md:p-6 w-full">
      {/* Header compact */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🎯 Metas e Disciplina</h1>
      </div>

      <Tabs defaultValue="disciplina" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="disciplina">📋 Disciplina</TabsTrigger>
          <TabsTrigger value="metas">🎯 Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="disciplina" className="mt-4">
          <DailyTasksChecklist />
        </TabsContent>

        <TabsContent value="metas" className="mt-4">
          {!activeGoal ? (
            <div className="space-y-4">
              <DailyMotivationBanner progress={0} streak={0} />
              <GoalSelector
                avgPlanPrice={dashboardData?.avgPlanPrice || 349}
                onSelectGoal={handleSelectGoal}
                isLoading={isSettingGoal}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Row 1: Hero performance + Streak */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
                <GoalProgressCard
                  goalType={activeGoal.goal_type}
                  targetStoresPerMonth={activeGoal.target_stores_per_month}
                  currentStores={currentMonthProgress.totalStores || 0}
                  targetStores={currentMonthProgress.targetStores || activeGoal.target_stores_per_month}
                  progressPercentage={currentMonthProgress.percentage}
                  daysInMonth={daysInMonth}
                  currentDay={currentDay}
                />
                <div className="space-y-3">
                  <StreakCounter streak={streak} />
                  <DailyMotivationBanner 
                    progress={currentMonthProgress.percentage} 
                    streak={streak} 
                  />
                </div>
              </div>

              {/* Row 2: Projections */}
              <ProjectedRewards
                targetStoresPerMonth={activeGoal.target_stores_per_month}
                avgPlanPrice={dashboardData?.avgPlanPrice || 349}
                currentActiveStores={dashboardData?.currentActiveStores || 0}
              />

              {/* Row 3: Achievements */}
              <AchievementsGrid 
                unlockedAchievements={achievements || []} 
              />

              {/* Row 4: Change goal */}
              <GoalSelector
                avgPlanPrice={dashboardData?.avgPlanPrice || 349}
                onSelectGoal={handleSelectGoal}
                isLoading={isSettingGoal}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
