import { AnalysisKPIs } from "@/hooks/useConversationAnalysis";
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
  const cards = [
    {
      title: 'Conversas Analisadas',
      value: kpis.totalAnalisadas,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      format: 'number'
    },
    {
      title: 'Com Intenção de Compra',
      value: kpis.comIntencao,
      icon: Target,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      format: 'number'
    },
    {
      title: 'Com Fechamento',
      value: kpis.comFechamento,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      format: 'number'
    },
    {
      title: 'Vendas Fora do Sistema',
      value: kpis.vendasForaDoSistema,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      format: 'number'
    },
    {
      title: 'Faturamento Estimado',
      value: kpis.faturamentoEstimado,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      format: 'currency'
    },
    {
      title: 'Faturamento Invisível',
      value: kpis.faturamentoInvisivel,
      icon: EyeOff,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      format: 'currency'
    },
    {
      title: 'Pendentes de Análise',
      value: kpis.pendentes,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      format: 'number'
    },
    {
      title: 'Taxa de Fechamento',
      value: kpis.taxaFechamento,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      format: 'percent'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-md transition-shadow">
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
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
