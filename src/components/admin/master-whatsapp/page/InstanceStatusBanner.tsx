// Status da instância em destaque.
// JSX movido da MasterWhatsAppPage sem mudança.
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/masterWhatsapp/format";
import type { MasterWhatsAppPageApi } from "./types";

export function InstanceStatusBanner({ wa, tests, cfg }: MasterWhatsAppPageApi) {
  const { instanceStatus } = wa;
  const { config } = cfg;

  return (
    <>
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border-2 transition-colors",
      instanceStatus === 'connected' || instanceStatus === 'open'
        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
        : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
    )}>
      <div className={cn(
        "w-3 h-3 rounded-full",
        instanceStatus === 'connected' || instanceStatus === 'open' 
          ? "bg-green-500 animate-pulse" 
          : "bg-red-500"
      )} />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold text-sm",
          instanceStatus === 'connected' || instanceStatus === 'open'
            ? "text-green-700 dark:text-green-300"
            : "text-red-700 dark:text-red-300"
        )}>
          {instanceStatus === 'connected' || instanceStatus === 'open' ? 'CONECTADO' : 'DESCONECTADO'}
        </p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {config?.instance_name}
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 w-7 p-0 shrink-0"
        onClick={() => copyToClipboard(config?.instance_name)}
      >
        <Copy className="w-3.5 h-3.5" />
      </Button>
    </div>
    </>
  );
}
