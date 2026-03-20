import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { DatabaseStatsData } from "@/hooks/useSystemHealth";

interface Props {
  data: DatabaseStatsData | null;
  isLoading: boolean;
  showExplanations?: boolean;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function getCacheStatus(ratio: number) {
  if (ratio >= 99) return { color: "text-green-500", label: "✅ Cache excelente" };
  if (ratio >= 95) return { color: "text-yellow-500", label: "⚠️ Cache aceitável, monitorar" };
  return { color: "text-red-500", label: "🔴 Cache baixo — possível lentidão" };
}

export function DatabaseStatsCard({ data, isLoading, showExplanations }: Props) {
  const cacheStatus = data ? getCacheStatus(data.cacheHitRatio) : null;

  const rollbackRate = data && data.txCommit > 0
    ? ((data.txRollback / (data.txCommit + data.txRollback)) * 100).toFixed(2)
    : "0";

  const rollbackColor = parseFloat(rollbackRate) < 1 ? "text-green-500" : parseFloat(rollbackRate) < 5 ? "text-yellow-500" : "text-red-500";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Banco de Dados
            <InfoTooltip text="Indicadores de saúde do banco de dados. Mostra se os dados estão sendo lidos de forma eficiente." />
          </CardTitle>
          <span className={`text-sm font-mono font-bold ${cacheStatus?.color ?? "text-muted-foreground"}`}>
            {isLoading ? "..." : data ? `${data.cacheHitRatio}%` : "N/A"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : data ? (
          <>
            <StatRow
              label="Cache Hit Ratio"
              value={`${data.cacheHitRatio}%`}
              good={data.cacheHitRatio >= 99}
              warn={data.cacheHitRatio < 95}
              tooltip="Porcentagem de dados lidos da memória (rápido) em vez do disco (lento). Ideal acima de 99%."
            />
            <StatRow
              label="TX Commits"
              value={formatNumber(data.txCommit)}
              tooltip="Operações salvas com sucesso no banco. Quanto mais, mais ativo está o sistema."
            />
            <StatRow
              label="TX Rollbacks"
              value={formatNumber(data.txRollback)}
              warn={data.txRollback > 100}
              tooltip="Operações que falharam e foram desfeitas. Se subir muito, pode indicar erro no sistema."
            />
            <StatRow
              label="Rollback Rate"
              value={`${rollbackRate}%`}
              good={parseFloat(rollbackRate) < 1}
              warn={parseFloat(rollbackRate) >= 5}
              tooltip="Proporção de erros nas operações. Abaixo de 1% é ótimo. Acima de 5% requer investigação."
              valueColor={rollbackColor}
            />
            <div className="border-t pt-2 mt-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    Reads
                    <InfoTooltip text="Quantidade de dados lidos do banco. Volume normal varia conforme o uso do sistema." />
                  </span>
                  <span className="font-mono">{formatNumber(data.tupFetched)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    Writes
                    <InfoTooltip text="Quantidade de dados salvos, atualizados ou removidos. Reflete a atividade de escrita." />
                  </span>
                  <span className="font-mono">{formatNumber(data.tupInserted + data.tupUpdated + data.tupDeleted)}</span>
                </div>
              </div>
            </div>

            {/* Micro-copy */}
            {cacheStatus && <p className={`text-xs text-center font-medium ${cacheStatus.color}`}>{cacheStatus.label}</p>}

            {showExplanations && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
                <p><strong>Cache:</strong> Quando o banco "lembra" dos dados na memória, tudo fica mais rápido.</p>
                <p><strong>Rollbacks:</strong> São operações que deram erro e foram canceladas. Pouco é normal.</p>
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

function StatRow({ label, value, good, warn, tooltip, valueColor }: {
  label: string; value: string; good?: boolean; warn?: boolean; tooltip: string; valueColor?: string;
}) {
  const color = valueColor ?? (good ? "text-green-500" : warn ? "text-red-500" : "");
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {label}
        <InfoTooltip text={tooltip} />
      </span>
      <span className={`text-sm font-mono font-medium ${color}`}>{value}</span>
    </div>
  );
}
