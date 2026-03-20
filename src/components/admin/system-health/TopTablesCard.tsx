import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table2 } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { TopTableData } from "@/hooks/useSystemHealth";

interface Props {
  data: TopTableData[] | null;
  isLoading: boolean;
  showExplanations?: boolean;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function TopTablesCard({ data, isLoading, showExplanations }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Top 20 Tabelas (por linhas)
            <InfoTooltip text="As maiores tabelas do sistema. Mostra como os dados estão sendo acessados e se há oportunidades de otimização." />
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
          <>
            {showExplanations && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mb-3 space-y-1">
                <p><strong>Seq Scans:</strong> Leitura da tabela inteira — mais lento. Se for alto, pode deixar o sistema lento.</p>
                <p><strong>Idx Scans:</strong> Leitura usando índice (atalho) — muito mais rápido. Quanto maior, melhor.</p>
                <p><strong>Scan Ratio:</strong> Mostra se o banco está usando índice ou não. Ideal acima de 80%.</p>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left py-2 font-medium">Tabela</th>
                    <th className="text-right py-2 font-medium">
                      <span className="flex items-center justify-end gap-1">
                        Linhas
                        <InfoTooltip text="Quantidade aproximada de registros na tabela." />
                      </span>
                    </th>
                    <th className="text-right py-2 font-medium">
                      <span className="flex items-center justify-end gap-1">
                        Seq Scans
                        <InfoTooltip text="Leitura direta na tabela inteira (mais lento). Se for alto em tabelas grandes, pode indicar falta de índice." />
                      </span>
                    </th>
                    <th className="text-right py-2 font-medium">
                      <span className="flex items-center justify-end gap-1">
                        Idx Scans
                        <InfoTooltip text="Leitura usando índice (mais rápido). Quanto mais alto em relação ao Seq Scans, melhor." />
                      </span>
                    </th>
                    <th className="text-right py-2 font-medium">
                      <span className="flex items-center justify-end gap-1">
                        Scan Ratio
                        <InfoTooltip text="Porcentagem de leituras que usam índice. Verde (≥80%) = ótimo. Amarelo (≥50%) = ok. Vermelho (<50%) = precisa otimizar." />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((table) => {
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
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
        )}
      </CardContent>
    </Card>
  );
}
