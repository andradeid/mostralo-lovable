import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface TutorialView {
  id: string;
  tutorial_id: string;
  user_id: string;
  store_id: string | null;
  watch_time_seconds: number;
  completed: boolean;
  viewed_at: string;
  updated_at: string;
}

export interface TutorialViewWithDetails extends TutorialView {
  tutorials?: {
    title: string;
    category_id: string;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
  stores?: {
    name: string;
  };
}

export function useMyTutorialViews() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['tutorial-views', 'my', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('tutorial_views')
        .select('*')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false });
      
      if (error) throw error;
      return data as TutorialView[];
    },
    enabled: !!user?.id
  });
}

export function useTutorialViewsStats() {
  return useQuery({
    queryKey: ['tutorial-views', 'stats'],
    queryFn: async () => {
      // Buscar visualizações com detalhes
      const { data: views, error } = await supabase
        .from('tutorial_views')
        .select(`
          *,
          tutorials:tutorial_id (title, category_id),
          profiles:user_id (full_name, email)
        `)
        .order('viewed_at', { ascending: false });
      
      if (error) throw error;
      
      // Calcular estatísticas
      const totalViews = views?.length || 0;
      const uniqueUsers = new Set(views?.map(v => v.user_id)).size;
      const completedViews = views?.filter(v => v.completed).length || 0;
      const completionRate = totalViews > 0 ? Math.round((completedViews / totalViews) * 100) : 0;
      
      // Agrupar por tutorial
      const viewsByTutorial: Record<string, { count: number; completed: number; title: string }> = {};
      views?.forEach(view => {
        const tutorialId = view.tutorial_id;
        if (!viewsByTutorial[tutorialId]) {
          viewsByTutorial[tutorialId] = {
            count: 0,
            completed: 0,
            title: (view as any).tutorials?.title || 'Desconhecido'
          };
        }
        viewsByTutorial[tutorialId].count++;
        if (view.completed) {
          viewsByTutorial[tutorialId].completed++;
        }
      });
      
      return {
        totalViews,
        uniqueUsers,
        completedViews,
        completionRate,
        viewsByTutorial,
        recentViews: views?.slice(0, 50) || []
      };
    }
  });
}

export function useRecordTutorialView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      tutorialId, 
      watchTimeSeconds = 0, 
      completed = false,
      storeId
    }: { 
      tutorialId: string; 
      watchTimeSeconds?: number; 
      completed?: boolean;
      storeId?: string;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Upsert - atualiza se já existe, insere se não
      const { data, error } = await supabase
        .from('tutorial_views')
        .upsert({
          tutorial_id: tutorialId,
          user_id: user.id,
          store_id: storeId || null,
          watch_time_seconds: watchTimeSeconds,
          completed,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'tutorial_id,user_id'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorial-views'] });
    }
  });
}
