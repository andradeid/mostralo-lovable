import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageSEO } from '@/hooks/useSEO';
import { useModuleStoreManagement } from '@/hooks/useModuleStoreManagement';
import { ModuleAccessFilters } from '@/components/admin/modules/ModuleAccessFilters';
import { ModuleCardsView } from '@/components/admin/modules/ModuleCardsView';
import { ModuleMatrixView } from '@/components/admin/modules/ModuleMatrixView';
import { 
  Package, LayoutGrid, Table, Store, Lock, Unlock, 
  RefreshCw, Zap, Star, Sparkles, ShieldCheck, TrendingUp,
  AlertTriangle, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ModuleAccessManagementPage = () => {
  usePageSEO({
    title: 'Gerenciar Acesso a Módulos - Mostralo',
    description: 'Gerencie o acesso de módulos por loja no sistema Mostralo.',
    keywords: 'módulos mostralo, acesso, lojas, gestão'
  });

  const { modules, stores, loading, error, bulkBlockModule, bulkUnblockModule, toggleModuleForStore, refetch } = useModuleStoreManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'blocked' | 'enabled'>('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');

  // Classificação de importância
  const CRITICAL_KEYS = ['cardapio', 'cardapio_mesa', 'pedidos', 'booking', 'agendamento', 'pdv', 'comandas', 'whatsapp', 'conexao_whatsapp'];
  const IMPORTANT_KEYS = ['financeiro', 'comissoes', 'crm', 'clientes', 'delivery', 'estoque', 'atendentes', 'chat', 'kds', 'profissionais', 'avaliacoes'];

  const getImportance = (key: string | null) => {
    if (!key) return 'advanced';
    const k = key.toLowerCase();
    if (CRITICAL_KEYS.some(c => k.includes(c))) return 'critical';
    if (IMPORTANT_KEYS.some(c => k.includes(c))) return 'important';
    return 'advanced';
  };

  // Estatísticas
  const stats = useMemo(() => {
    const totalBlocks = modules.reduce((acc, m) => acc + m.blockedCount, 0);
    const totalEnabled = modules.reduce((acc, m) => acc + m.enabledCount, 0);
    const totalCombinations = modules.length * stores.length;
    const enabledPct = totalCombinations > 0 ? Math.round((totalEnabled / totalCombinations) * 100) : 0;

    // Breakdown por importância
    let criticalCount = 0, importantCount = 0, advancedCount = 0;
    let criticalBlocked = 0;
    let storesWithoutCritical = new Set<string>();

    modules.forEach(m => {
      const imp = getImportance(m.key);
      if (imp === 'critical') {
        criticalCount++;
        criticalBlocked += m.blockedCount;
        m.storeAccess.forEach(s => {
          if (s.isBlocked) storesWithoutCritical.add(s.storeId);
        });
      }
      else if (imp === 'important') importantCount++;
      else advancedCount++;
    });

    // Oportunidades: módulos com alta taxa de bloqueio que poderiam ser liberados
    const opportunities = modules
      .filter(m => m.blockedCount > m.totalStores * 0.5 && getImportance(m.key) !== 'advanced')
      .length;

    return {
      totalModules: modules.length,
      totalStores: stores.length,
      totalBlocks,
      totalEnabled,
      totalCombinations,
      enabledPct,
      criticalCount,
      importantCount,
      advancedCount,
      criticalBlocked,
      storesWithoutCritical: storesWithoutCritical.size,
      opportunities,
    };
  }, [modules, stores]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refetch}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" />
            Gerenciar Acesso a Módulos
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Controle quais lojas têm acesso a cada módulo
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards analíticos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Card: Saúde do Sistema */}
        <Card className="sm:col-span-2 lg:col-span-1 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Saúde do Sistema</p>
                <p className="text-[10px] text-muted-foreground">Módulos ativos no ecossistema</p>
              </div>
            </div>
            <div className="flex items-end gap-3 mb-2">
              <span className={cn(
                'text-3xl font-bold',
                stats.enabledPct >= 70 ? 'text-green-500' : stats.enabledPct >= 40 ? 'text-yellow-500' : 'text-red-500'
              )}>
                {stats.enabledPct}%
              </span>
              <span className="text-xs text-muted-foreground mb-1">
                {stats.totalEnabled} de {stats.totalCombinations} ativações
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  stats.enabledPct >= 70 ? 'bg-green-500' : stats.enabledPct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${stats.enabledPct}%` }}
              />
            </div>
            {(stats.storesWithoutCritical > 0 || stats.criticalBlocked > 0) && (
              <div className="space-y-1">
                {stats.storesWithoutCritical > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-yellow-600">
                    <AlertTriangle className="w-3 h-3" />
                    {stats.storesWithoutCritical} loja(s) sem módulos críticos
                  </div>
                )}
                {stats.criticalBlocked > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500">
                    <Lock className="w-3 h-3" />
                    {stats.criticalBlocked} bloqueios em módulos críticos
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card: Módulos (breakdown) */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{stats.totalModules} Módulos</p>
                <p className="text-[10px] text-muted-foreground">Breakdown por importância</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-red-500" />
                  <span className="text-xs">Críticos</span>
                </div>
                <Badge variant="outline" className="text-[10px] h-5 bg-red-500/10 text-red-600 border-red-500/20">
                  {stats.criticalCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs">Importantes</span>
                </div>
                <Badge variant="outline" className="text-[10px] h-5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  {stats.importantCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span className="text-xs">Avançados</span>
                </div>
                <Badge variant="outline" className="text-[10px] h-5 bg-blue-500/10 text-blue-600 border-blue-500/20">
                  {stats.advancedCount}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card: Lojas + Liberados + Bloqueados */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">{stats.totalStores} Lojas</p>
                <p className="text-[10px] text-muted-foreground">Distribuição de acessos</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 rounded-lg bg-green-500/5">
                <Unlock className="w-4 h-4 text-green-600 mx-auto mb-0.5" />
                <div className="text-lg font-bold text-green-600">{stats.totalEnabled}</div>
                <div className="text-[10px] text-muted-foreground">Liberados</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-500/5">
                <Lock className="w-4 h-4 text-red-600 mx-auto mb-0.5" />
                <div className="text-lg font-bold text-red-600">{stats.totalBlocks}</div>
                <div className="text-[10px] text-muted-foreground">Bloqueados</div>
              </div>
            </div>
            {stats.opportunities > 0 && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-primary">
                <Lightbulb className="w-3 h-3" />
                {stats.opportunities} módulo(s) com oportunidade de expansão
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtros + Tabs unificados */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3">
            <ModuleAccessFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              moduleFilter={moduleFilter}
              onModuleFilterChange={setModuleFilter}
              modules={modules}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Visualização */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'cards' | 'matrix')}>
        <TabsList className="w-full max-w-xs grid grid-cols-2">
          <TabsTrigger value="cards" className="flex items-center gap-2 text-sm">
            <LayoutGrid className="w-4 h-4" />
            Cards por Módulo
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2 text-sm">
            <Table className="w-4 h-4" />
            Matriz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-3">
          <ModuleCardsView
            modules={modules}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            moduleFilter={moduleFilter}
            onBulkBlock={bulkBlockModule}
            onBulkUnblock={bulkUnblockModule}
          />
        </TabsContent>

        <TabsContent value="matrix" className="mt-3">
          <ModuleMatrixView
            modules={modules}
            stores={stores}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            moduleFilter={moduleFilter}
            onToggle={toggleModuleForStore}
          />
        </TabsContent>
      </Tabs>

      {/* Dica informativa */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-3 flex items-start gap-3">
          <div className="p-1.5 rounded-full bg-primary/10 shrink-0">
            <Package className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">
            Por padrão, todos os módulos estão <strong>liberados</strong>. Ao bloquear, a loja perde acesso à funcionalidade.
            Use <strong>Cards</strong> para ações em massa ou <strong>Matriz</strong> para toggles rápidos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModuleAccessManagementPage;
