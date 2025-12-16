import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BotSyncFloatingAlertProps {
  visible: boolean;
  onSync: () => void;
  syncing: boolean;
}

export function BotSyncFloatingAlert({ 
  visible, 
  onSync, 
  syncing 
}: BotSyncFloatingAlertProps) {
  if (!visible) return null;
  
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 
                    bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg
                    animate-pulse">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span className="text-sm font-medium whitespace-nowrap">Mudanças não aplicadas</span>
        <Button 
          onClick={onSync} 
          disabled={syncing} 
          size="sm" 
          variant="secondary"
          className="shrink-0"
        >
          {syncing ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Aplicando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-1" />
              Aplicar no Bot
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
