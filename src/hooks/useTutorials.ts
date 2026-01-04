import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Tutorial {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  duration_minutes: number;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TutorialInput {
  category_id: string;
  title: string;
  description?: string | null;
  youtube_url: string;
  thumbnail_url?: string | null;
  duration_minutes?: number;
  display_order?: number;
  is_featured?: boolean;
  is_active?: boolean;
}

export function useTutorials(categoryId?: string, includeInactive = false) {
  return useQuery({
    queryKey: ['tutorials', categoryId, includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('tutorials')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Tutorial[];
    }
  });
}

export function useFeaturedTutorials() {
  return useQuery({
    queryKey: ['tutorials', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Tutorial[];
    }
  });
}

export function useCreateTutorial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tutorial: TutorialInput) => {
      const { data, error } = await supabase
        .from('tutorials')
        .insert(tutorial)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      toast.success('Tutorial criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar tutorial:', error);
      toast.error('Erro ao criar tutorial');
    }
  });
}

export function useUpdateTutorial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tutorial> & { id: string }) => {
      const { data, error } = await supabase
        .from('tutorials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      toast.success('Tutorial atualizado!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar tutorial:', error);
      toast.error('Erro ao atualizar tutorial');
    }
  });
}

export function useDeleteTutorial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tutorials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] });
      toast.success('Tutorial excluído!');
    },
    onError: (error) => {
      console.error('Erro ao excluir tutorial:', error);
      toast.error('Erro ao excluir tutorial');
    }
  });
}
