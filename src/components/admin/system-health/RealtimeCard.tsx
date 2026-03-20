import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio } from "lucide-react";
import type { RealtimeData } from "@/hooks/useSystemHealth";

interface Props {
  data: RealtimeData | null;
  isLoading: boolean;
}

export function RealtimeCard({ data, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Realtime
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-20 bg-muted animate-pulse rounded" />
        ) : data ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="text-4xl font-bold">{data.activeSubscriptions}</div>
            <div className="text-sm text-muted-foreground mt-1">Canais ativos</div>
            <div className="mt-3 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
              {data.activeSubscriptions <= 5
                ? "✅ Uso normal"
                : data.activeSubscriptions <= 15
                  ? "⚠️ Monitorar"
                  : "🔴 Atenção — muitos canais"}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
        )}
      </CardContent>
    </Card>
  );
}
