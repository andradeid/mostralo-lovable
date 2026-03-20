import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plug } from "lucide-react";
import type { ConnectionsData } from "@/hooks/useSystemHealth";

interface Props {
  data: ConnectionsData | null;
  isLoading: boolean;
}

export function ConnectionsCard({ data, isLoading }: Props) {
  const usagePercent = data ? Math.round((data.total / data.max) * 100) : 0;

  const getStatusColor = () => {
    if (!data) return "text-muted-foreground";
    if (usagePercent <= 50) return "text-green-500";
    if (usagePercent <= 75) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = () => {
    if (usagePercent <= 50) return "bg-green-500";
    if (usagePercent <= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Conexões
          </CardTitle>
          <span className={`text-sm font-mono font-bold ${getStatusColor()}`}>
            {isLoading ? "..." : data ? `${data.total}/${data.max}` : "N/A"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-2 bg-muted animate-pulse rounded" />
            <div className="h-16 bg-muted animate-pulse rounded" />
          </div>
        ) : data ? (
          <>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uso do pool</span>
                <span>{usagePercent}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor()}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-green-500/10">
                <div className="text-lg font-bold text-green-500">{data.active}</div>
                <div className="text-[10px] text-muted-foreground">Ativas</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <div className="text-lg font-bold text-blue-500">{data.idle}</div>
                <div className="text-[10px] text-muted-foreground">Idle</div>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <div className="text-lg font-bold">{data.total - data.active - data.idle}</div>
                <div className="text-[10px] text-muted-foreground">Outras</div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
        )}
      </CardContent>
    </Card>
  );
}
