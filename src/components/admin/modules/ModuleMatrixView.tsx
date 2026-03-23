import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  CheckCircle, XCircle, Package, Loader2, BarChart3, 
  MessageSquare, Users, Truck, Store as StoreIcon, Settings, CreditCard, 
  ShoppingCart, Receipt, Megaphone, Clock, Calendar, FileText, 
  Shield, Image, Menu, Wallet, Printer, Utensils, ExternalLink,
  QrCode, Monitor, Palette, Tag, Code, Target, BarChart,
  LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Mapa de ícones para módulos
const moduleIconMap: Record<string, LucideIcon> = {
  'BarChart3': BarChart3, 'BarChart': BarChart, 'MessageSquare': MessageSquare,
  'Users': Users, 'Truck': Truck, 'Store': StoreIcon, 'Settings': Settings,
  'CreditCard': CreditCard, 'ShoppingCart': ShoppingCart, 'Receipt': Receipt,
  'Megaphone': Megaphone, 'Clock': Clock, 'Calendar': Calendar,
  'FileText': FileText, 'Shield': Shield, 'Package': Package,
  'Image': Image, 'Menu': Menu, 'Wallet': Wallet, 'Printer': Printer,
  'Utensils': Utensils, 'ExternalLink': ExternalLink, 'QrCode': QrCode,
  'Monitor': Monitor, 'Palette': Palette, 'Tag': Tag, 'Code': Code,
  'Target': Target,
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

interface Store {
  id: string;
  name: string;
  slug: string | null;
}

interface ModuleMatrixViewProps {
  modules: ModuleWithStoreAccess[];
  stores: Store[];
  searchTerm: string;
  statusFilter: 'all' | 'blocked' | 'enabled';
  moduleFilter: string;
  onToggle: (moduleId: string, storeId: string) => Promise<boolean>;
}

export function ModuleMatrixView({
  modules,
  stores,
  searchTerm,
  statusFilter,
  moduleFilter,
  onToggle,
}: ModuleMatrixViewProps) {
  const [toggling, setToggling] = useState<string | null>(null);

  // Filtrar módulos
  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      if (moduleFilter !== 'all' && module.id !== moduleFilter) return false;
      return true;
    });
  }, [modules, moduleFilter]);

  // Filtrar lojas
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (statusFilter === 'all') return matchesSearch;
      const hasBlockedModule = modules.some((module) => {
        const access = module.storeAccess.find((s) => s.storeId === store.id);
        return access?.isBlocked;
      });
      if (statusFilter === 'blocked') return matchesSearch && hasBlockedModule;
      if (statusFilter === 'enabled') return matchesSearch && !hasBlockedModule;
      return matchesSearch;
    });
  }, [stores, searchTerm, statusFilter, modules]);

  const handleToggle = async (moduleId: string, storeId: string) => {
    const key = `${moduleId}-${storeId}`;
    setToggling(key);
    const success = await onToggle(moduleId, storeId);
    setToggling(null);
    if (success) {
      toast.success('Status alterado com sucesso');
    } else {
      toast.error('Erro ao alterar status');
    }
  };

  const getAccessStatus = (moduleId: string, storeId: string) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return { isBlocked: false, reason: null };
    const access = module.storeAccess.find((s) => s.storeId === storeId);
    return {
      isBlocked: access?.isBlocked || false,
      reason: access?.blockedReason || null,
    };
  };

  if (filteredModules.length === 0 || filteredStores.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum dado encontrado com os filtros aplicados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {/* Info bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {filteredStores.length} lojas · {filteredModules.length} módulos
        </span>
      </div>

      {/* Tabela detalhada */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-max">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2.5 font-medium text-sm sticky left-0 bg-muted/50 z-20 w-[180px] max-w-[180px] border-r border-border/50">
                      Loja
                    </th>
                    {filteredModules.map((module) => {
                      const IconComponent = getModuleIcon(module.icon);
                      return (
                        <th key={module.id} className="p-2 text-center min-w-[90px]">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center gap-1 cursor-help">
                                <div className="p-1 rounded-md bg-primary/10">
                                  <IconComponent className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="text-[10px] font-medium truncate max-w-[80px] leading-tight">
                                  {module.name}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[250px]">
                              <p className="font-semibold">{module.name}</p>
                              {module.key && (
                                <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 block">
                                  {module.key}
                                </code>
                              )}
                              {module.description && (
                                <p className="text-xs text-muted-foreground mt-1.5">
                                  {module.description}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.map((store, index) => (
                    <tr 
                      key={store.id} 
                      className={cn(
                        'border-b transition-colors group',
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/10',
                        'hover:bg-primary/5'
                      )}
                    >
                      <td className="p-2.5 sticky left-0 z-10 border-r border-border/50 w-[180px] max-w-[180px] bg-inherit group-hover:bg-primary/5 transition-colors">
                        <div className="overflow-hidden">
                          <p className="font-medium text-sm truncate max-w-[160px]">
                            {store.name}
                          </p>
                          {store.slug && (
                            <code className="text-[10px] text-muted-foreground truncate block max-w-[160px]">
                              {store.slug}
                            </code>
                          )}
                        </div>
                      </td>
                      {filteredModules.map((module) => {
                        const { isBlocked, reason } = getAccessStatus(module.id, store.id);
                        const key = `${module.id}-${store.id}`;
                        const isToggling = toggling === key;

                        return (
                          <td key={module.id} className="p-1.5 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    'w-9 h-9 p-0 rounded-full transition-all',
                                    isBlocked
                                      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600'
                                      : 'bg-green-500/10 hover:bg-green-500/20 text-green-600'
                                  )}
                                  onClick={() => handleToggle(module.id, store.id)}
                                  disabled={isToggling}
                                >
                                  {isToggling ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : isBlocked ? (
                                    <XCircle className="w-4.5 h-4.5" />
                                  ) : (
                                    <CheckCircle className="w-4.5 h-4.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">
                                  {module.name}
                                </p>
                                <p className={cn(
                                  'text-xs',
                                  isBlocked ? 'text-red-500' : 'text-green-500'
                                )}>
                                  {isBlocked ? '❌ Bloqueado' : '✅ Liberado'} — Clique para alternar
                                </p>
                                {reason && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Motivo: {reason}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
