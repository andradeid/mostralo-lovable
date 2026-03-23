import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, subMonths, subDays, startOfDay, endOfDay } from 'date-fns';
import type { FinancialPeriod } from '@/components/admin/financial/FinancialPeriodSelector';

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeByCategory: { categoryId: string; categoryName: string; total: number; color: string }[];
  expenseByCategory: { categoryId: string; categoryName: string; total: number; color: string }[];
  monthlyData: { month: string; income: number; expense: number; balance: number }[];
  revenueToday: number;
  avgTicket: number;
  growthPercent: number | null;
  transactionCount: number;
  prevPeriodIncome: number;
}

export interface SummaryFilters {
  startDate?: string;
  endDate?: string;
}

function getDateRange(period: FinancialPeriod): { startDate: string; endDate: string } {
  const now = new Date();
  switch (period) {
    case 'today':
      return {
        startDate: format(startOfDay(now), 'yyyy-MM-dd'),
        endDate: format(endOfDay(now), 'yyyy-MM-dd'),
      };
    case '7d':
      return {
        startDate: format(subDays(now, 6), 'yyyy-MM-dd'),
        endDate: format(now, 'yyyy-MM-dd'),
      };
    case '30d':
      return {
        startDate: format(subDays(now, 29), 'yyyy-MM-dd'),
        endDate: format(now, 'yyyy-MM-dd'),
      };
    case 'month':
    default:
      return {
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
  }
}

function getPrevDateRange(period: FinancialPeriod): { startDate: string; endDate: string } {
  const now = new Date();
  switch (period) {
    case 'today':
      const yesterday = subDays(now, 1);
      return {
        startDate: format(startOfDay(yesterday), 'yyyy-MM-dd'),
        endDate: format(endOfDay(yesterday), 'yyyy-MM-dd'),
      };
    case '7d':
      return {
        startDate: format(subDays(now, 13), 'yyyy-MM-dd'),
        endDate: format(subDays(now, 7), 'yyyy-MM-dd'),
      };
    case '30d':
      return {
        startDate: format(subDays(now, 59), 'yyyy-MM-dd'),
        endDate: format(subDays(now, 30), 'yyyy-MM-dd'),
      };
    case 'month':
    default:
      const prevMonth = subMonths(now, 1);
      return {
        startDate: format(startOfMonth(prevMonth), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(prevMonth), 'yyyy-MM-dd'),
      };
  }
}

export function useFinancialSummary(
  storeId: string | null,
  filters?: SummaryFilters,
  moduleEnabled: boolean = true,
  period: FinancialPeriod = 'month'
) {
  const range = getDateRange(period);
  const startDate = filters?.startDate || range.startDate;
  const endDate = filters?.endDate || range.endDate;

  const prevRange = getPrevDateRange(period);

  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['financial-summary', storeId, startDate, endDate, period],
    queryFn: async (): Promise<FinancialSummary> => {
      if (!storeId) {
        return {
          totalIncome: 0, totalExpense: 0, balance: 0,
          incomeByCategory: [], expenseByCategory: [],
          monthlyData: [], revenueToday: 0, avgTicket: 0,
          growthPercent: null, transactionCount: 0, prevPeriodIncome: 0,
        };
      }

      // Fetch current period transactions
      const { data: transactions, error: txError } = await supabase
        .from('financial_transactions')
        .select(`id, type, amount, category_id, transaction_date, category:financial_categories(id, name, color)`)
        .eq('store_id', storeId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (txError) throw txError;

      // Fetch previous period for growth calculation
      const { data: prevTransactions } = await supabase
        .from('financial_transactions')
        .select('type, amount')
        .eq('store_id', storeId)
        .eq('type', 'income')
        .gte('transaction_date', prevRange.startDate)
        .lte('transaction_date', prevRange.endDate);

      const prevPeriodIncome = (prevTransactions || []).reduce((sum, tx) => sum + Number(tx.amount), 0);

      // Fetch today's revenue
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: todayTx } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('store_id', storeId)
        .eq('type', 'income')
        .eq('transaction_date', today);

      const revenueToday = (todayTx || []).reduce((sum, tx) => sum + Number(tx.amount), 0);

      // Calculate totals
      let totalIncome = 0;
      let totalExpense = 0;
      let incomeCount = 0;
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
          incomeCount += 1;
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

      const avgTicket = incomeCount > 0 ? totalIncome / incomeCount : 0;
      const growthPercent = prevPeriodIncome > 0
        ? ((totalIncome - prevPeriodIncome) / prevPeriodIncome) * 100
        : totalIncome > 0 ? 100 : null;

      // Monthly data for chart (last 6 months)
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
          if (tx.type === 'income') monthIncome += Number(tx.amount);
          else monthExpense += Number(tx.amount);
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
        revenueToday,
        avgTicket,
        growthPercent,
        transactionCount: (transactions || []).length,
        prevPeriodIncome,
      };
    },
    enabled: !!storeId && moduleEnabled,
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
    revenueToday: summary?.revenueToday || 0,
    avgTicket: summary?.avgTicket || 0,
    growthPercent: summary?.growthPercent ?? null,
    transactionCount: summary?.transactionCount || 0,
  };
}
