import type { AnalysisKPIs } from "@/hooks/useConversationAnalysis";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  MessageSquare, Target, ShoppingCart, AlertTriangle, 
  DollarSign, EyeOff, Clock, TrendingUp, Info
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
      tooltip: 'Total de conversas do WhatsApp que já foram processadas e analisadas pela IA.',
    },
    {
      title: 'Com Intenção de Compra',
      value: kpis.comIntencao,
      icon: Target,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      format: 'number' as const,
      highlight: false,
      tooltip: 'Conversas onde o cliente demonstrou interesse em comprar: pediu produto, perguntou preço ou solicitou disponibilidade.',
    },
    {
      title: 'Com Fechamento',
      value: kpis.comFechamento,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      format: 'number' as const,
      highlight: false,
      tooltip: 'Conversas onde foi identificada uma venda concluída: cliente confirmou pedido, informou endereço ou confirmou pagamento.',
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
      tooltip: 'Vendas que foram fechadas diretamente no WhatsApp sem passar pelo sistema de pedidos da loja.',
    },
    {
      title: 'Faturamento Estimado',
      value: kpis.faturamentoEstimado,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      format: 'currency' as const,
      highlight: false,
      tooltip: 'Soma dos valores estimados de todas as vendas identificadas, independente de terem sido registradas no sistema ou não.',
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
      tooltip: 'Valor total das vendas fechadas no WhatsApp que NÃO foram registradas no sistema. Esse dinheiro entrou mas não aparece nos relatórios.',
    },
    {
      title: 'Pendentes de Análise',
      value: kpis.pendentes,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      format: 'number' as const,
      highlight: false,
      tooltip: 'Conversas que ainda não foram processadas pela IA. Clique em "Processar conversas" para analisá-las.',
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
      tooltip: 'Percentual de conversas com intenção de compra que resultaram em venda. Calculado: fechamentos ÷ conversas com intenção.',
    }
  ];

  return (
    <TooltipProvider delayDuration={300}>
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
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground truncate">{card.title}</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground/60 shrink-0 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px] text-xs">
                        {card.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  </div>
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
    </TooltipProvider>
  );
}