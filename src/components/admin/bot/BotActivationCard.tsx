import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, RefreshCw, Power, PowerOff, AlertTriangle } from "lucide-react";
import { BotConfig } from "@/hooks/useBotConfig";

interface BotActivationCardProps {
  config: BotConfig;
  syncing: boolean;
  isConnected: boolean;
  hasUnsyncedChanges?: boolean;
  onUpdate: (updates: Partial<BotConfig>) => void;
  onSync: (action: 'create' | 'update' | 'delete') => Promise<{ success: boolean } | undefined>;
}

export function BotActivationCard({ 
  config, 
  syncing, 
  isConnected,
  hasUnsyncedChanges = false,
  onUpdate, 
  onSync 
}: BotActivationCardProps) {
  const isActive = config.enabled && config.evolution_bot_status === 'active';

  const handleToggle = async (enabled: boolean) => {
    if (!isConnected) return;
    
    if (enabled) {
      const result = await onSync('create');
      if (result?.success) {
        onUpdate({ enabled: true });
      }
    } else {
      const result = await onSync('delete');
      if (result?.success) {
        onUpdate({ enabled: false });
      }
    }
  };

  const handleForceSync = async () => {
    if (config.enabled) {
      await onSync('update');
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <CardTitle className="text-base sm:text-lg">Assistente IA</CardTitle>
            </div>
            <Badge 
              variant={isActive ? "default" : "secondary"} 
              className={`${isActive ? "bg-green-500" : ""} shrink-0 text-xs`}
            >
              {isActive ? (
                <><Power className="h-3 w-3 mr-1" /> Ativo</>
              ) : (
                <><PowerOff className="h-3 w-3 mr-1" /> Inativo</>
              )}
            </Badge>
          </div>
          <CardDescription className="text-xs sm:text-sm break-words hyphens-auto">
            Ative o assistente para responder seus clientes automaticamente
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-3 sm:space-y-4">
        {!isConnected && (
          <div className="p-2.5 sm:p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg overflow-hidden">
            <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 break-words hyphens-auto">
              ⚠️ Conecte seu WhatsApp primeiro para ativar o assistente
            </p>
          </div>
        )}

        {/* Alerta de mudanças não sincronizadas */}
        {hasUnsyncedChanges && config.enabled && (
          <div className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg overflow-hidden">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-medium">
                  Mudanças pendentes
                </p>
                <p className="text-[10px] sm:text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                  Clique em "Atualizar Bot" para aplicar as alterações
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <Label htmlFor="bot-enabled" className="text-sm">Ativar Assistente</Label>
            <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
              O bot responderá automaticamente seus clientes
            </p>
          </div>
          <Switch
            id="bot-enabled"
            checked={config.enabled}
            onCheckedChange={handleToggle}
            disabled={!isConnected || syncing}
            className="shrink-0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bot-name" className="text-sm">Nome do Assistente</Label>
          <Input
            id="bot-name"
            value={config.bot_name}
            onChange={(e) => onUpdate({ bot_name: e.target.value })}
            placeholder="Ex: Assistente da Pizzaria"
            disabled={!isConnected}
            className="text-sm"
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
            Como o bot se apresentará aos clientes
          </p>
        </div>

        {config.enabled && (
          <Button 
            variant={hasUnsyncedChanges ? "default" : "outline"}
            className={`w-full text-xs sm:text-sm ${hasUnsyncedChanges ? "animate-pulse" : ""}`}
            onClick={handleForceSync}
            disabled={syncing}
          >
            {syncing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" /> Sincronizando...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2 shrink-0" /> {hasUnsyncedChanges ? "Aplicar Mudanças" : "Atualizar Bot"}</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
