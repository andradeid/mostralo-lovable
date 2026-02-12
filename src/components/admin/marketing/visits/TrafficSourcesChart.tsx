import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe } from "lucide-react";

interface TrafficSourcesChartProps {
  data: { name: string; value: number }[];
  loading?: boolean;
}

export function TrafficSourcesChart({ data, loading }: TrafficSourcesChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const max = sorted.length > 0 ? sorted[0].value : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Origem do Tráfego</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">Carregando...</div>
        ) : sorted.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">Nenhum dado</div>
        ) : (
          <ScrollArea className="h-[350px]">
            <div className="space-y-3 pr-3">
              {sorted.map((item, i) => {
                const widthPct = Math.max((item.value / max) * 100, 2);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm truncate">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums shrink-0 ml-2">{item.value}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/40">
                      <div
                        className="h-2 rounded-full bg-[#f97316] transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
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
