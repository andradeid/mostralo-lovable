import { AnalysisKPIs as KPIs } from "@/hooks/useConversationAnalysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip } from "recharts";

interface AnalysisFunnelProps {
  kpis: KPIs;
}

export function AnalysisFunnel({ kpis }: AnalysisFunnelProps) {
  const data = [
    { name: 'Conversas', value: kpis.totalAnalisadas, fill: 'hsl(var(--primary))' },
    { name: 'Intenção', value: kpis.comIntencao, fill: 'hsl(45, 93%, 47%)' },
    { name: 'Fechamento', value: kpis.comFechamento, fill: 'hsl(142, 71%, 45%)' },
  ];

  if (kpis.totalAnalisadas === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Funil de Vendas</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          Sem dados para exibir
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = kpis.totalAnalisadas > 0 ? (item.value / kpis.totalAnalisadas) * 100 : 0;
            const widthPercent = Math.max(percentage, 10);
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{item.value} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-muted rounded-full h-8 flex items-center">
                  <div 
                    className="h-full rounded-full transition-all duration-500 flex items-center justify-center text-xs font-medium text-white"
                    style={{ width: `${widthPercent}%`, backgroundColor: item.fill, minWidth: '40px' }}
                  >
                    {item.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
