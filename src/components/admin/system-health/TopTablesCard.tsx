import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table2 } from "lucide-react";
import type { TopTableData } from "@/hooks/useSystemHealth";

interface Props {
  data: TopTableData[] | null;
  isLoading: boolean;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function TopTablesCard({ data, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Top 20 Tabelas (por linhas)
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left py-2 font-medium">Tabela</th>
                  <th className="text-right py-2 font-medium">Linhas</th>
                  <th className="text-right py-2 font-medium">Seq Scans</th>
                  <th className="text-right py-2 font-medium">Idx Scans</th>
                  <th className="text-right py-2 font-medium">Scan Ratio</th>
                </tr>
              </thead>
              <tbody>
                {data.map((table, i) => {
                  const totalScans = table.seqScans + table.idxScans;
                  const idxRatio = totalScans > 0 ? Math.round((table.idxScans / totalScans) * 100) : 0;
                  const isSeqHeavy = totalScans > 10 && idxRatio < 50;

                  return (
                    <tr key={table.tableName} className="border-b border-muted/50 last:border-0">
                      <td className="py-1.5 font-mono text-xs">{table.tableName}</td>
                      <td className="text-right py-1.5 font-mono">{formatNumber(table.liveRows)}</td>
                      <td className={`text-right py-1.5 font-mono ${isSeqHeavy ? "text-yellow-500" : ""}`}>
                        {formatNumber(table.seqScans)}
                      </td>
                      <td className="text-right py-1.5 font-mono">{formatNumber(table.idxScans)}</td>
                      <td className="text-right py-1.5">
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                          idxRatio >= 80
                            ? "bg-green-500/10 text-green-500"
                            : idxRatio >= 50
                              ? "bg-yellow-500/10 text-yellow-500"
                              : totalScans === 0
                                ? "bg-muted text-muted-foreground"
                                : "bg-red-500/10 text-red-500"
                        }`}>
                          {totalScans === 0 ? "—" : `${idxRatio}% idx`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
        )}
      </CardContent>
    </Card>
  );
}
