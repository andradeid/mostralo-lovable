import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialInsightsProps {
  totalIncome: number;
  totalExpense: number;
  growthPercent: number | null;
  incomeByCategory: { categoryName: string; total: number }[];
  transactionCount: number;
}

export function FinancialInsights({
  totalIncome,
  totalExpense,
  growthPercent,
  incomeByCategory,
  transactionCount,
}: FinancialInsightsProps) {
  const insights: { text: string; icon: React.ElementType; type: 'success' | 'warning' | 'info' }[] = [];

  // Insight: canal dominante
  if (incomeByCategory.length > 0 && totalIncome > 0) {
    const top = incomeByCategory[0];
    const pct = ((top.total / totalIncome) * 100).toFixed(0);
    if (Number(pct) >= 70) {
      insights.push({
        text: `${top.categoryName} representa ${pct}% da sua receita`,
        icon: TrendingUp,
        type: 'info',
      });
    }
  }

  // Insight: sem despesas
  if (totalExpense === 0 && totalIncome > 0) {
    insights.push({
      text: 'Nenhuma despesa registrada neste período',
      icon: CheckCircle2,
      type: 'success',
    });
  }

  // Insight: crescimento
  if (growthPercent !== null) {
    if (growthPercent > 0) {
      insights.push({
        text: `Seu faturamento cresceu ${growthPercent.toFixed(0)}% em relação ao período anterior`,
        icon: TrendingUp,
        type: 'success',
      });
    } else if (growthPercent < -10) {
      insights.push({
        text: `Seu faturamento caiu ${Math.abs(growthPercent).toFixed(0)}% em relação ao período anterior`,
        icon: TrendingDown,
        type: 'warning',
      });
    }
  }

  // Insight: despesas altas
  if (totalExpense > 0 && totalIncome > 0 && totalExpense / totalIncome > 0.7) {
    insights.push({
      text: `Despesas representam ${((totalExpense / totalIncome) * 100).toFixed(0)}% da sua receita — atenção ao fluxo de caixa`,
      icon: AlertCircle,
      type: 'warning',
    });
  }

  // Insight: poucas transações
  if (transactionCount === 0) {
    insights.push({
      text: 'Nenhuma transação registrada neste período',
      icon: AlertCircle,
      type: 'warning',
    });
  }

  if (insights.length === 0) return null;

  const typeStyles = {
    success: 'border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400',
    warning: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400',
    info: 'border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400',
  };

  return (
    <Card>
      <CardHeader className="pb-3 p-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Insights financeiros
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {insights.slice(0, 3).map((insight, idx) => (
            <div
              key={idx}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border text-sm',
                typeStyles[insight.type]
              )}
            >
              <insight.icon className="h-4 w-4 flex-shrink-0" />
              <span>{insight.text}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
