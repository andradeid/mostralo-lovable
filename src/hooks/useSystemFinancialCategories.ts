import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FinancialCategory } from '@/hooks/useFinancialCategories';

export interface SystemFinancialCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSystemCategoryParams {
  name: string;
  type: 'income' | 'expense';
  color?: string;
  description?: string;
}

export interface UpdateSystemCategoryParams {
  id: string;
  name?: string;
  type?: 'income' | 'expense';
  color?: string | null;
  description?: string | null;
}

function toFinancialCategory(cat: SystemFinancialCategory): FinancialCategory {
  return {
    id: cat.id,
    store_id: null,
    name: cat.name,
    type: cat.type,
    icon: 'CircleDollarSign',
    color: cat.color ?? '#64748b',
    description: cat.description,
    is_system: false,
    is_active: cat.is_active,
    display_order: 0,
    created_at: cat.created_at,
    updated_at: cat.updated_at,
  };
}

export function useSystemFinancialCategories() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['system-financial-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('system-finance-categories', {
        body: { action: 'list' },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao carregar categorias');
      return (data.categories || []) as SystemFinancialCategory[];
    },
  });

  const categories = (data || []).map(toFinancialCategory);
  const incomeCategories = categories.filter((c) => c.type === 'income' && c.is_active);
  const expenseCategories = categories.filter((c) => c.type === 'expense' && c.is_active);

  const createMutation = useMutation({
    mutationFn: async (params: CreateSystemCategoryParams) => {
      const { data, error } = await supabase.functions.invoke('system-finance-categories', {
        body: { action: 'create', ...params },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao criar categoria');
      return data.category as SystemFinancialCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-financial-categories'] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (err: Error) => {
      console.error(err);
      toast.error(err.message || 'Erro ao criar categoria');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: UpdateSystemCategoryParams) => {
      const { id, ...updates } = params;
      const { data, error } = await supabase.functions.invoke('system-finance-categories', {
        body: { action: 'update', id, ...updates },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao atualizar categoria');
      return data.category as SystemFinancialCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-financial-categories'] });
      toast.success('Categoria atualizada!');
    },
    onError: (err: Error) => {
      console.error(err);
      toast.error(err.message || 'Erro ao atualizar categoria');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('system-finance-categories', {
        body: { action: 'delete', id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao remover categoria');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-financial-categories'] });
      toast.success('Categoria removida!');
    },
    onError: (err: Error) => {
      console.error(err);
      toast.error(err.message || 'Erro ao remover categoria');
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
