import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemMonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export function useSystemFinancialSummary(months: number = 6) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['system-financial-summary', months],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('system-finance-summary', {
        body: { action: 'summary', months },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao carregar resumo');
      return data.summary as {
        totalIncome: number;
        totalExpense: number;
        balance: number;
        monthlyData: SystemMonthlyData[];
      };
    },
  });

  return {
    summary: data,
    totalIncome: data?.totalIncome ?? 0,
    totalExpense: data?.totalExpense ?? 0,
    balance: data?.balance ?? 0,
    monthlyData: data?.monthlyData ?? [],
    isLoading,
    error,
    refetch,
  };
}
