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

  // Buscar contagem de lojas ativas criadas no mês atual
  const { data: monthlyStoresCount, isLoading: loadingMonthlyStores } = useQuery({
    queryKey: ['admin-monthly-stores-count'],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      
      const { count, error } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);
        
      if (error) throw error;
      return count || 0;
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

  // Calcular progresso do mês atual (usando contagem real de lojas)
  const getCurrentMonthProgress = () => {
    if (!activeGoal) return { percentage: 0, metToday: false, totalStores: 0, targetStores: 0 };

    const totalStores = monthlyStoresCount || 0;
    const targetStores = activeGoal.target_stores_per_month;
    const percentage = (totalStores / targetStores) * 100;

    // Verificar se a meta de hoje foi atingida (baseado no progresso diário esperado)
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const expectedStores = Math.floor((targetStores / daysInMonth) * currentDay);
    const metToday = totalStores >= expectedStores;

    return {
      percentage: Math.min(percentage, 100),
      metToday,
      totalStores,
      targetStores
    };
  };

  return {
    activeGoal,
    progress,
    achievements,
    isLoading: loadingGoal || loadingProgress || loadingAchievements || loadingMonthlyStores,
    setGoal: setGoalMutation.mutate,
    isSettingGoal: setGoalMutation.isPending,
    streak: calculateStreak(),
    currentMonthProgress: getCurrentMonthProgress()
  };
};
