import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FinancialCategory } from './useFinancialCategories';

export interface FinancialTransaction {
  id: string;
  store_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  notes: string | null;
  transaction_date: string;
  payment_method: string | null;
  reference_number: string | null;
  order_id: string | null;
  is_recurring: boolean;
  recurrence_type: string | null;
  attachment_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: FinancialCategory;
}

export interface TransactionFilters {
  type?: 'income' | 'expense';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  search?: string;
}

export interface CreateTransactionParams {
  store_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  notes?: string;
  transaction_date?: string;
  payment_method?: string;
  reference_number?: string;
  is_recurring?: boolean;
  recurrence_type?: string;
  attachment_url?: string;
}

export interface UpdateTransactionParams {
  id: string;
  category_id?: string;
  type?: 'income' | 'expense';
  amount?: number;
  description?: string;
  notes?: string;
  transaction_date?: string;
  payment_method?: string;
  reference_number?: string;
  is_recurring?: boolean;
  recurrence_type?: string;
  attachment_url?: string;
}

export function useFinancialTransactions(
  storeId: string | null,
  filters?: TransactionFilters,
  limit: number = 50
) {
  const queryClient = useQueryClient();

  // Buscar transações com filtros
  const { data: transactions, isLoading, error, refetch } = useQuery({
    queryKey: ['financial-transactions', storeId, filters, limit],
    queryFn: async () => {
      if (!storeId) return [];

      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          category:financial_categories(*)
        `)
        .eq('store_id', storeId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      // Aplicar filtros
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.startDate) {
        query = query.gte('transaction_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('transaction_date', filters.endDate);
      }
      if (filters?.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }
      if (filters?.search) {
        query = query.ilike('description', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FinancialTransaction[];
    },
    enabled: !!storeId,
  });

  // Criar transação
  const createMutation = useMutation({
    mutationFn: async (params: CreateTransactionParams) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          ...params,
          created_by: user.user?.id,
        })
        .select(`
          *,
          category:financial_categories(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions', storeId] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary', storeId] });
      toast.success('Transação registrada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar transação:', error);
      toast.error('Erro ao registrar transação');
    },
  });

  // Atualizar transação
  const updateMutation = useMutation({
    mutationFn: async (params: UpdateTransactionParams) => {
      const { id, ...updates } = params;
      const { data, error } = await supabase
        .from('financial_transactions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:financial_categories(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions', storeId] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary', storeId] });
      toast.success('Transação atualizada!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar transação:', error);
      toast.error('Erro ao atualizar transação');
    },
  });

  // Deletar transação
  const deleteMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions', storeId] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary', storeId] });
      toast.success('Transação removida!');
    },
    onError: (error: Error) => {
      console.error('Erro ao remover transação:', error);
      toast.error('Erro ao remover transação');
    },
  });

  return {
    transactions,
    isLoading,
    error,
    refetch,
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
