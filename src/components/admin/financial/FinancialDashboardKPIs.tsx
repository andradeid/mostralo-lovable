import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Receipt, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface FinancialDashboardKPIsProps {
  revenueToday: number;
  revenueMonth: number;
  expenseMonth: number;
  profit: number;
  avgTicket: number;
  growthPercent: number | null;
  isLoading?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function FinancialDashboardKPIs({
  revenueToday,
  revenueMonth,
  expenseMonth,
  profit,
  avgTicket,
  growthPercent,
  isLoading,
}: FinancialDashboardKPIsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-7 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Receita hoje',
      value: formatCurrency(revenueToday),
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Receita do mês',
      value: formatCurrency(revenueMonth),
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Despesas do mês',
      value: formatCurrency(expenseMonth),
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Lucro',
      value: formatCurrency(profit),
      icon: Wallet,
      color: profit >= 0 ? 'text-blue-500' : 'text-red-500',
      bg: profit >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10',
    },
    {
      label: 'Ticket médio',
      value: formatCurrency(avgTicket),
      icon: Receipt,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Crescimento',
      value: growthPercent !== null ? `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}%` : '—',
      icon: BarChart3,
      color: (growthPercent ?? 0) >= 0 ? 'text-green-500' : 'text-red-500',
      bg: (growthPercent ?? 0) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      badge: growthPercent !== null ? (growthPercent >= 0 ? ArrowUpRight : ArrowDownRight) : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground truncate">{card.label}</p>
              <div className={cn('p-1.5 rounded-full', card.bg)}>
                <card.icon className={cn('h-3.5 w-3.5', card.color)} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <p className={cn('text-lg font-bold leading-none', card.color)}>
                {card.value}
              </p>
              {card.badge && (
                <card.badge className={cn('h-3.5 w-3.5', card.color)} />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
