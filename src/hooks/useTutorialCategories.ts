import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TutorialCategory {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  featured_video_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TutorialCategoryInput {
  name: string;
  description?: string | null;
  cover_image_url?: string | null;
  featured_video_url?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export function useTutorialCategories(includeInactive = false) {
  return useQuery({
    queryKey: ['tutorial-categories', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('tutorial_categories')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as TutorialCategory[];
    }
  });
}

export function useCreateTutorialCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: TutorialCategoryInput) => {
      const { data, error } = await supabase
        .from('tutorial_categories')
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorial-categories'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria');
    }
  });
}

export function useUpdateTutorialCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TutorialCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('tutorial_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorial-categories'] });
      toast.success('Categoria atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar categoria:', error);
      toast.error('Erro ao atualizar categoria');
    }
  });
}

export function useDeleteTutorialCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tutorial_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorial-categories'] });
      toast.success('Categoria excluída!');
    },
    onError: (error) => {
      console.error('Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria. Verifique se não há tutoriais vinculados.');
    }
  });
}
