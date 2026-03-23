import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  CheckCircle, XCircle, Package, Loader2, BarChart3, 
  MessageSquare, Users, Truck, Store as StoreIcon, Settings, CreditCard, 
  ShoppingCart, Receipt, Megaphone, Clock, Calendar, FileText, 
  Shield, Image, Menu, Wallet, Printer, Utensils, ExternalLink,
  QrCode, Monitor, Palette, Tag, Code, Target, BarChart,
  LucideIcon, ChevronDown, LayoutGrid, Table, Eye, EyeOff,
  ChevronRight
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

// Categorias de agrupamento de módulos
const MODULE_CATEGORIES: { name: string; icon: LucideIcon; keys: string[] }[] = [
  {
    name: 'Vendas & Pedidos',
    icon: ShoppingCart,
    keys: ['cardapio', 'cardapio_mesa', 'pdv', 'totem', 'delivery', 'pedidos', 'comandas', 'cross_sell'],
  },
  {
    name: 'Agendamento',
    icon: Calendar,
    keys: ['agendamento', 'agenda', 'booking', 'profissionais'],
  },
  {
    name: 'Comunicação',
    icon: MessageSquare,
    keys: ['chat', 'whatsapp', 'conexao_whatsapp', 'assistente_ia', 'notificacoes', 'chatbot'],
  },
  {
    name: 'Marketing & CRM',
    icon: Megaphone,
    keys: ['crm', 'clientes', 'fidelidade', 'clube', 'cupons', 'banners', 'avaliacoes', 'marketing'],
  },
  {
    name: 'Financeiro',
    icon: Wallet,
    keys: ['financeiro', 'comissoes', 'pagamentos', 'caixa', 'nfe', 'fiscal'],
  },
  {
    name: 'Operações',
    icon: Settings,
    keys: ['kds', 'estoque', 'impressao', 'qrcode', 'mesas', 'atendentes', 'chamada_senha'],
  },
  {
    name: 'Sistema & Config',
    icon: Shield,
    keys: ['configuracoes', 'relatorios', 'analytics', 'integracao', 'api', 'webhook', 'personalizacao', 'prontuario', 'assinatura'],
  },
];

function categorizeModule(moduleKey: string | null): string {
  if (!moduleKey) return 'Outros';
  const keyLower = moduleKey.toLowerCase();
  for (const cat of MODULE_CATEGORIES) {
    if (cat.keys.some(k => keyLower.includes(k))) return cat.name;
  }
  return 'Outros';
}

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

type ViewMode = 'summary' | 'detailed';

export function ModuleMatrixView({
  modules,
  stores,
  searchTerm,
  statusFilter,
  moduleFilter,
  onToggle,
}: ModuleMatrixViewProps) {
  const [toggling, setToggling] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

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

  // Agrupar módulos por categoria
  const groupedModules = useMemo(() => {
    const groups: Record<string, ModuleWithStoreAccess[]> = {};
    for (const mod of filteredModules) {
      const cat = categorizeModule(mod.key);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(mod);
    }
    return groups;
  }, [filteredModules]);

  // Stats por loja
  const storeStats = useMemo(() => {
    const map: Record<string, { enabled: number; blocked: number; total: number }> = {};
    for (const store of filteredStores) {
      let enabled = 0;
      let blocked = 0;
      for (const mod of filteredModules) {
        const access = mod.storeAccess.find(s => s.storeId === store.id);
        if (access?.isBlocked) blocked++;
        else enabled++;
      }
      map[store.id] = { enabled, blocked, total: filteredModules.length };
    }
    return map;
  }, [filteredStores, filteredModules]);

  // Stats por categoria por loja
  const storeCategoryStats = useMemo(() => {
    const map: Record<string, Record<string, { enabled: number; total: number }>> = {};
    for (const store of filteredStores) {
      map[store.id] = {};
      for (const [catName, catModules] of Object.entries(groupedModules)) {
        let enabled = 0;
        for (const mod of catModules) {
          const access = mod.storeAccess.find(s => s.storeId === store.id);
          if (!access?.isBlocked) enabled++;
        }
        map[store.id][catName] = { enabled, total: catModules.length };
      }
    }
    return map;
  }, [filteredStores, groupedModules]);

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

  const toggleStoreExpand = (storeId: string) => {
    setExpandedStores(prev => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
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

  const categoryNames = Object.keys(groupedModules);

  return (
    <div className="space-y-3">
      {/* Seletor de modo */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'summary' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('summary')}
          className="gap-1.5"
        >
          <LayoutGrid className="w-4 h-4" />
          Resumo
        </Button>
        <Button
          variant={viewMode === 'detailed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('detailed')}
          className="gap-1.5"
        >
          <Table className="w-4 h-4" />
          Detalhado
        </Button>
        <span className="text-xs text-muted-foreground ml-2">
          {filteredStores.length} lojas · {filteredModules.length} módulos
        </span>
      </div>

      {viewMode === 'summary' ? (
        <SummaryView
          stores={filteredStores}
          groupedModules={groupedModules}
          categoryNames={categoryNames}
          storeStats={storeStats}
          storeCategoryStats={storeCategoryStats}
          expandedStores={expandedStores}
          toggleStoreExpand={toggleStoreExpand}
          getAccessStatus={getAccessStatus}
          handleToggle={handleToggle}
          toggling={toggling}
        />
      ) : (
        <DetailedView
          filteredStores={filteredStores}
          filteredModules={filteredModules}
          getAccessStatus={getAccessStatus}
          handleToggle={handleToggle}
          toggling={toggling}
        />
      )}
    </div>
  );
}

// ===================== SUMMARY VIEW =====================

interface SummaryViewProps {
  stores: Store[];
  groupedModules: Record<string, ModuleWithStoreAccess[]>;
  categoryNames: string[];
  storeStats: Record<string, { enabled: number; blocked: number; total: number }>;
  storeCategoryStats: Record<string, Record<string, { enabled: number; total: number }>>;
  expandedStores: Set<string>;
  toggleStoreExpand: (storeId: string) => void;
  getAccessStatus: (moduleId: string, storeId: string) => { isBlocked: boolean; reason: string | null };
  handleToggle: (moduleId: string, storeId: string) => Promise<void>;
  toggling: string | null;
}

function SummaryView({
  stores,
  groupedModules,
  categoryNames,
  storeStats,
  storeCategoryStats,
  expandedStores,
  toggleStoreExpand,
  getAccessStatus,
  handleToggle,
  toggling,
}: SummaryViewProps) {
  const getCategoryIcon = (catName: string) => {
    const cat = MODULE_CATEGORIES.find(c => c.name === catName);
    return cat?.icon || Package;
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header com categorias */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-sm min-w-[220px] sticky left-0 bg-muted/50 z-10">
                  Loja
                </th>
                <th className="text-center p-3 font-medium text-xs min-w-[100px]">
                  Status
                </th>
                {categoryNames.map(catName => {
                  const CatIcon = getCategoryIcon(catName);
                  return (
                    <th key={catName} className="p-2 text-center min-w-[100px]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1 cursor-help">
                            <CatIcon className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                              {catName}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{catName}</p>
                          <p className="text-xs text-muted-foreground">
                            {groupedModules[catName]?.length || 0} módulos
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {stores.map((store, index) => {
                const stats = storeStats[store.id];
                const isExpanded = expandedStores.has(store.id);
                const catStats = storeCategoryStats[store.id] || {};
                const pct = stats ? Math.round((stats.enabled / stats.total) * 100) : 0;

                return (
                  <Collapsible key={store.id} open={isExpanded} onOpenChange={() => toggleStoreExpand(store.id)} asChild>
                    <>
                      <CollapsibleTrigger asChild>
                        <tr
                          className={cn(
                            'border-b cursor-pointer transition-colors hover:bg-muted/30',
                            index % 2 === 0 ? 'bg-background' : 'bg-muted/10',
                            isExpanded && 'bg-primary/5'
                          )}
                        >
                          <td className="p-3 sticky left-0 bg-inherit z-10">
                            <div className="flex items-center gap-2">
                              <ChevronRight className={cn(
                                'w-4 h-4 text-muted-foreground transition-transform shrink-0',
                                isExpanded && 'rotate-90'
                              )} />
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{store.name}</p>
                                {store.slug && (
                                  <code className="text-[10px] text-muted-foreground">{store.slug}</code>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={cn(
                                'text-xs font-bold',
                                pct === 100 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'
                              )}>
                                {stats?.enabled}/{stats?.total}
                              </span>
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          {categoryNames.map(catName => {
                            const cs = catStats[catName];
                            if (!cs) return <td key={catName} className="p-2" />;
                            const allActive = cs.enabled === cs.total;
                            const noneActive = cs.enabled === 0;
                            const partial = !allActive && !noneActive;

                            return (
                              <td key={catName} className="p-2 text-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={cn(
                                      'inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold',
                                      allActive && 'bg-green-500/15 text-green-500',
                                      noneActive && 'bg-muted text-muted-foreground',
                                      partial && 'bg-yellow-500/15 text-yellow-600'
                                    )}>
                                      {cs.enabled}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{catName}</p>
                                    <p className="text-xs">{cs.enabled} de {cs.total} ativos</p>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            );
                          })}
                        </tr>
                      </CollapsibleTrigger>

                      {/* Expanded: módulos detalhados */}
                      <CollapsibleContent asChild>
                        <tr className="border-b bg-muted/5">
                          <td colSpan={categoryNames.length + 2} className="p-0">
                            <div className="p-4 space-y-4">
                              {Object.entries(groupedModules).map(([catName, catModules]) => (
                                <div key={catName}>
                                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                    {catName}
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {catModules.map(mod => {
                                      const { isBlocked } = getAccessStatus(mod.id, store.id);
                                      const key = `${mod.id}-${store.id}`;
                                      const isToggling = toggling === key;
                                      const IconComp = getModuleIcon(mod.icon);

                                      return (
                                        <div
                                          key={mod.id}
                                          className={cn(
                                            'flex items-center justify-between gap-2 p-2 rounded-lg border transition-colors',
                                            isBlocked
                                              ? 'border-red-500/20 bg-red-500/5'
                                              : 'border-green-500/20 bg-green-500/5'
                                          )}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <IconComp className={cn(
                                              'w-3.5 h-3.5 shrink-0',
                                              isBlocked ? 'text-red-500' : 'text-green-500'
                                            )} />
                                            <span className="text-xs font-medium truncate">{mod.name}</span>
                                          </div>
                                          {isToggling ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                                          ) : (
                                            <Switch
                                              checked={!isBlocked}
                                              onCheckedChange={() => handleToggle(mod.id, store.id)}
                                              className="scale-75"
                                            />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ===================== DETAILED VIEW (original table) =====================

interface DetailedViewProps {
  filteredStores: Store[];
  filteredModules: ModuleWithStoreAccess[];
  getAccessStatus: (moduleId: string, storeId: string) => { isBlocked: boolean; reason: string | null };
  handleToggle: (moduleId: string, storeId: string) => Promise<void>;
  toggling: string | null;
}

function DetailedView({
  filteredStores,
  filteredModules,
  getAccessStatus,
  handleToggle,
  toggling,
}: DetailedViewProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-sm sticky left-0 bg-muted/50 z-10 min-w-[200px]">
                    Loja
                  </th>
                  {filteredModules.map((module) => {
                    const IconComponent = getModuleIcon(module.icon);
                    return (
                      <th key={module.id} className="p-3 text-center min-w-[120px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-1.5 cursor-help">
                              <div className="p-1.5 rounded-md bg-primary/10">
                                <IconComponent className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-xs font-medium truncate max-w-[100px]">
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
                    className={`border-b hover:bg-muted/30 transition-colors ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    }`}
                  >
                    <td className="p-3 sticky left-0 bg-inherit z-10">
                      <div>
                        <p className="font-medium text-sm">{store.name}</p>
                        {store.slug && (
                          <code className="text-xs text-muted-foreground">{store.slug}</code>
                        )}
                      </div>
                    </td>
                    {filteredModules.map((module) => {
                      const { isBlocked, reason } = getAccessStatus(module.id, store.id);
                      const key = `${module.id}-${store.id}`;
                      const isToggling = toggling === key;

                      return (
                        <td key={module.id} className="p-2 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`w-10 h-10 p-0 rounded-full transition-all ${
                                  isBlocked
                                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-600'
                                    : 'bg-green-500/10 hover:bg-green-500/20 text-green-600'
                                }`}
                                onClick={() => handleToggle(module.id, store.id)}
                                disabled={isToggling}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isBlocked ? (
                                  <XCircle className="w-5 h-5" />
                                ) : (
                                  <CheckCircle className="w-5 h-5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {isBlocked ? 'Bloqueado' : 'Liberado'} - Clique para alternar
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
  );
}
