import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { ConnectionsData } from "@/hooks/useSystemHealth";

interface Props {
  data: ConnectionsData | null;
  isLoading: boolean;
  showExplanations?: boolean;
}

function getStatusInfo(usagePercent: number) {
  if (usagePercent <= 50) return { color: "text-green-500", bg: "bg-green-500", label: "✅ Uso saudável do banco", level: "healthy" };
  if (usagePercent <= 75) return { color: "text-yellow-500", bg: "bg-yellow-500", label: "⚠️ Atenção — uso moderado", level: "warning" };
  return { color: "text-red-500", bg: "bg-red-500", label: "🔴 Risco de sobrecarga", level: "danger" };
}

export function ConnectionsCard({ data, isLoading, showExplanations }: Props) {
  const usagePercent = data ? Math.round((data.total / data.max) * 100) : 0;
  const status = getStatusInfo(usagePercent);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Conexões
            <InfoTooltip text="Mostra quantas conexões o sistema está usando no banco de dados. Se passar de 80%, pode haver lentidão." />
          </CardTitle>
          <span className={`text-sm font-mono font-bold ${data ? status.color : "text-muted-foreground"}`}>
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
                <span className="flex items-center gap-1">
                  Uso do pool
                  <InfoTooltip text="Porcentagem de conexões em uso. Abaixo de 50% é ideal. Acima de 75% pode indicar necessidade de otimização." />
                </span>
                <span>{usagePercent}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${status.bg}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-green-500/10">
                <div className="text-lg font-bold text-green-500">{data.active}</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                  Ativas
                  <InfoTooltip text="Conexões realizando operações agora. É normal ter algumas ativas." />
                </div>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <div className="text-lg font-bold text-blue-500">{data.idle}</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                  Idle
                  <InfoTooltip text="Conexões abertas mas sem uso no momento. Ficam de prontidão para a próxima operação." />
                </div>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <div className="text-lg font-bold">{data.total - data.active - data.idle}</div>
                <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                  Outras
                  <InfoTooltip text="Conexões em estados intermediários (preparando, fechando, etc). Geralmente não preocupa." />
                </div>
              </div>
            </div>

            {/* Micro-copy de status */}
            <p className={`text-xs text-center font-medium ${status.color}`}>{status.label}</p>

            {showExplanations && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                <p><strong>O que significa:</strong> Conexões são os "canais" entre seu sistema e o banco de dados.</p>
                <p><strong>Ideal:</strong> Uso abaixo de 50%. Acima de 75% pode causar lentidão no sistema.</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
        )}
      </CardContent>
    </Card>
  );
}
