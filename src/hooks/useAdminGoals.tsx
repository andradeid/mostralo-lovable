import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminGoal {
  id: string;
  admin_id: string;
  goal_type: 'conservative' | 'realistic' | 'aggressive' | 'ultra';
  target_stores_per_month: number;
  target_mrr: number;
  started_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  id: string;
  admin_id: string;
  goal_id: string;
  date: string;
  new_stores_count: number;
  current_mrr: number;
  target_mrr: number;
  progress_percentage: number;
  is_goal_met: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  admin_id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string;
  unlocked_at: string;
  metadata: Record<string, any>;
  created_at: string;
}

export const useAdminGoals = () => {
  const queryClient = useQueryClient();

  // Buscar meta ativa
  const { data: activeGoal, isLoading: loadingGoal } = useQuery({
    queryKey: ['admin-active-goal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_goals')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AdminGoal | null;
    }
  });

  // Buscar progresso
  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ['admin-goals-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_goals_progress')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as GoalProgress[];
    }
  });

  // Buscar conquistas
  const { data: achievements, isLoading: loadingAchievements } = useQuery({
    queryKey: ['admin-achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_achievements')
        .select('*')
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data as Achievement[];
    }
  });

  // Criar/Atualizar meta
  const setGoalMutation = useMutation({
    mutationFn: async (params: {
      goal_type: 'conservative' | 'realistic' | 'aggressive' | 'ultra';
      target_stores_per_month: number;
      target_mrr: number;
    }) => {
      // Desativar meta anterior
      if (activeGoal) {
        await supabase
          .from('admin_goals')
          .update({ is_active: false })
          .eq('id', activeGoal.id);
      }

      // Criar nova meta
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('admin_goals')
        .insert({
          admin_id: user.user.id,
          goal_type: params.goal_type,
          target_stores_per_month: params.target_stores_per_month,
          target_mrr: params.target_mrr,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-active-goal'] });
      toast.success('Meta definida com sucesso! Agora é hora de conquistar! 🚀');
    },
    onError: (error) => {
      console.error('Erro ao definir meta:', error);
      toast.error('Erro ao definir meta');
    }
  });

  // Calcular streak (dias consecutivos)
  const calculateStreak = () => {
    if (!progress || progress.length === 0) return 0;

    let streak = 0;
    const sortedProgress = [...progress].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (let i = 0; i < sortedProgress.length; i++) {
      if (sortedProgress[i].is_goal_met) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  // Calcular progresso do mês atual
  const getCurrentMonthProgress = () => {
    if (!progress || !activeGoal) return { percentage: 0, metToday: false };

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthProgress = progress.filter(p => {
      const date = new Date(p.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    if (monthProgress.length === 0) return { percentage: 0, metToday: false };

    const totalStores = monthProgress.reduce((sum, p) => sum + p.new_stores_count, 0);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const targetStores = activeGoal.target_stores_per_month;
    const percentage = (totalStores / targetStores) * 100;

    const todayProgress = monthProgress.find(p => {
      const date = new Date(p.date);
      return date.toDateString() === today.toDateString();
    });

    return {
      percentage: Math.min(percentage, 100),
      metToday: todayProgress?.is_goal_met || false,
      totalStores,
      targetStores
    };
  };

  return {
    activeGoal,
    progress,
    achievements,
    isLoading: loadingGoal || loadingProgress || loadingAchievements,
    setGoal: setGoalMutation.mutate,
    isSettingGoal: setGoalMutation.isPending,
    streak: calculateStreak(),
    currentMonthProgress: getCurrentMonthProgress()
  };
};
