import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FinancialCategory {
  id: string;
  store_id: string | null;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryParams {
  store_id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  description?: string;
}

export interface UpdateCategoryParams {
  id: string;
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}

export function useFinancialCategories(storeId: string | null) {
  const queryClient = useQueryClient();

  // Buscar todas as categorias (sistema + loja)
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['financial-categories', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .or(`is_system.eq.true,store_id.eq.${storeId}`)
        .eq('is_active', true)
        .order('type')
        .order('display_order')
        .order('name');

      if (error) throw error;
      return data as FinancialCategory[];
    },
    enabled: !!storeId,
  });

  // Categorias separadas por tipo
  const incomeCategories = categories?.filter(c => c.type === 'income') || [];
  const expenseCategories = categories?.filter(c => c.type === 'expense') || [];

  // Criar categoria personalizada
  const createMutation = useMutation({
    mutationFn: async (params: CreateCategoryParams) => {
      const { data, error } = await supabase
        .from('financial_categories')
        .insert({
          store_id: params.store_id,
          name: params.name,
          type: params.type,
          icon: params.icon || 'CircleDollarSign',
          color: params.color || '#6366f1',
          description: params.description,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories', storeId] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar categoria:', error);
      toast.error('Erro ao criar categoria');
    },
  });

  // Atualizar categoria
  const updateMutation = useMutation({
    mutationFn: async (params: UpdateCategoryParams) => {
      const { id, ...updates } = params;
      const { data, error } = await supabase
        .from('financial_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories', storeId] });
      toast.success('Categoria atualizada!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar categoria:', error);
      toast.error('Erro ao atualizar categoria');
    },
  });

  // Deletar categoria (apenas personalizadas)
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('financial_categories')
        .delete()
        .eq('id', categoryId)
        .eq('is_system', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories', storeId] });
      toast.success('Categoria removida!');
    },
    onError: (error: Error) => {
      console.error('Erro ao remover categoria:', error);
      toast.error('Não foi possível remover a categoria. Verifique se não há transações vinculadas.');
    },
  });

  return {
    categories,
    incomeCategories,
    expenseCategories,
    isLoading,
    error,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
