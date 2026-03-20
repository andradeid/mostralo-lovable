import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
import type { DatabaseStatsData } from "@/hooks/useSystemHealth";

interface Props {
  data: DatabaseStatsData | null;
  isLoading: boolean;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function DatabaseStatsCard({ data, isLoading }: Props) {
  const cacheColor = !data
    ? "text-muted-foreground"
    : data.cacheHitRatio >= 99
      ? "text-green-500"
      : data.cacheHitRatio >= 95
        ? "text-yellow-500"
        : "text-red-500";

  const rollbackRate = data && data.txCommit > 0
    ? ((data.txRollback / (data.txCommit + data.txRollback)) * 100).toFixed(2)
    : "0";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Banco de Dados
          </CardTitle>
          <span className={`text-sm font-mono font-bold ${cacheColor}`}>
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
            <StatRow label="Cache Hit Ratio" value={`${data.cacheHitRatio}%`} good={data.cacheHitRatio >= 99} />
            <StatRow label="TX Commits" value={formatNumber(data.txCommit)} />
            <StatRow label="TX Rollbacks" value={formatNumber(data.txRollback)} warn={data.txRollback > 100} />
            <StatRow label="Rollback Rate" value={`${rollbackRate}%`} good={parseFloat(rollbackRate) < 1} />
            <div className="border-t pt-2 mt-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reads</span>
                  <span className="font-mono">{formatNumber(data.tupFetched)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Writes</span>
                  <span className="font-mono">{formatNumber(data.tupInserted + data.tupUpdated + data.tupDeleted)}</span>
                </div>
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

function StatRow({ label, value, good, warn }: { label: string; value: string; good?: boolean; warn?: boolean }) {
  const color = good ? "text-green-500" : warn ? "text-red-500" : "";
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-mono font-medium ${color}`}>{value}</span>
    </div>
  );
}
