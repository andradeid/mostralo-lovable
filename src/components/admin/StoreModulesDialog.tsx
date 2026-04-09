import { useState, useMemo } from 'react';
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
  MapPin,
  Utensils,
  ChevronRight,
  Zap,
  Plus
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
  Utensils,
};

export function StoreModulesDialog({ 
  open, 
  onOpenChange, 
  storeId, 
  storeName 
}: StoreModulesDialogProps) {
  const { modules, loading, blockModule, unblockModule, grantExtraAccess } = useStoreModules(storeId);
  const [blockingModule, setBlockingModule] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [processingModule, setProcessingModule] = useState<string | null>(null);

  const activeModules = useMemo(() => modules.filter(m => !m.isBlocked), [modules]);
  const availableModules = useMemo(() => modules.filter(m => m.isBlocked), [modules]);

  const handleBlock = async (moduleId: string) => {
    setProcessingModule(moduleId);
    const success = await blockModule(moduleId, blockReason || undefined);
    setProcessingModule(null);
    
    if (success) {
      toast.success('Módulo desativado com sucesso');
      setBlockingModule(null);
      setBlockReason('');
    } else {
      toast.error('Erro ao desativar módulo');
    }
  };

  const handleUnblock = async (moduleId: string) => {
    setProcessingModule(moduleId);
    const module = modules.find(m => m.id === moduleId);
    
    let success: boolean;
    if (module?.isFromPlan) {
      success = await unblockModule(moduleId);
    } else {
      success = await grantExtraAccess(moduleId);
    }
    
    setProcessingModule(null);
    
    if (success) {
      toast.success('Módulo ativado com sucesso');
    } else {
      toast.error('Erro ao ativar módulo');
    }
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Package;
    return iconMap[iconName] || Package;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              Gerenciar Módulos
            </DialogTitle>
            <DialogDescription className="text-sm">
              Controle os módulos de <strong className="text-foreground">{storeName}</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Summary pills */}
          {!loading && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="font-medium text-foreground">{activeModules.length}</span> ativos
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
                <Plus className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-foreground">{availableModules.length}</span> disponíveis
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* Active Modules */}
              {activeModules.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-3.5 w-3.5 text-emerald-500" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Módulos Ativos
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {activeModules.map((module) => {
                      const IconComponent = getIcon(module.icon);
                      const isProcessing = processingModule === module.id;
                      const isBlockingThis = blockingModule === module.id;

                      return (
                        <div 
                          key={module.id} 
                          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:bg-muted/40 transition-colors"
                        >
                          <div className="p-1.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/15">
                            <IconComponent className="h-4 w-4 text-emerald-500" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{module.name}</span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-1.5 py-0.5">
                                <Check className="h-2.5 w-2.5" />
                                Ativo
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isBlockingThis ? (
                              <div className="flex items-center gap-1.5">
                                <Input
                                  placeholder="Motivo (opcional)"
                                  value={blockReason}
                                  onChange={(e) => setBlockReason(e.target.value)}
                                  className="w-32 h-7 text-xs"
                                />
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs px-2"
                                  onClick={() => handleBlock(module.id)}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirmar'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => { setBlockingModule(null); setBlockReason(''); }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-muted-foreground hover:text-destructive"
                                onClick={() => setBlockingModule(module.id)}
                              >
                                Desativar
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Modules */}
              {availableModules.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Disponíveis para Ativação
                    </h3>
                  </div>
                  <div className="space-y-1.5">
                    {availableModules.map((module) => {
                      const IconComponent = getIcon(module.icon);
                      const isProcessing = processingModule === module.id;

                      return (
                        <div 
                          key={module.id} 
                          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-border/60 hover:border-primary/30 hover:bg-muted/30 transition-all"
                        >
                          <div className="p-1.5 rounded-md bg-muted/60">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground truncate">{module.name}</span>
                            </div>
                            {module.description && (
                              <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">
                                {module.description}
                              </p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs shrink-0 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => handleUnblock(module.id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Ativar
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
