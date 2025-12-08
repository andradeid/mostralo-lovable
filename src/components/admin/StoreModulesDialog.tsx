import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useStoreModules } from '@/hooks/useStoreModules';
import { toast } from 'sonner';
import { 
  Loader2, 
  Lock, 
  Unlock, 
  Check, 
  X,
  Package,
  Truck,
  Printer,
  Tag,
  Megaphone,
  Calendar,
  ShoppingCart,
  BarChart3,
  Palette,
  MessageCircle,
  MapPin
} from 'lucide-react';

interface StoreModulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  storeName: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Truck,
  Printer,
  Tag,
  Megaphone,
  Calendar,
  ShoppingCart,
  BarChart3,
  Palette,
  MessageCircle,
  MapPin,
};

export function StoreModulesDialog({ 
  open, 
  onOpenChange, 
  storeId, 
  storeName 
}: StoreModulesDialogProps) {
  const { modules, loading, blockModule, unblockModule } = useStoreModules(storeId);
  const [blockingModule, setBlockingModule] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [processingModule, setProcessingModule] = useState<string | null>(null);

  const handleBlock = async (moduleId: string) => {
    setProcessingModule(moduleId);
    const success = await blockModule(moduleId, blockReason || undefined);
    setProcessingModule(null);
    
    if (success) {
      toast.success('Módulo bloqueado com sucesso');
      setBlockingModule(null);
      setBlockReason('');
    } else {
      toast.error('Erro ao bloquear módulo');
    }
  };

  const handleUnblock = async (moduleId: string) => {
    setProcessingModule(moduleId);
    const success = await unblockModule(moduleId);
    setProcessingModule(null);
    
    if (success) {
      toast.success('Módulo desbloqueado com sucesso');
    } else {
      toast.error('Erro ao desbloquear módulo');
    }
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Package;
    return iconMap[iconName] || Package;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gerenciar Módulos
          </DialogTitle>
          <DialogDescription>
            Controle os módulos disponíveis para <strong>{storeName}</strong>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {modules.map((module) => {
              const IconComponent = getIcon(module.icon);
              const isProcessing = processingModule === module.id;
              const isBlockingThis = blockingModule === module.id;

              return (
                <div 
                  key={module.id} 
                  className={`p-4 rounded-lg border ${
                    module.isBlocked 
                      ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' 
                      : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        module.isBlocked 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30' 
                          : 'bg-green-100 text-green-600 dark:bg-green-900/30'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{module.name}</h4>
                          <Badge variant={module.isBlocked ? 'destructive' : 'default'} className="text-xs">
                            {module.isBlocked ? (
                              <><X className="h-3 w-3 mr-1" /> Bloqueado</>
                            ) : (
                              <><Check className="h-3 w-3 mr-1" /> Liberado</>
                            )}
                          </Badge>
                        </div>
                        {module.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {module.description}
                          </p>
                        )}
                        {module.isBlocked && module.blockedReason && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-2 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                            <strong>Motivo:</strong> {module.blockedReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {module.isBlocked ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblock(module.id)}
                          disabled={isProcessing}
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Unlock className="h-4 w-4 mr-1" />
                              Desbloquear
                            </>
                          )}
                        </Button>
                      ) : isBlockingThis ? (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Motivo (opcional)"
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            className="w-40 h-8 text-sm"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBlock(module.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Confirmar'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setBlockingModule(null);
                              setBlockReason('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setBlockingModule(module.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                        >
                          <Lock className="h-4 w-4 mr-1" />
                          Bloquear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Dica:</strong> Todos os módulos são liberados por padrão. 
            Bloqueie apenas os módulos que deseja restringir para esta loja.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
