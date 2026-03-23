import type { AnalysisKPIs } from "@/hooks/useConversationAnalysis";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageSquare, Target, ShoppingCart, AlertTriangle, 
  DollarSign, EyeOff, Clock, TrendingUp 
} from "lucide-react";

interface AnalysisKPIsProps {
  kpis: AnalysisKPIs;
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function AnalysisKPIs({ kpis, isLoading }: AnalysisKPIsProps) {
  const impactPercent = kpis.faturamentoEstimado > 0 
    ? ((kpis.faturamentoInvisivel / kpis.faturamentoEstimado) * 100).toFixed(0)
    : '0';

  const cards = [
    {
      title: 'Conversas Analisadas',
      value: kpis.totalAnalisadas,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      format: 'number' as const,
      highlight: false,
    },
    {
      title: 'Com Intenção de Compra',
      value: kpis.comIntencao,
      icon: Target,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      format: 'number' as const,
      highlight: false,
    },
    {
      title: 'Com Fechamento',
      value: kpis.comFechamento,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      format: 'number' as const,
      highlight: false,
    },
    {
      title: 'Vendas Não Registradas',
      subtitle: 'Vendas fora do sistema',
      value: kpis.vendasForaDoSistema,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      format: 'number' as const,
      highlight: false,
    },
    {
      title: 'Faturamento Estimado',
      value: kpis.faturamentoEstimado,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      format: 'currency' as const,
      highlight: false,
    },
    {
      title: 'Faturamento Invisível',
      subtitle: 'Valor vendido não registrado no sistema',
      value: kpis.faturamentoInvisivel,
      icon: EyeOff,
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      format: 'currency' as const,
      highlight: true,
      impactLabel: kpis.faturamentoInvisivel > 0 ? `${impactPercent}% do total` : undefined,
    },
    {
      title: 'Pendentes de Análise',
      value: kpis.pendentes,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      format: 'number' as const,
      highlight: false,
    },
    {
      title: 'Taxa de Conversão',
      subtitle: `${kpis.comFechamento} de ${kpis.comIntencao} com intenção`,
      value: kpis.taxaFechamento,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      format: 'percent' as const,
      highlight: false,
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card 
          key={card.title} 
          className={`hover:shadow-md transition-shadow ${
            card.highlight 
              ? 'ring-2 ring-red-200 dark:ring-red-800 bg-red-50/50 dark:bg-red-950/20' 
              : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">{card.title}</p>
                <p className={`text-lg font-bold ${card.color}`}>
                  {isLoading ? '...' : 
                    card.format === 'currency' ? formatCurrency(card.value) :
                    card.format === 'percent' ? `${card.value.toFixed(1)}%` :
                    card.value
                  }
                </p>
                {card.subtitle && (
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                    {card.subtitle}
                  </p>
                )}
                {card.impactLabel && (
                  <p className="text-[10px] font-semibold text-red-600 mt-0.5">
                    ⚠ {card.impactLabel}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
