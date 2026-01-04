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

interface StatsParams {
  startDate?: Date | null;
  endDate?: Date;
}

export function useTutorialViewsStats(params?: StatsParams) {
  return useQuery({
    queryKey: ['tutorial-views', 'stats', params?.startDate?.toISOString(), params?.endDate?.toISOString()],
    queryFn: async () => {
      // Construir query com filtros de data
      let query = supabase
        .from('tutorial_views')
        .select(`
          *,
          tutorials:tutorial_id (title, category_id)
        `)
        .order('viewed_at', { ascending: false });
      
      // Aplicar filtros de data se fornecidos
      if (params?.startDate) {
        query = query.gte('viewed_at', params.startDate.toISOString());
      }
      if (params?.endDate) {
        query = query.lte('viewed_at', params.endDate.toISOString());
      }
      
      const { data: views, error } = await query;
      
      if (error) throw error;
      
      // Buscar perfis separadamente para evitar problemas de RLS
      const userIds = [...new Set(views?.map(v => v.user_id) || [])];
      let profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = { full_name: p.full_name, email: p.email };
          return acc;
        }, {} as Record<string, { full_name: string | null; email: string | null }>);
      }
      
      // Enriquecer views com dados de perfis
      const enrichedViews = views?.map(v => ({
        ...v,
        profiles: profileMap[v.user_id] || null
      })) || [];
      
      // Calcular estatísticas
      const totalViews = enrichedViews.length;
      const uniqueUsers = new Set(enrichedViews.map(v => v.user_id)).size;
      const completedViews = enrichedViews.filter(v => v.completed).length;
      const completionRate = totalViews > 0 ? Math.round((completedViews / totalViews) * 100) : 0;
      
      // Agrupar por tutorial
      const viewsByTutorial: Record<string, { count: number; completed: number; title: string }> = {};
      enrichedViews.forEach(view => {
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
      
      // Agrupar por data para o gráfico
      const viewsByDateMap: Record<string, { date: string; views: number; completed: number }> = {};
      enrichedViews.forEach(view => {
        const date = view.viewed_at.split('T')[0]; // yyyy-MM-dd
        if (!viewsByDateMap[date]) {
          viewsByDateMap[date] = { date, views: 0, completed: 0 };
        }
        viewsByDateMap[date].views++;
        if (view.completed) {
          viewsByDateMap[date].completed++;
        }
      });
      
      const viewsByDate = Object.values(viewsByDateMap).sort((a, b) => 
        a.date.localeCompare(b.date)
      );
      
      return {
        totalViews,
        uniqueUsers,
        completedViews,
        completionRate,
        viewsByTutorial,
        viewsByDate,
        recentViews: enrichedViews.slice(0, 50)
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
