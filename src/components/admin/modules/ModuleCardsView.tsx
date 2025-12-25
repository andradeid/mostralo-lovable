import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Package, ChevronDown, ChevronUp, Lock, Unlock, 
  CheckCircle, XCircle, BarChart3, MessageSquare, 
  Users, Truck, Store, Settings, CreditCard, ShoppingCart,
  Receipt, Megaphone, Clock, Calendar, FileText, Shield,
  LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';

// Mapa de ícones para módulos
const moduleIconMap: Record<string, LucideIcon> = {
  'BarChart3': BarChart3,
  'MessageSquare': MessageSquare,
  'Users': Users,
  'Truck': Truck,
  'Store': Store,
  'Settings': Settings,
  'CreditCard': CreditCard,
  'ShoppingCart': ShoppingCart,
  'Receipt': Receipt,
  'Megaphone': Megaphone,
  'Clock': Clock,
  'Calendar': Calendar,
  'FileText': FileText,
  'Shield': Shield,
  'Package': Package,
};

const getModuleIcon = (iconName: string | null): LucideIcon => {
  if (!iconName) return Package;
  return moduleIconMap[iconName] || Package;
};

interface StoreAccessStatus {
  storeId: string;
  storeName: string;
  storeSlug: string | null;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
}

interface ModuleWithStoreAccess {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  key: string | null;
  storeAccess: StoreAccessStatus[];
  totalStores: number;
  blockedCount: number;
  enabledCount: number;
}

interface ModuleCardsViewProps {
  modules: ModuleWithStoreAccess[];
  searchTerm: string;
  statusFilter: 'all' | 'blocked' | 'enabled';
  moduleFilter: string;
  onBulkBlock: (moduleId: string, storeIds: string[], reason?: string) => Promise<boolean>;
  onBulkUnblock: (moduleId: string, storeIds: string[]) => Promise<boolean>;
}

export function ModuleCardsView({
  modules,
  searchTerm,
  statusFilter,
  moduleFilter,
  onBulkBlock,
  onBulkUnblock,
}: ModuleCardsViewProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedStores, setSelectedStores] = useState<Record<string, Set<string>>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  // Filtrar módulos
  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      if (moduleFilter !== 'all' && module.id !== moduleFilter) return false;
      return true;
    });
  }, [modules, moduleFilter]);

  const toggleExpanded = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const toggleStoreSelection = (moduleId: string, storeId: string) => {
    setSelectedStores((prev) => {
      const moduleSelection = new Set(prev[moduleId] || []);
      if (moduleSelection.has(storeId)) {
        moduleSelection.delete(storeId);
      } else {
        moduleSelection.add(storeId);
      }
      return { ...prev, [moduleId]: moduleSelection };
    });
  };

  const selectAllStores = (moduleId: string, stores: StoreAccessStatus[]) => {
    const filteredStores = getFilteredStores(stores);
    setSelectedStores((prev) => ({
      ...prev,
      [moduleId]: new Set(filteredStores.map((s) => s.storeId)),
    }));
  };

  const deselectAllStores = (moduleId: string) => {
    setSelectedStores((prev) => ({
      ...prev,
      [moduleId]: new Set(),
    }));
  };

  const getFilteredStores = (stores: StoreAccessStatus[]) => {
    return stores.filter((store) => {
      const matchesSearch = store.storeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'blocked' && store.isBlocked) ||
        (statusFilter === 'enabled' && !store.isBlocked);
      return matchesSearch && matchesStatus;
    });
  };

  const handleBulkBlock = async (moduleId: string) => {
    const selected = selectedStores[moduleId];
    if (!selected || selected.size === 0) {
      toast.error('Selecione pelo menos uma loja');
      return;
    }

    setProcessing(moduleId);
    const success = await onBulkBlock(moduleId, Array.from(selected));
    setProcessing(null);

    if (success) {
      toast.success(`${selected.size} loja(s) bloqueada(s) com sucesso`);
      deselectAllStores(moduleId);
    } else {
      toast.error('Erro ao bloquear lojas');
    }
  };

  const handleBulkUnblock = async (moduleId: string) => {
    const selected = selectedStores[moduleId];
    if (!selected || selected.size === 0) {
      toast.error('Selecione pelo menos uma loja');
      return;
    }

    setProcessing(moduleId);
    const success = await onBulkUnblock(moduleId, Array.from(selected));
    setProcessing(null);

    if (success) {
      toast.success(`${selected.size} loja(s) liberada(s) com sucesso`);
      deselectAllStores(moduleId);
    } else {
      toast.error('Erro ao liberar lojas');
    }
  };

  if (filteredModules.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum módulo encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredModules.map((module) => {
        const isExpanded = expandedModules.has(module.id);
        const filteredStores = getFilteredStores(module.storeAccess);
        const selected = selectedStores[module.id] || new Set();
        const isProcessing = processing === module.id;

        return (
          <Card key={module.id} className="overflow-hidden">
            <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(module.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        {(() => {
                          const IconComponent = getModuleIcon(module.icon);
                          return <IconComponent className="w-5 h-5 text-primary" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{module.name}</CardTitle>
                        {module.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {module.description}
                          </p>
                        )}
                        {module.key && (
                          <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                            {module.key}
                          </code>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {module.enabledCount}
                      </Badge>
                      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                        <XCircle className="w-3 h-3 mr-1" />
                        {module.blockedCount}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 border-t">
                  {/* Barra de seleção */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 border-b mb-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAllStores(module.id, module.storeAccess)}
                      >
                        Selecionar tudo
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deselectAllStores(module.id)}
                      >
                        Limpar seleção
                      </Button>
                      {selected.size > 0 && (
                        <Badge variant="secondary">{selected.size} selecionada(s)</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkBlock(module.id)}
                        disabled={selected.size === 0 || isProcessing}
                        className="text-red-600 border-red-500/30 hover:bg-red-500/10"
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        Bloquear
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkUnblock(module.id)}
                        disabled={selected.size === 0 || isProcessing}
                        className="text-green-600 border-green-500/30 hover:bg-green-500/10"
                      >
                        <Unlock className="w-4 h-4 mr-1" />
                        Liberar
                      </Button>
                    </div>
                  </div>

                  {/* Lista de lojas */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredStores.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma loja encontrada com os filtros aplicados.
                      </p>
                    ) : (
                      filteredStores.map((store) => (
                        <div
                          key={store.storeId}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selected.has(store.storeId)}
                              onCheckedChange={() => toggleStoreSelection(module.id, store.storeId)}
                            />
                            <div>
                              <p className="text-sm font-medium">{store.storeName}</p>
                              {store.storeSlug && (
                                <code className="text-xs text-muted-foreground">{store.storeSlug}</code>
                              )}
                            </div>
                          </div>
                          {store.isBlocked ? (
                            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                              <XCircle className="w-3 h-3 mr-1" />
                              Bloqueado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Liberado
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}
