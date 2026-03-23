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
  Image, Menu, Wallet, Printer, Utensils, ExternalLink,
  QrCode, Monitor, Palette, Tag, Code, Target, BarChart,
  LucideIcon, Zap, Star, Sparkles, AlertTriangle, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Mapa de ícones para módulos
const moduleIconMap: Record<string, LucideIcon> = {
  'BarChart3': BarChart3, 'BarChart': BarChart, 'MessageSquare': MessageSquare,
  'Users': Users, 'Truck': Truck, 'Store': Store, 'Settings': Settings,
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

// Classificação de importância dos módulos por key
type ImportanceLevel = 'critical' | 'important' | 'advanced';

const MODULE_IMPORTANCE: Record<string, ImportanceLevel> = {
  // Críticos - funcionalidades core
  'cardapio': 'critical', 'cardapio_mesa': 'critical', 'pedidos': 'critical',
  'booking': 'critical', 'agendamento': 'critical', 'pdv': 'critical',
  'comandas': 'critical', 'whatsapp': 'critical', 'conexao_whatsapp': 'critical',
  // Importantes - funcionalidades de valor
  'financeiro': 'important', 'comissoes': 'important', 'crm': 'important',
  'clientes': 'important', 'delivery': 'important', 'estoque': 'important',
  'atendentes': 'important', 'chat': 'important', 'kds': 'important',
  'profissionais': 'important', 'avaliacoes': 'important',
  // Avançados - funcionalidades extras
  'banners': 'advanced', 'cupons': 'advanced', 'fidelidade': 'advanced',
  'clube': 'advanced', 'assistente_ia': 'advanced', 'totem': 'advanced',
  'personalizacao': 'advanced', 'qrcode': 'advanced', 'marketing': 'advanced',
  'cross_sell': 'advanced', 'prontuario': 'advanced', 'assinatura': 'advanced',
  'chamada_senha': 'advanced', 'impressao': 'advanced', 'nfe': 'advanced',
};

function getModuleImportance(key: string | null): ImportanceLevel {
  if (!key) return 'advanced';
  const keyLower = key.toLowerCase();
  for (const [k, v] of Object.entries(MODULE_IMPORTANCE)) {
    if (keyLower.includes(k)) return v;
  }
  return 'advanced';
}

const importanceConfig: Record<ImportanceLevel, { label: string; color: string; icon: LucideIcon }> = {
  critical: { label: 'Crítico', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: Zap },
  important: { label: 'Importante', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Star },
  advanced: { label: 'Avançado', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Sparkles },
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
  const [recentlyChanged, setRecentlyChanged] = useState<Set<string>>(new Set());

  // Filtrar módulos
  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      if (moduleFilter !== 'all' && module.id !== moduleFilter) return false;
      return true;
    });
  }, [modules, moduleFilter]);

  // Ordenar: críticos primeiro, depois importantes, depois avançados
  const sortedModules = useMemo(() => {
    const order: Record<ImportanceLevel, number> = { critical: 0, important: 1, advanced: 2 };
    return [...filteredModules].sort((a, b) => {
      const ia = getModuleImportance(a.key);
      const ib = getModuleImportance(b.key);
      return order[ia] - order[ib];
    });
  }, [filteredModules]);

  // Gerar insights por módulo
  function getModuleInsights(module: ModuleWithStoreAccess): string[] {
    const insights: string[] = [];
    const blockedPct = module.totalStores > 0 ? Math.round((module.blockedCount / module.totalStores) * 100) : 0;
    
    if (module.blockedCount === 0) {
      insights.push('✅ Liberado para todas as lojas');
    } else if (module.blockedCount === module.totalStores) {
      insights.push('🚫 Bloqueado em todas as lojas');
    } else {
      insights.push(`⚠️ ${module.blockedCount} loja(s) sem acesso (${blockedPct}%)`);
    }

    const importance = getModuleImportance(module.key);
    if (importance === 'critical' && module.blockedCount > 0) {
      insights.push('🔴 Módulo crítico bloqueado em algumas lojas');
    }

    if (module.enabledCount > 0 && module.enabledCount <= 3) {
      insights.push(`💡 Apenas ${module.enabledCount} loja(s) usando este módulo`);
    }

    return insights.slice(0, 2);
  }

  const toggleExpanded = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const toggleStoreSelection = (moduleId: string, storeId: string) => {
    setSelectedStores((prev) => {
      const moduleSelection = new Set(prev[moduleId] || []);
      if (moduleSelection.has(storeId)) moduleSelection.delete(storeId);
      else moduleSelection.add(storeId);
      return { ...prev, [moduleId]: moduleSelection };
    });
  };

  const selectAllStores = (moduleId: string, stores: StoreAccessStatus[]) => {
    const filtered = getFilteredStores(stores);
    setSelectedStores((prev) => ({
      ...prev,
      [moduleId]: new Set(filtered.map((s) => s.storeId)),
    }));
  };

  const deselectAllStores = (moduleId: string) => {
    setSelectedStores((prev) => ({ ...prev, [moduleId]: new Set() }));
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

  // Ordenar lojas: liberadas primeiro, depois bloqueadas
  const getSortedStores = (stores: StoreAccessStatus[]) => {
    return [...getFilteredStores(stores)].sort((a, b) => {
      if (a.isBlocked === b.isBlocked) return a.storeName.localeCompare(b.storeName);
      return a.isBlocked ? 1 : -1;
    });
  };

  const markChanged = (storeIds: string[]) => {
    const keys = new Set(storeIds);
    setRecentlyChanged(keys);
    setTimeout(() => setRecentlyChanged(new Set()), 2000);
  };

  const handleBulkBlock = async (moduleId: string) => {
    const selected = selectedStores[moduleId];
    if (!selected || selected.size === 0) { toast.error('Selecione pelo menos uma loja'); return; }
    setProcessing(moduleId);
    const success = await onBulkBlock(moduleId, Array.from(selected));
    setProcessing(null);
    if (success) {
      toast.success(`${selected.size} loja(s) bloqueada(s) com sucesso`);
      markChanged(Array.from(selected));
      deselectAllStores(moduleId);
    } else { toast.error('Erro ao bloquear lojas'); }
  };

  const handleBulkUnblock = async (moduleId: string) => {
    const selected = selectedStores[moduleId];
    if (!selected || selected.size === 0) { toast.error('Selecione pelo menos uma loja'); return; }
    setProcessing(moduleId);
    const success = await onBulkUnblock(moduleId, Array.from(selected));
    setProcessing(null);
    if (success) {
      toast.success(`${selected.size} loja(s) liberada(s) com sucesso`);
      markChanged(Array.from(selected));
      deselectAllStores(moduleId);
    } else { toast.error('Erro ao liberar lojas'); }
  };

  // Ação rápida: liberar todas as bloqueadas
  const handleUnblockAll = async (moduleId: string, stores: StoreAccessStatus[]) => {
    const blocked = stores.filter(s => s.isBlocked).map(s => s.storeId);
    if (blocked.length === 0) { toast.info('Nenhuma loja bloqueada'); return; }
    setProcessing(moduleId);
    const success = await onBulkUnblock(moduleId, blocked);
    setProcessing(null);
    if (success) {
      toast.success(`${blocked.length} loja(s) liberada(s)`);
      markChanged(blocked);
    }
  };

  // Ação rápida: bloquear todas
  const handleBlockAll = async (moduleId: string, stores: StoreAccessStatus[]) => {
    const enabled = stores.filter(s => !s.isBlocked).map(s => s.storeId);
    if (enabled.length === 0) { toast.info('Nenhuma loja liberada'); return; }
    setProcessing(moduleId);
    const success = await onBulkBlock(moduleId, enabled);
    setProcessing(null);
    if (success) {
      toast.success(`${enabled.length} loja(s) bloqueada(s)`);
      markChanged(enabled);
    }
  };

  if (sortedModules.length === 0) {
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
      {sortedModules.map((module) => {
        const isExpanded = expandedModules.has(module.id);
        const sortedStores = getSortedStores(module.storeAccess);
        const selected = selectedStores[module.id] || new Set();
        const isProcessing = processing === module.id;
        const importance = getModuleImportance(module.key);
        const impConfig = importanceConfig[importance];
        const ImpIcon = impConfig.icon;
        const insights = getModuleInsights(module);
        const enabledPct = module.totalStores > 0 ? Math.round((module.enabledCount / module.totalStores) * 100) : 0;

        return (
          <Card key={module.id} className={cn(
            'overflow-hidden transition-all',
            isExpanded && 'ring-1 ring-primary/20'
          )}>
            <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(module.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                        {(() => {
                          const IconComponent = getModuleIcon(module.icon);
                          return <IconComponent className="w-5 h-5 text-primary" />;
                        })()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{module.name}</CardTitle>
                          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5', impConfig.color)}>
                            <ImpIcon className="w-3 h-3 mr-0.5" />
                            {impConfig.label}
                          </Badge>
                        </div>
                        {module.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {module.description}
                          </p>
                        )}
                        {/* Insights inline */}
                        {insights.length > 0 && (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                            {insights.map((insight, i) => (
                              <span key={i} className="text-[11px] text-muted-foreground">{insight}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Barra de progresso mini */}
                      <div className="hidden sm:flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground font-medium">{enabledPct}%</span>
                        <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              enabledPct === 100 ? 'bg-green-500' : enabledPct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            )}
                            style={{ width: `${enabledPct}%` }}
                          />
                        </div>
                      </div>
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
                  {/* Ações rápidas */}
                  <div className="flex flex-wrap items-center gap-2 py-3 border-b mb-3">
                    <span className="text-xs font-medium text-muted-foreground mr-1">Ações rápidas:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-green-600 border-green-500/30 hover:bg-green-500/10"
                      onClick={() => handleUnblockAll(module.id, module.storeAccess)}
                      disabled={isProcessing || module.blockedCount === 0}
                    >
                      <Unlock className="w-3 h-3 mr-1" />
                      Liberar todas ({module.blockedCount})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-red-600 border-red-500/30 hover:bg-red-500/10"
                      onClick={() => handleBlockAll(module.id, module.storeAccess)}
                      disabled={isProcessing || module.enabledCount === 0}
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      Bloquear todas ({module.enabledCount})
                    </Button>
                  </div>

                  {/* Barra de seleção */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => selectAllStores(module.id, module.storeAccess)}>
                        Selecionar tudo
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => deselectAllStores(module.id)}>
                        Limpar
                      </Button>
                      {selected.size > 0 && (
                        <Badge variant="secondary" className="text-xs">{selected.size} selecionada(s)</Badge>
                      )}
                    </div>
                    {selected.size > 0 && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 border-red-500/30 hover:bg-red-500/10"
                          onClick={() => handleBulkBlock(module.id)} disabled={isProcessing}>
                          <Lock className="w-3 h-3 mr-1" /> Bloquear
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs text-green-600 border-green-500/30 hover:bg-green-500/10"
                          onClick={() => handleBulkUnblock(module.id)} disabled={isProcessing}>
                          <Unlock className="w-3 h-3 mr-1" /> Liberar
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Lista de lojas */}
                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {sortedStores.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma loja encontrada com os filtros aplicados.
                      </p>
                    ) : (
                      sortedStores.map((store) => {
                        const changed = recentlyChanged.has(store.storeId);
                        return (
                          <div
                            key={store.storeId}
                            className={cn(
                              'flex items-center justify-between p-2.5 rounded-lg transition-all',
                              'hover:bg-muted/60',
                              store.isBlocked ? 'bg-red-500/[0.03]' : 'bg-green-500/[0.03]',
                              changed && 'ring-2 ring-primary/40 animate-pulse'
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Checkbox
                                checked={selected.has(store.storeId)}
                                onCheckedChange={() => toggleStoreSelection(module.id, store.storeId)}
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[200px]">{store.storeName}</p>
                                {store.storeSlug && (
                                  <code className="text-[10px] text-muted-foreground truncate block max-w-[180px]">{store.storeSlug}</code>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'shrink-0 text-xs',
                                store.isBlocked
                                  ? 'bg-red-500/10 text-red-600 border-red-500/20'
                                  : 'bg-green-500/10 text-green-600 border-green-500/20'
                              )}
                            >
                              {store.isBlocked ? (
                                <><XCircle className="w-3 h-3 mr-1" /> Bloqueado</>
                              ) : (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Liberado</>
                              )}
                            </Badge>
                          </div>
                        );
                      })
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
