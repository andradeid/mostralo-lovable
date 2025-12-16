import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, RefreshCw, Power, PowerOff } from "lucide-react";
import { BotConfig } from "@/hooks/useBotConfig";

interface BotActivationCardProps {
  config: BotConfig;
  syncing: boolean;
  isConnected: boolean;
  onUpdate: (updates: Partial<BotConfig>) => void;
  onSync: (action: 'create' | 'update' | 'delete') => Promise<{ success: boolean } | undefined>;
}

export function BotActivationCard({ 
  config, 
  syncing, 
  isConnected,
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
    <Card>
      <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Assistente IA</CardTitle>
          </div>
          <Badge 
            variant={isActive ? "default" : "secondary"} 
            className={`${isActive ? "bg-green-500" : ""} self-start sm:self-auto text-xs`}
          >
            {isActive ? (
              <><Power className="h-3 w-3 mr-1" /> Ativo</>
            ) : (
              <><PowerOff className="h-3 w-3 mr-1" /> Inativo</>
            )}
          </Badge>
        </div>
        <CardDescription className="text-xs sm:text-sm mt-1 break-words">
          Ative o assistente para responder seus clientes automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
        {!isConnected && (
          <div className="p-2.5 sm:p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs sm:text-sm text-orange-600 dark:text-orange-400 leading-relaxed">
            <span className="flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <span>Conecte seu WhatsApp primeiro para ativar o assistente</span>
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <Label htmlFor="bot-enabled" className="text-sm">Ativar Assistente</Label>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              O bot responderá automaticamente seus clientes
            </p>
          </div>
          <Switch
            id="bot-enabled"
            checked={config.enabled}
            onCheckedChange={handleToggle}
            disabled={!isConnected || syncing}
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
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Como o bot se apresentará aos clientes
          </p>
        </div>

        {config.enabled && (
          <Button 
            variant="outline" 
            className="w-full text-sm"
            onClick={handleForceSync}
            disabled={syncing}
          >
            {syncing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sincronizando...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Atualizar Bot na Evolution</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
