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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🎯 Sistema de Metas e Disciplina</h1>
        <p className="text-muted-foreground">
          Defina suas metas, controle sua disciplina diária e conquiste seus objetivos!
        </p>
      </div>

      <Tabs defaultValue="disciplina" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="disciplina">📋 Disciplina Diária</TabsTrigger>
          <TabsTrigger value="metas">🎯 Metas Mensais</TabsTrigger>
        </TabsList>

        <TabsContent value="disciplina" className="space-y-6 mt-6">
          <DailyTasksChecklist />
        </TabsContent>

        <TabsContent value="metas" className="space-y-6 mt-6">
          {!activeGoal ? (
            <div className="space-y-6">
              <DailyMotivationBanner progress={0} streak={0} />
              <GoalSelector
                avgPlanPrice={dashboardData?.avgPlanPrice || 349}
                onSelectGoal={handleSelectGoal}
                isLoading={isSettingGoal}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <DailyMotivationBanner 
                progress={currentMonthProgress.percentage} 
                streak={streak} 
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <GoalProgressCard
                    goalType={activeGoal.goal_type}
                    targetStoresPerMonth={activeGoal.target_stores_per_month}
                    currentStores={currentMonthProgress.totalStores || 0}
                    targetStores={currentMonthProgress.targetStores || activeGoal.target_stores_per_month}
                    progressPercentage={currentMonthProgress.percentage}
                    daysInMonth={daysInMonth}
                    currentDay={currentDay}
                  />
                </div>
                
                <div>
                  <StreakCounter streak={streak} />
                </div>
              </div>

              <ProjectedRewards
                targetStoresPerMonth={activeGoal.target_stores_per_month}
                avgPlanPrice={dashboardData?.avgPlanPrice || 349}
                currentActiveStores={dashboardData?.currentActiveStores || 0}
              />

              <AchievementsGrid 
                unlockedAchievements={achievements || []} 
              />

              <div className="mt-8">
                <GoalSelector
                  avgPlanPrice={dashboardData?.avgPlanPrice || 349}
                  onSelectGoal={handleSelectGoal}
                  isLoading={isSettingGoal}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
