// Botões de ação da instância e status do webhook.
// JSX movido da MasterWhatsAppPage sem mudança.
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Loader2,
  RefreshCw,
  PowerOff,
  CheckCircle,
  AlertCircle,
  Zap,
  Trash2,
} from "lucide-react";
import type { MasterWhatsAppPageApi } from "./types";

export function InstanceActions({ wa, tests, cfg }: MasterWhatsAppPageApi) {
  const { instanceStatus, loadingAction, webhookStatus, checkStatus, disconnect, deleteInstance, configureWebhook } = wa;

  return (
    <>
    <div className="space-y-2 pt-2">
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={checkStatus}
          disabled={loadingAction === 'status'}
          className="flex-1"
          size="sm"
        >
          {loadingAction === 'status' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Atualizar Status
        </Button>
        <Button
          variant="destructive"
          onClick={disconnect}
          disabled={loadingAction === 'disconnect'}
          size="sm"
          title="Desconectar"
        >
          {loadingAction === 'disconnect' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PowerOff className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={deleteInstance}
          disabled={loadingAction === 'delete'}
          size="sm"
          title="Apagar instância"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          {loadingAction === 'delete' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>
      {(instanceStatus === 'connected' || instanceStatus === 'open') && (
        <div className="space-y-2">
          {/* Status do Webhook */}
          {webhookStatus?.loaded && (
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-lg text-xs",
              webhookStatus.configured 
                ? "bg-green-50 border border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-300"
                : "bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300"
            )}>
              {webhookStatus.configured ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Webhook ativo</p>
                    {webhookStatus.events && (
                      <p className="text-[10px] opacity-75 truncate">
                        Eventos: {webhookStatus.events.join(', ')}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <p className="font-medium">Webhook não configurado</p>
                </>
              )}
            </div>
          )}
          <Button
            variant="outline"
            onClick={configureWebhook}
            disabled={loadingAction === 'webhook'}
            className={cn(
              "w-full",
              webhookStatus?.configured 
                ? "border-green-300 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/20" 
                : "border-primary/30 hover:bg-primary/5"
            )}
            size="sm"
          >
            {loadingAction === 'webhook' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2 text-primary" />
            )}
            {webhookStatus?.configured ? 'Reconfigurar Webhook' : 'Configurar Webhook'}
          </Button>
        </div>
      )}
    </div>
    </>
  );
}
