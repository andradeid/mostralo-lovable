import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, AlertCircle, XCircle, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SyncStatus = 'synced' | 'pending' | 'not_configured' | 'inactive' | 'syncing';

interface BotSyncStatusBadgeProps {
  evolutionId: string | null;
  botEnabled: boolean;
  hasUnsyncedChanges?: boolean;
  syncing?: boolean;
}

function getSyncStatus(
  evolutionId: string | null, 
  botEnabled: boolean, 
  hasUnsyncedChanges: boolean,
  syncing: boolean
): SyncStatus {
  if (syncing) return 'syncing';
  if (!botEnabled) return 'inactive';
  if (!evolutionId) return 'not_configured';
  if (hasUnsyncedChanges) return 'pending';
  return 'synced';
}

const statusConfig: Record<SyncStatus, { 
  label: string; 
  icon: typeof CheckCircle; 
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  tooltip: string;
}> = {
  synced: {
    label: 'Conectado',
    icon: CheckCircle,
    variant: 'default',
    className: 'bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20',
    tooltip: 'Bot sincronizado com a Evolution API'
  },
  pending: {
    label: 'Pendente',
    icon: AlertCircle,
    variant: 'outline',
    className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20 animate-pulse',
    tooltip: 'Há alterações não sincronizadas - clique em Sincronizar'
  },
  not_configured: {
    label: 'Não criado',
    icon: XCircle,
    variant: 'destructive',
    className: 'bg-red-500/15 text-red-600 border-red-500/30 hover:bg-red-500/20',
    tooltip: 'Bot ainda não foi criado na Evolution API'
  },
  inactive: {
    label: 'Inativo',
    icon: Circle,
    variant: 'secondary',
    className: 'bg-muted text-muted-foreground border-muted-foreground/20',
    tooltip: 'Bot está desativado'
  },
  syncing: {
    label: 'Sincronizando',
    icon: Loader2,
    variant: 'outline',
    className: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    tooltip: 'Sincronizando com a Evolution API...'
  }
};

export function BotSyncStatusBadge({ 
  evolutionId, 
  botEnabled, 
  hasUnsyncedChanges = false,
  syncing = false
}: BotSyncStatusBadgeProps) {
  const status = getSyncStatus(evolutionId, botEnabled, hasUnsyncedChanges, syncing);
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={config.variant}
            className={cn("gap-1 text-xs font-medium cursor-help", config.className)}
          >
            <Icon className={cn("w-3 h-3", status === 'syncing' && "animate-spin")} />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
