import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeByCategory: { categoryId: string; categoryName: string; total: number; color: string }[];
  expenseByCategory: { categoryId: string; categoryName: string; total: number; color: string }[];
  monthlyData: { month: string; income: number; expense: number; balance: number }[];
}

export interface SummaryFilters {
  startDate?: string;
  endDate?: string;
}

export function useFinancialSummary(storeId: string | null, filters?: SummaryFilters) {
  // Período padrão: mês atual
  const defaultStartDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const defaultEndDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const startDate = filters?.startDate || defaultStartDate;
  const endDate = filters?.endDate || defaultEndDate;

  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['financial-summary', storeId, startDate, endDate],
    queryFn: async (): Promise<FinancialSummary> => {
      if (!storeId) {
        return {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          incomeByCategory: [],
          expenseByCategory: [],
          monthlyData: [],
        };
      }

      // Buscar todas as transações do período
      const { data: transactions, error: txError } = await supabase
        .from('financial_transactions')
        .select(`
          id,
          type,
          amount,
          category_id,
          transaction_date,
          category:financial_categories(id, name, color)
        `)
        .eq('store_id', storeId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (txError) throw txError;

      // Calcular totais
      let totalIncome = 0;
      let totalExpense = 0;
      const incomeMap = new Map<string, { categoryId: string; categoryName: string; total: number; color: string }>();
      const expenseMap = new Map<string, { categoryId: string; categoryName: string; total: number; color: string }>();

      (transactions || []).forEach(tx => {
        const amount = Number(tx.amount);
        const category = tx.category as { id: string; name: string; color: string } | null;
        const categoryId = tx.category_id;
        const categoryName = category?.name || 'Sem categoria';
        const categoryColor = category?.color || '#6366f1';

        if (tx.type === 'income') {
          totalIncome += amount;
          const existing = incomeMap.get(categoryId) || { categoryId, categoryName, total: 0, color: categoryColor };
          existing.total += amount;
          incomeMap.set(categoryId, existing);
        } else {
          totalExpense += amount;
          const existing = expenseMap.get(categoryId) || { categoryId, categoryName, total: 0, color: categoryColor };
          existing.total += amount;
          expenseMap.set(categoryId, existing);
        }
      });

      // Buscar dados mensais dos últimos 6 meses
      const monthlyData: { month: string; income: number; expense: number; balance: number }[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');
        const monthLabel = format(monthDate, 'MMM/yy');

        const { data: monthTx } = await supabase
          .from('financial_transactions')
          .select('type, amount')
          .eq('store_id', storeId)
          .gte('transaction_date', monthStart)
          .lte('transaction_date', monthEnd);

        let monthIncome = 0;
        let monthExpense = 0;

        (monthTx || []).forEach(tx => {
          if (tx.type === 'income') {
            monthIncome += Number(tx.amount);
          } else {
            monthExpense += Number(tx.amount);
          }
        });

        monthlyData.push({
          month: monthLabel,
          income: monthIncome,
          expense: monthExpense,
          balance: monthIncome - monthExpense,
        });
      }

      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        incomeByCategory: Array.from(incomeMap.values()).sort((a, b) => b.total - a.total),
        expenseByCategory: Array.from(expenseMap.values()).sort((a, b) => b.total - a.total),
        monthlyData,
      };
    },
    enabled: !!storeId,
  });

  return {
    summary,
    isLoading,
    error,
    refetch,
    totalIncome: summary?.totalIncome || 0,
    totalExpense: summary?.totalExpense || 0,
    balance: summary?.balance || 0,
    incomeByCategory: summary?.incomeByCategory || [],
    expenseByCategory: summary?.expenseByCategory || [],
    monthlyData: summary?.monthlyData || [],
  };
}
