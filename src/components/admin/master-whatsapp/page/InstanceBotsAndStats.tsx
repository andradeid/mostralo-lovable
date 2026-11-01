// Status dos bots e estatísticas rápidas.
// JSX movido da MasterWhatsAppPage sem mudança.
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bot, Users, ShoppingCart, Headphones } from "lucide-react";
import type { MasterWhatsAppPageApi } from "./types";

export function InstanceBotsAndStats({ wa, tests, cfg }: MasterWhatsAppPageApi) {
  const { stats } = tests;
  const { config } = cfg;

  return (
    <>
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
        <Bot className="w-3.5 h-3.5" />
        Status dos Bots
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant={config?.sales_bot_enabled ? "default" : "outline"}
          className={cn(
            "text-xs",
            config?.sales_bot_enabled && "bg-blue-500 hover:bg-blue-600"
          )}
        >
          <ShoppingCart className="w-3 h-3 mr-1" />
          Vendas
        </Badge>
        <Badge 
          variant={config?.recruitment_bot_enabled ? "default" : "outline"}
          className={cn(
            "text-xs",
            config?.recruitment_bot_enabled && "bg-purple-500 hover:bg-purple-600"
          )}
        >
          <Users className="w-3 h-3 mr-1" />
          Recrutamento
        </Badge>
        <Badge 
          variant={config?.support_bot_enabled ? "default" : "outline"}
          className={cn(
            "text-xs",
            config?.support_bot_enabled && "bg-orange-500 hover:bg-orange-600"
          )}
        >
          <Headphones className="w-3 h-3 mr-1" />
          Suporte
        </Badge>
      </div>
    </div>

    {/* Estatísticas Rápidas */}
    <div className="grid grid-cols-3 gap-2">
      <div className="p-2 bg-muted rounded-lg text-center">
        <p className="text-lg font-bold text-primary">{stats.totalSessions}</p>
        <p className="text-[10px] text-muted-foreground">Sessões</p>
      </div>
      <div className="p-2 bg-muted rounded-lg text-center">
        <p className="text-lg font-bold text-primary">{stats.totalMessages}</p>
        <p className="text-[10px] text-muted-foreground">Mensagens</p>
      </div>
      <div className="p-2 bg-muted rounded-lg text-center">
        <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.pausedSessions}</p>
        <p className="text-[10px] text-muted-foreground">Pausados</p>
      </div>
    </div>
    </>
  );
}
