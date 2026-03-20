import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { RealtimeData } from "@/hooks/useSystemHealth";

interface Props {
  data: RealtimeData | null;
  isLoading: boolean;
  showExplanations?: boolean;
}

function getStatus(count: number) {
  if (count <= 5) return { color: "text-green-500", label: "✅ Uso normal", emoji: "✅" };
  if (count <= 15) return { color: "text-yellow-500", label: "⚠️ Monitorar", emoji: "⚠️" };
  return { color: "text-red-500", label: "🔴 Atenção — muitos canais", emoji: "🔴" };
}

export function RealtimeCard({ data, isLoading, showExplanations }: Props) {
  const status = data ? getStatus(data.activeSubscriptions) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Realtime
            <InfoTooltip text="Canais de atualização em tempo real. Permitem que telas sejam atualizadas automaticamente sem recarregar." />
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-20 bg-muted animate-pulse rounded" />
        ) : data ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="text-4xl font-bold">{data.activeSubscriptions}</div>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              Canais ativos
              <InfoTooltip text="Cada canal transmite dados em tempo real para uma parte do sistema. Até 5 é normal, acima de 15 pode consumir mais recursos." />
            </div>
            <div className={`mt-3 text-xs font-medium px-3 py-1.5 rounded-full ${
              status?.color
            } bg-muted/50`}>
              {status?.label}
            </div>

            {showExplanations && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mt-3 w-full space-y-1">
                <p><strong>O que é:</strong> Canais que enviam atualizações instantâneas (ex: novos pedidos aparecendo na tela).</p>
                <p><strong>Ideal:</strong> Até 5 canais. Mais que 15 pode causar uso excessivo de memória.</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
        )}
      </CardContent>
    </Card>
  );
}
