import { useDatabaseHealth, DatabaseStatus } from "@/hooks/useDatabaseHealth";
import { AlertTriangle, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * Banner de saúde do banco de dados.
 * Exibe alerta amarelo (degraded) ou vermelho (down) no topo do dashboard admin.
 * Fica invisível quando o banco está saudável.
 */
export function DatabaseHealthBanner() {
  const { status, latencyMs, consecutiveFailures, reconnect } = useDatabaseHealth();
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Não exibir nada se tudo estiver normal
  if (status === "healthy" || status === "unknown") return null;

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await reconnect();
    } finally {
      setIsReconnecting(false);
    }
  };

  const isDegraded = status === "degraded";
  const isDown = status === "down";

  return (
    <div
      className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-medium ${
        isDown
          ? "bg-destructive/15 text-destructive border-b border-destructive/20"
          : "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-b border-yellow-500/20"
      }`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        {isDown ? (
          <WifiOff className="h-4 w-4 shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        )}
        <span>
          {isDown
            ? `Banco de dados indisponível (${consecutiveFailures} falhas consecutivas). Dados podem estar desatualizados.`
            : `Banco de dados lento${latencyMs ? ` (${latencyMs}ms)` : ""}. As operações podem demorar mais que o normal.`}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleReconnect}
        disabled={isReconnecting}
        className="shrink-0 h-7 text-xs"
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${isReconnecting ? "animate-spin" : ""}`} />
        {isReconnecting ? "Reconectando..." : "Reconectar"}
      </Button>
    </div>
  );
}
