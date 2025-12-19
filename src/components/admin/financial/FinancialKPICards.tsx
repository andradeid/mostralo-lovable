import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialKPICardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  isLoading?: boolean;
}

export function FinancialKPICards({ 
  totalIncome, 
  totalExpense, 
  balance,
  isLoading 
}: FinancialKPICardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const cards = [
    {
      title: 'Receitas',
      value: totalIncome,
      icon: TrendingUp,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-500',
      valueColor: 'text-green-500',
      trend: ArrowUpRight,
    },
    {
      title: 'Despesas',
      value: totalExpense,
      icon: TrendingDown,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      valueColor: 'text-red-500',
      trend: ArrowDownRight,
    },
    {
      title: 'Saldo',
      value: balance,
      icon: Wallet,
      iconBg: balance >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10',
      iconColor: balance >= 0 ? 'text-blue-500' : 'text-orange-500',
      valueColor: balance >= 0 ? 'text-blue-500' : 'text-orange-500',
      trend: balance >= 0 ? ArrowUpRight : ArrowDownRight,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-20 mb-4" />
              <div className="h-8 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className={cn("text-2xl font-bold", card.valueColor)}>
                  {formatCurrency(card.value)}
                </p>
              </div>
              <div className={cn("p-3 rounded-full", card.iconBg)}>
                <card.icon className={cn("h-6 w-6", card.iconColor)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
