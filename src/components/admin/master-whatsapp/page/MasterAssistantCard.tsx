// Card do Assistente IA Master.
// JSX movido da MasterWhatsAppPage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle, Bot, Trash2 } from "lucide-react";
import type { MasterWhatsAppPageApi } from "./types";

export function MasterAssistantCard({ wa, tests, cfg }: MasterWhatsAppPageApi) {
  const { setShowDeleteDialog } = tests;
  const { config, syncBots, syncing, lastSyncedAt } = cfg;

  return (
    <>
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bot className="w-5 h-5 text-primary" />
              Assistente IA Master
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Assistente unificado OpenAI gerenciado diretamente (sem intermediários)
            </CardDescription>
          </div>
          {config?.unified_openai_assistant_id && (
            <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/30">
              <CheckCircle className="w-3 h-3" />
              Sincronizado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {config?.unified_openai_assistant_id ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Assistant ID</p>
                <p className="font-mono text-xs mt-1 truncate">{config.unified_openai_assistant_id}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Modelo</p>
                <p className="font-medium text-sm mt-1">{config.openai_model || 'gpt-4o-mini'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Última Sincronização</p>
                <p className="text-sm mt-1">{typeof lastSyncedAt === 'string' ? new Date(lastSyncedAt).toLocaleString('pt-BR') : lastSyncedAt?.sales ? new Date(lastSyncedAt.sales).toLocaleString('pt-BR') : 'Nunca'}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncBots()}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Re-sincronizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={syncing}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Assistant
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Assistente ainda não foi criado</p>
            <p className="text-xs mt-1">Configure os bots abaixo e clique em "Sincronizar Bot"</p>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
