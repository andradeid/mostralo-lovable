import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SystemFinanceImportSourceType =
  | 'subscription_invoices'
  | 'external_invoices'
  | 'payment_approvals';

export interface ImportRevenueParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  dryRun?: boolean;
}

export interface ImportRevenueResult {
  dryRun: boolean;
  range: { startDate: string; endDate: string };
  found: Record<SystemFinanceImportSourceType, number>;
  approvalsSkippedDueToInvoices: number;
  preparedTransactions: number;
  inserted: number;
  skippedOrExisting: number;
}

export function useSystemFinanceImportRevenue() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: ImportRevenueParams) => {
      const { data, error } = await supabase.functions.invoke('system-finance-import-revenue', {
        body: { action: 'import', ...params },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao importar receitas');
      return data as { success: true } & ImportRevenueResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['system-financial-summary'] });

      if (data.dryRun) {
        toast.success(
          `Simulação: ${data.preparedTransactions} lançamentos preparados (${data.range.startDate} → ${data.range.endDate})`
        );
      } else {
        toast.success(
          `Importação: ${data.inserted} lançamentos importados (${data.range.startDate} → ${data.range.endDate})`
        );
      }
    },
    onError: (err: Error) => {
      console.error(err);
      toast.error(err.message || 'Erro ao importar receitas');
    },
  });

  return {
    importRevenue: mutation.mutate,
    importRevenueAsync: mutation.mutateAsync,
    isImporting: mutation.isPending,
    lastResult: mutation.data,
    error: mutation.error,
  };
}
