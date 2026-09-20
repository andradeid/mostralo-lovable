import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemMonthlyData {
  key: string;
  month: string;
  income: number;
  expense: number;
  balance: number;
  incomeSubscriptions: number;
  incomeExternal: number;
  incomeOther: number;
  productBalance: number;
}

export interface SystemFinancialSummary {
  range: { startDate: string; endDate: string };
  totalIncome: number;
  totalExpense: number;
  balance: number;
  subscriptionsIncome: number;
  externalIncome: number;
  otherIncome: number;
  productBalance: number;
  monthlyData: SystemMonthlyData[];
}

export interface SystemSummaryRange {
  startDate?: string;
  endDate?: string;
}

export function useSystemFinancialSummary(months: number = 6, range?: SystemSummaryRange) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['system-financial-summary', months, range?.startDate, range?.endDate],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('system-finance-summary', {
        body: {
          action: 'summary',
          months,
          startDate: range?.startDate,
          endDate: range?.endDate,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao carregar resumo');
      return data.summary as SystemFinancialSummary;
    },
  });

  return {
    summary: data,
    totalIncome: data?.totalIncome ?? 0,
    totalExpense: data?.totalExpense ?? 0,
    balance: data?.balance ?? 0,
    subscriptionsIncome: data?.subscriptionsIncome ?? 0,
    externalIncome: data?.externalIncome ?? 0,
    otherIncome: data?.otherIncome ?? 0,
    productBalance: data?.productBalance ?? 0,
    monthlyData: data?.monthlyData ?? [],
    isLoading,
    error,
    refetch,
  };
}
