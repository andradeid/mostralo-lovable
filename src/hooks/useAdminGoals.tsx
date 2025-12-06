import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

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

// Definição das conquistas disponíveis
const ACHIEVEMENTS_CONFIG = {
  first_goal: {
    name: 'Primeira Meta',
    description: 'Definiu sua primeira meta de crescimento',
    icon: '🎯'
  },
  streak_7: {
    name: 'Consistência',
    description: '7 dias consecutivos batendo a meta',
    icon: '🔥'
  },
  goal_100: {
    name: 'Meta Batida',
    description: 'Atingiu 100% da meta mensal',
    icon: '🏆'
  },
  stores_10: {
    name: '10 Lojas',
    description: 'Alcançou 10 lojas ativas',
    icon: '🏪'
  },
  stores_50: {
    name: '50 Lojas',
    description: 'Alcançou 50 lojas ativas',
    icon: '🏢'
  },
  stores_100: {
    name: '100 Lojas',
    description: 'Alcançou 100 lojas ativas',
    icon: '🌟'
  },
  mrr_10k: {
    name: 'MRR 10K',
    description: 'Atingiu R$ 10.000 de MRR',
    icon: '💰'
  },
  mrr_50k: {
    name: 'MRR 50K',
    description: 'Atingiu R$ 50.000 de MRR',
    icon: '💎'
  },
  mrr_100k: {
    name: 'MRR 100K',
    description: 'Atingiu R$ 100.000 de MRR',
    icon: '👑'
  }
};

export const useAdminGoals = () => {
  const queryClient = useQueryClient();
  const hasCheckedAchievements = useRef(false);

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

  // Buscar total de lojas ativas (para conquistas)
  const { data: totalActiveStores, isLoading: loadingTotalStores } = useQuery({
    queryKey: ['total-active-stores'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
        
      if (error) throw error;
      return count || 0;
    }
  });

  // Buscar MRR atual (para conquistas)
  const { data: currentMrr, isLoading: loadingMrr } = useQuery({
    queryKey: ['current-mrr-for-achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          id,
          custom_monthly_price,
          plan_id,
          plans:plan_id (price)
        `)
        .eq('status', 'active');
        
      if (error) throw error;
      
      // Calcular MRR: custom_monthly_price ou plan price
      const mrr = (data || []).reduce((sum, store) => {
        const price = store.custom_monthly_price || (store.plans as any)?.price || 0;
        return sum + price;
      }, 0);
      
      return mrr;
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
      queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
      toast.success('Meta definida com sucesso! Agora é hora de conquistar! 🚀');
    },
    onError: (error) => {
      console.error('Erro ao definir meta:', error);
      toast.error('Erro ao definir meta');
    }
  });

  // Função para verificar e desbloquear conquistas
  const checkAndUnlockAchievements = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const unlockedTypes = achievements?.map(a => a.achievement_type) || [];
      const toUnlock: string[] = [];

      // first_goal: definiu primeira meta
      if (activeGoal && !unlockedTypes.includes('first_goal')) {
        toUnlock.push('first_goal');
      }

      // streak_7: 7 dias consecutivos
      const currentStreak = calculateStreak();
      if (currentStreak >= 7 && !unlockedTypes.includes('streak_7')) {
        toUnlock.push('streak_7');
      }

      // goal_100: 100% da meta mensal
      const monthProgress = getCurrentMonthProgress();
      if (monthProgress.percentage >= 100 && !unlockedTypes.includes('goal_100')) {
        toUnlock.push('goal_100');
      }

      // stores_10, stores_50, stores_100
      if (totalActiveStores && totalActiveStores >= 10 && !unlockedTypes.includes('stores_10')) {
        toUnlock.push('stores_10');
      }
      if (totalActiveStores && totalActiveStores >= 50 && !unlockedTypes.includes('stores_50')) {
        toUnlock.push('stores_50');
      }
      if (totalActiveStores && totalActiveStores >= 100 && !unlockedTypes.includes('stores_100')) {
        toUnlock.push('stores_100');
      }

      // mrr_10k, mrr_50k, mrr_100k
      if (currentMrr && currentMrr >= 10000 && !unlockedTypes.includes('mrr_10k')) {
        toUnlock.push('mrr_10k');
      }
      if (currentMrr && currentMrr >= 50000 && !unlockedTypes.includes('mrr_50k')) {
        toUnlock.push('mrr_50k');
      }
      if (currentMrr && currentMrr >= 100000 && !unlockedTypes.includes('mrr_100k')) {
        toUnlock.push('mrr_100k');
      }

      // Inserir conquistas desbloqueadas
      for (const achievementType of toUnlock) {
        const config = ACHIEVEMENTS_CONFIG[achievementType as keyof typeof ACHIEVEMENTS_CONFIG];
        if (!config) continue;

        const { error } = await supabase
          .from('admin_achievements')
          .insert({
            admin_id: user.user.id,
            achievement_type: achievementType,
            achievement_name: config.name,
            achievement_description: config.description,
            metadata: { icon: config.icon }
          });

        if (!error) {
          toast.success(`${config.icon} Nova conquista: ${config.name}!`, {
            description: config.description,
            duration: 5000
          });
        }
      }

      // Invalidar cache se houve desbloqueios
      if (toUnlock.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['admin-achievements'] });
      }
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
    }
  };

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

  // Verificar conquistas automaticamente quando dados carregam
  useEffect(() => {
    const isLoading = loadingGoal || loadingAchievements || loadingTotalStores || loadingMrr;
    
    if (!isLoading && !hasCheckedAchievements.current) {
      hasCheckedAchievements.current = true;
      checkAndUnlockAchievements();
    }
  }, [loadingGoal, loadingAchievements, loadingTotalStores, loadingMrr, activeGoal, achievements, totalActiveStores, currentMrr]);

  // Re-verificar quando meta muda
  useEffect(() => {
    if (activeGoal && hasCheckedAchievements.current) {
      checkAndUnlockAchievements();
    }
  }, [activeGoal?.id]);

  return {
    activeGoal,
    progress,
    achievements,
    totalActiveStores,
    currentMrr,
    isLoading: loadingGoal || loadingProgress || loadingAchievements || loadingMonthlyStores || loadingTotalStores || loadingMrr,
    setGoal: setGoalMutation.mutate,
    isSettingGoal: setGoalMutation.isPending,
    streak: calculateStreak(),
    currentMonthProgress: getCurrentMonthProgress(),
    checkAndUnlockAchievements
  };
};
