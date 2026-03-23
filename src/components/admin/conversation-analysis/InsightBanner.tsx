import type { AnalysisKPIs } from "@/hooks/useConversationAnalysis";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface InsightBannerProps {
  kpis: AnalysisKPIs;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function InsightBanner({ kpis }: InsightBannerProps) {
  if (kpis.totalAnalisadas === 0) return null;

  const lines: string[] = [];

  if (kpis.comIntencao > 0) {
    const naoConvertidas = kpis.comIntencao - kpis.comFechamento;
    if (naoConvertidas > 0) {
      lines.push(
        `Você teve ${kpis.comIntencao} conversa${kpis.comIntencao > 1 ? 's' : ''} com intenção de compra, mas apenas ${kpis.comFechamento} ${kpis.comFechamento === 1 ? 'foi convertida' : 'foram convertidas'}.`
      );
    } else {
      lines.push(
        `Todas as ${kpis.comIntencao} conversas com intenção de compra foram convertidas. Excelente!`
      );
    }
  }

  if (kpis.faturamentoInvisivel > 0) {
    lines.push(
      `${formatCurrency(kpis.faturamentoInvisivel)} foram vendidos fora do sistema e não estão registrados.`
    );
  }

  if (kpis.pendentes > 0) {
    lines.push(
      `Ainda há ${kpis.pendentes} conversa${kpis.pendentes > 1 ? 's' : ''} aguardando análise.`
    );
  }

  if (lines.length === 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900 shrink-0 self-start">
            <Lightbulb className="h-4 w-4 text-amber-600" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
              Insight Comercial
            </p>
            {lines.map((line, i) => (
              <p key={i} className="text-sm text-foreground/80">{line}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
