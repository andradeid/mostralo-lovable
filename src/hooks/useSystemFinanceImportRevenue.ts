import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImportRevenueParams {
  /** YYYY-MM-DD — importa apenas pagamentos a partir desta data */
  since?: string;
  dryRun?: boolean;
}

export interface ImportRevenueResult {
  dryRun: boolean;
  since: string | null;
  found: {
    subscription_invoices: number;
    external_invoices: number;
  };
  toCreate: number;
  created: number;
  skipped: number;
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
          `Simulação: ${data.toCreate} lançamento(s) seriam criados · ${data.skipped} já existiam`
        );
      } else {
        toast.success(
          `${data.created} lançamento(s) importados · ${data.skipped} já existiam`
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
