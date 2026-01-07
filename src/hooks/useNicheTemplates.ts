import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NicheTemplate {
  id: string;
  name: string;
  niche_id: string | null;
  description: string | null;
  module_ids: string[];
  is_default: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  niche?: {
    id: string;
    name: string;
    icon: string | null;
  };
}

export interface CreateTemplateData {
  name: string;
  niche_id: string;
  description?: string;
  module_ids: string[];
  is_default?: boolean;
}

export function useNicheTemplates() {
  return useQuery({
    queryKey: ['niche-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('niche_module_templates')
        .select(`
          *,
          niche:niches(id, name, icon)
        `)
        .order('name');
      
      if (error) throw error;
      return data as NicheTemplate[];
    }
  });
}

export function useCreateNicheTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Se marcou como padrão, desmarcar outros do mesmo nicho
      if (data.is_default) {
        await supabase
          .from('niche_module_templates')
          .update({ is_default: false })
          .eq('niche_id', data.niche_id);
      }

      const { data: result, error } = await supabase
        .from('niche_module_templates')
        .insert({
          ...data,
          created_by: user.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niche-templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
    }
  });
}

export function useUpdateNicheTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTemplateData> }) => {
      // Se marcou como padrão, desmarcar outros do mesmo nicho
      if (data.is_default && data.niche_id) {
        await supabase
          .from('niche_module_templates')
          .update({ is_default: false })
          .eq('niche_id', data.niche_id)
          .neq('id', id);
      }

      const { data: result, error } = await supabase
        .from('niche_module_templates')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niche-templates'] });
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
    }
  });
}

export function useDeleteNicheTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('niche_module_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niche-templates'] });
      toast.success('Template excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    }
  });
}
