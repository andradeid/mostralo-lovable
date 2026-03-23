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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" />
            Gerenciar Acesso a Módulos
          </h1>
          <p className="text-muted-foreground mt-1">
            Controle quais lojas têm acesso a cada módulo
          </p>
        </div>
        <Button variant="outline" onClick={refetch}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 text-center">
            <Package className="w-5 h-5 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold text-primary">{stats.totalModules}</div>
            <div className="text-xs text-muted-foreground">Módulos</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-4 text-center">
            <Store className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-600">{stats.totalStores}</div>
            <div className="text-xs text-muted-foreground">Lojas</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="p-4 text-center">
            <Unlock className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-600">{stats.totalEnabled}</div>
            <div className="text-xs text-muted-foreground">Liberados</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10">
          <CardContent className="p-4 text-center">
            <Lock className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-600">{stats.totalBlocks}</div>
            <div className="text-xs text-muted-foreground">Bloqueados</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <ModuleAccessFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            moduleFilter={moduleFilter}
            onModuleFilterChange={setModuleFilter}
            modules={modules}
          />
        </CardContent>
      </Card>

      {/* Tabs de Visualização */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'cards' | 'matrix')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            Cards por Módulo
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center gap-2">
            <Table className="w-4 h-4" />
            Matriz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-4">
          <ModuleCardsView
            modules={modules}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            moduleFilter={moduleFilter}
            onBulkBlock={bulkBlockModule}
            onBulkUnblock={bulkUnblockModule}
          />
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
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
        <CardContent className="p-4 flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10 shrink-0">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Como funciona</p>
            <p className="text-sm text-muted-foreground mt-1">
              Por padrão, todos os módulos estão <strong>liberados</strong> para todas as lojas.
              Ao bloquear um módulo, a loja perde acesso à funcionalidade correspondente.
              Use a visualização em <strong>Cards</strong> para ações em massa ou a <strong>Matriz</strong> para visão geral e toggles rápidos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModuleAccessManagementPage;
