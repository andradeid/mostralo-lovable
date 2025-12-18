import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DiagnosticResult } from '@/hooks/usePerformanceDiagnostics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DiagnosticHistoryProps {
  history: DiagnosticResult[];
}

export function DiagnosticHistory({ history }: DiagnosticHistoryProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500 bg-green-500/10';
    if (score >= 70) return 'text-yellow-500 bg-yellow-500/10';
    if (score >= 50) return 'text-orange-500 bg-orange-500/10';
    return 'text-red-500 bg-red-500/10';
  };
  
  const getTrend = (current: number, previous: number | undefined) => {
    if (previous === undefined) return null;
    const diff = current - previous;
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-500', value: `+${diff}` };
    if (diff < 0) return { icon: TrendingDown, color: 'text-red-500', value: `${diff}` };
    return { icon: Minus, color: 'text-muted-foreground', value: '0' };
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Histórico
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum diagnóstico anterior
          </p>
        ) : (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-2">
              {history.map((item, index) => {
                const trend = getTrend(item.overallScore, history[index + 1]?.overallScore);
                
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {format(item.timestamp, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.serverInfo.region !== 'unknown' 
                          ? `Região: ${item.serverInfo.region}` 
                          : `TTFB: ${item.server.ttfb}ms`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {trend && (
                        <div className={`flex items-center gap-0.5 text-xs ${trend.color}`}>
                          <trend.icon className="h-3 w-3" />
                          <span>{trend.value}</span>
                        </div>
                      )}
                      <span className={`font-mono text-sm font-medium px-2 py-0.5 rounded ${getScoreColor(item.overallScore)}`}>
                        {item.overallScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
