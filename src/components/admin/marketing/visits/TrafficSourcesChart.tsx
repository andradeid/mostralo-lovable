import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, ExternalLink } from "lucide-react";

interface TrafficSourcesChartProps {
  data: { name: string; value: number }[];
  loading?: boolean;
}

export function TrafficSourcesChart({ data, loading }: TrafficSourcesChartProps) {
  // Ordenar por número de visitas (decrescente)
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Origem do Tráfego</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">Carregando...</div>
        ) : sorted.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">Nenhum dado</div>
        ) : (
          <ScrollArea className="h-[300px] pr-2">
            <ul className="space-y-1">
              {sorted.map((item, i) => {
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                      <span className="font-semibold tabular-nums w-10 text-right">{item.value}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
