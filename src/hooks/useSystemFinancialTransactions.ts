import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FinancialTransaction } from '@/hooks/useFinancialTransactions';
import type { FinancialCategory } from '@/hooks/useFinancialCategories';

export interface SystemTransactionFilters {
  type?: 'income' | 'expense';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  origin?: 'all' | 'manual' | 'auto';
}

export type SystemFinancialTransaction = FinancialTransaction & {
  is_auto: boolean;
  source_type: string | null;
  source_id: string | null;
  source_paid_at: string | null;
};

export interface CreateSystemTransactionParams {
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  notes?: string;
  transaction_date?: string;
  payment_method?: string;
  reference_number?: string;
  vendor?: string;
}

export interface UpdateSystemTransactionParams {
  id: string;
  category_id?: string;
  type?: 'income' | 'expense';
  amount?: number;
  description?: string;
  notes?: string;
  transaction_date?: string;
  payment_method?: string;
  reference_number?: string;
  vendor?: string;
}

type SystemTransactionRow = {
  id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  notes: string | null;
  transaction_date: string;
  payment_method: string | null;
  reference_number: string | null;
  vendor: string | null;
  is_auto: boolean;
  source_type: string | null;
  source_id: string | null;
  source_paid_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    type: 'income' | 'expense';
    color: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  } | null;
};

function toFinancialTransaction(row: SystemTransactionRow): SystemFinancialTransaction {
  const category: FinancialCategory | undefined = row.category
    ? {
        id: row.category.id,
        store_id: null,
        name: row.category.name,
        type: row.category.type,
        icon: 'CircleDollarSign',
        color: row.category.color ?? '#64748b',
        description: row.category.description,
        is_system: false,
        is_active: row.category.is_active,
        display_order: 0,
        created_at: row.category.created_at,
        updated_at: row.category.updated_at,
      }
    : undefined;

  return {
    id: row.id,
    store_id: '',
    category_id: row.category_id,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    notes: row.notes,
    transaction_date: row.transaction_date,
    payment_method: row.payment_method,
    reference_number: row.reference_number,
    order_id: null,
    is_recurring: false,
    recurrence_type: null,
    attachment_url: null,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category,
    is_auto: row.is_auto,
    source_type: row.source_type,
    source_id: row.source_id,
    source_paid_at: row.source_paid_at,
  };
}

export function useSystemFinancialTransactions(filters?: SystemTransactionFilters, limit: number = 50) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['system-financial-transactions', filters, limit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('system-finance-transactions', {
        body: { action: 'list', filters, limit },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao carregar transações');
      return (data.transactions || []) as SystemTransactionRow[];
    },
  });

  const transactions = (data || []).map(toFinancialTransaction);

  const createMutation = useMutation({
    mutationFn: async (params: CreateSystemTransactionParams) => {
      const { data, error } = await supabase.functions.invoke('system-finance-transactions', {
        body: { action: 'create', ...params },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao criar transação');
      return data.transaction as SystemTransactionRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['system-financial-summary'] });
      toast.success('Transação criada!');
    },
    onError: (err: Error) => {
      console.error(err);
      toast.error(err.message || 'Erro ao criar transação');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: UpdateSystemTransactionParams) => {
      const { id, ...updates } = params;
      const { data, error } = await supabase.functions.invoke('system-finance-transactions', {
        body: { action: 'update', id, ...updates },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao atualizar transação');
      return data.transaction as SystemTransactionRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['system-financial-summary'] });
      toast.success('Transação atualizada!');
    },
    onError: (err: Error) => {
      console.error(err);
      toast.error(err.message || 'Erro ao atualizar transação');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('system-finance-transactions', {
        body: { action: 'delete', id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao excluir transação');
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['system-financial-summary'] });
      toast.success('Transação excluída!');
    },
    onError: (err: Error) => {
      console.error(err);
      toast.error(err.message || 'Erro ao excluir transação');
    },
  });

  return {
    transactions,
    isLoading,
    error,
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
