import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  Plus, 
  Eye, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Phone, 
  Globe, 
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { MarketplaceSavingsCard } from '@/components/admin/MarketplaceSavingsCard';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { MasterAdminKPIs } from '@/components/admin/dashboard/MasterAdminKPIs';
import { GrowthProjections } from '@/components/admin/dashboard/GrowthProjections';
import { RecentActivityReal } from '@/components/admin/dashboard/RecentActivityReal';
import { PendingActions } from '@/components/admin/dashboard/PendingActions';
import { StoreHealthIndicators } from '@/components/admin/dashboard/StoreHealthIndicators';
import { SystemBanner } from '@/components/admin/SystemBanner';
import { LowStockAlert } from '@/components/admin/dashboard/LowStockAlert';
import { StoreDailyKPIs } from '@/components/admin/dashboard/StoreDailyKPIs';
import { StoreRecentActivity } from '@/components/admin/dashboard/StoreRecentActivity';
import { StoreQuickToggle } from '@/components/admin/dashboard/StoreQuickToggle';

interface DashboardStats {
  totalUsers: number;
  totalStores: number;
  totalPlans: number;
  activeStores: number;
}

interface StoreStats {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  activeCategories: number;
  storeName: string;
  storeStatus: string;
  storeCreatedAt: string;
  planName: string | null;
  storeSlug: string;
  storePhone: string | null;
  storeAddress: string | null;
}

const DashboardHome = () => {
  usePageSEO({
    title: 'Dashboard - Mostralo | Painel Administrativo',
    description: 'Painel de controle da Mostralo. Gerencie sua loja, produtos, categorias e acompanhe estatísticas de vendas em tempo real.',
    keywords: 'dashboard mostralo, painel administrativo, gestão loja, estatísticas vendas, controle produtos'
  });

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [storeStats, setStoreStats] = useState<StoreStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionAlert, setSubscriptionAlert] = useState<{
    type: 'expiring' | 'expired' | null;
    daysUntil: number;
    pendingInvoices: number;
    planName: string | null;
  }>({ type: null, daysUntil: 0, pendingInvoices: 0, planName: null });
  const { user, profile, userRole } = useAuth();
  const { toast } = useToast();
  
  // Hook de segurança - valida acesso à loja
  const { storeId: validatedStoreId, storeName, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();

  const fetchMasterAdminStats = async () => {
    try {
      const [usersResult, storesResult, plansResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('stores').select('*', { count: 'exact' }),
        supabase.from('plans').select('*', { count: 'exact' })
      ]);

      const activeStoresResult = await supabase
        .from('stores')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      setStats({
        totalUsers: usersResult.count || 0,
        totalStores: storesResult.count || 0,
        totalPlans: plansResult.count || 0,
        activeStores: activeStoresResult.count || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar estatísticas do dashboard.',
        variant: 'destructive'
      });
    }
  };

  const fetchSubscriptionAlert = async () => {
    if (!user || !validatedStoreId) return;

    try {
      // Buscar dados da loja usando o storeId validado
      const { data: store } = await supabase
        .from('stores')
        .select(`
          id, 
          subscription_expires_at, 
          status,
          plan_id,
          plans:plan_id (name)
        `)
        .eq('id', validatedStoreId)
        .single();

      if (!store) return;

      const { data: invoices } = await supabase
        .from('subscription_invoices')
        .select('*')
        .eq('store_id', store.id)
        .neq('payment_status', 'paid');

      let alertType: 'expiring' | 'expired' | null = null;
      let daysUntil = 0;

      if (store.subscription_expires_at) {
        daysUntil = Math.ceil(
          (new Date(store.subscription_expires_at).getTime() - new Date().getTime()) / 
          (1000 * 60 * 60 * 24)
        );

        if (store.status === 'inactive' || daysUntil < 0) {
          alertType = 'expired';
        } else if (daysUntil <= 5) {
          alertType = 'expiring';
        }
      }

      const plan = (store as any).plans;
      const planName = plan?.name ?? 'Sem Plano';

      setSubscriptionAlert({
        type: alertType,
        daysUntil,
        pendingInvoices: invoices?.length || 0,
        planName: planName
      });
    } catch (error) {
      console.error('Erro ao buscar alertas de assinatura:', error);
    }
  };

  const fetchStoreStats = async () => {
    if (!user || !validatedStoreId) return;

    try {
      // SEGURANÇA: Usar apenas o storeId validado pelo hook
      // Para atendentes: apenas validar storeId (não são donos)
      // Para store_admin: validar storeId + owner_id
      let query = supabase
        .from('stores')
        .select(`
          *,
          plans:plan_id (
            name
          )
        `)
        .eq('id', validatedStoreId);
      
      // Apenas store_admin precisa validar owner_id
      if (userRole === 'store_admin') {
        query = query.eq('owner_id', user.id);
      }
      
      const { data: storeData } = await query.single();

      if (!storeData) {
        setStoreStats({
          totalProducts: 0,
          activeProducts: 0,
          totalCategories: 0,
          activeCategories: 0,
          storeName: 'Nenhuma loja encontrada',
          storeStatus: 'inactive',
          storeCreatedAt: '',
          planName: null,
          storeSlug: '',
          storePhone: null,
          storeAddress: null
        });
        return;
      }

      // Buscar estatísticas da loja (usando head: true para não retornar dados, apenas contagem)
      const [productsResult, activeProductsResult, categoriesResult, activeCategoriesResult] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeData.id),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('store_id', storeData.id).eq('is_available', true),
        supabase.from('categories').select('id', { count: 'exact', head: true }).eq('store_id', storeData.id),
        supabase.from('categories').select('id', { count: 'exact', head: true }).eq('store_id', storeData.id).eq('is_active', true)
      ]);

      setStoreStats({
        totalProducts: productsResult.count || 0,
        activeProducts: activeProductsResult.count || 0,
        totalCategories: categoriesResult.count || 0,
        activeCategories: activeCategoriesResult.count || 0,
        storeName: storeData.name,
        storeStatus: storeData.status,
        storeCreatedAt: storeData.created_at,
        planName: storeData.plans?.name || null,
        storeSlug: storeData.slug,
        storePhone: storeData.phone,
        storeAddress: storeData.address
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas da loja:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar estatísticas da sua loja.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      // Aguardar validação de acesso para store_admins e atendentes
      if ((profile?.user_type === 'store_admin' || userRole === 'attendant') && storeAccessLoading) {
        return;
      }

      // Bloquear se não tem acesso
      if ((profile?.user_type === 'store_admin' || userRole === 'attendant') && !hasAccess) {
        setLoading(false);
        return;
      }

      if (profile?.user_type === 'master_admin') {
        await fetchMasterAdminStats();
      } else if (validatedStoreId) {
        await fetchStoreStats();
        // Apenas buscar alertas de assinatura para store_admin (donos de loja)
        if (userRole === 'store_admin') {
          await fetchSubscriptionAlert();
        }
      }
      setLoading(false);
    };

    if (profile || userRole === 'attendant') {
      fetchData();
    }
  }, [user, profile, userRole, validatedStoreId, hasAccess, storeAccessLoading]);

  if (loading || storeAccessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Validando permissões...</p>
      </div>
    );
  }

  // Bloquear acesso se não autorizado
  if ((profile?.user_type === 'store_admin' || userRole === 'attendant') && !hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">Acesso Negado</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Você não tem permissão para acessar esta página. Entre em contato com o suporte.
        </p>
      </div>
    );
  }

  // Dashboard Executivo para Master Admin
  if (profile?.user_type === 'master_admin' && stats) {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return '☀️ Bom dia';
      if (hour < 18) return '🌤️ Boa tarde';
      return '🌙 Boa noite';
    };

    const currentDate = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return (
      <div className="space-y-4 md:space-y-6">
        {/* Banner do Sistema */}
        <SystemBanner position="dashboard" />
        
        {/* Header Contextual */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              {getGreeting()}, Administrador
            </h1>
            <p className="text-sm text-muted-foreground capitalize">
              {currentDate}
            </p>
          </div>
          {/* Ações Rápidas como Pills */}
          <div className="flex flex-wrap gap-2">
            <NavLink to="/dashboard/users">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Users className="w-3 h-3 mr-1" />
                Usuários
              </Button>
            </NavLink>
            <NavLink to="/dashboard/stores">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Store className="w-3 h-3 mr-1" />
                Lojas
              </Button>
            </NavLink>
            <NavLink to="/dashboard/plans">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Package className="w-3 h-3 mr-1" />
                Planos
              </Button>
            </NavLink>
            <NavLink to="/dashboard/reports">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Relatórios
              </Button>
            </NavLink>
          </div>
        </div>

        {/* KPIs + Ações Urgentes - Responsivo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <MasterAdminKPIs compact />
          <PendingActions />
        </div>

        {/* Projeções e Valuation */}
        <GrowthProjections />

        {/* Atividades Recentes + Saúde das Lojas - Lado a lado no desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <RecentActivityReal />
          <StoreHealthIndicators />
        </div>
      </div>
    );
  }

  // Dashboard para Lojista
  if (storeStats) {
    const storeInfoCards = [
      {
        title: 'Status da Loja',
        value: storeStats.storeStatus === 'active' ? 'Ativa' : 'Inativa',
        description: `Funcionando desde ${new Date(storeStats.storeCreatedAt).toLocaleDateString('pt-BR')}`,
        icon: Store,
        color: storeStats.storeStatus === 'active' ? 'text-green-600' : 'text-red-600',
        bgColor: storeStats.storeStatus === 'active' ? 'bg-green-100' : 'bg-red-100'
      },
      {
        title: 'Plano Atual',
        value: storeStats.planName || 'Nenhum',
        description: 'Plano de assinatura ativo',
        icon: CreditCard,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Cardápio Online',
        value: storeStats.storeSlug ? 'Ativo' : 'Inativo',
        description: storeStats.storeSlug ? `/${storeStats.storeSlug}` : 'URL não configurada',
        icon: Globe,
        color: storeStats.storeSlug ? 'text-green-600' : 'text-yellow-600',
        bgColor: storeStats.storeSlug ? 'bg-green-100' : 'bg-yellow-100'
      },
      {
        title: 'Completude do Perfil',
        value: (() => {
          let completeness = 0;
          if (storeStats.storeName) completeness += 25;
          if (storeStats.storePhone) completeness += 25;
          if (storeStats.storeAddress) completeness += 25;
          if (storeStats.totalProducts > 0) completeness += 25;
          return `${completeness}%`;
        })(),
        description: 'Informações da loja preenchidas',
        icon: CheckCircle,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      }
    ];

    const businessCards = [
      {
        title: 'Taxa de Produtos Ativos',
        value: storeStats.totalProducts > 0 ? 
          `${Math.round((storeStats.activeProducts / storeStats.totalProducts) * 100)}%` : 
          '0%',
        description: `${storeStats.activeProducts} de ${storeStats.totalProducts} produtos`,
        icon: Package,
        trend: storeStats.activeProducts === storeStats.totalProducts ? 'Todos ativos' : 'Alguns inativos'
      },
      {
        title: 'Organização',
        value: storeStats.totalCategories,
        description: `${storeStats.activeCategories} categorias ativas`,
        icon: TrendingUp,
        trend: storeStats.totalCategories > 0 ? 'Bem organizado' : 'Adicione categorias'
      },
      {
        title: 'Contato',
        value: storeStats.storePhone ? 'Configurado' : 'Pendente',
        description: storeStats.storePhone || 'Adicione telefone',
        icon: Phone,
        trend: storeStats.storePhone ? 'Completo' : 'Configure contato'
      },
      {
        title: 'Localização',
        value: storeStats.storeAddress ? 'Configurada' : 'Pendente',
        description: storeStats.storeAddress ? 'Endereço definido' : 'Adicione endereço',
        icon: MapPin,
        trend: storeStats.storeAddress ? 'Completo' : 'Configure localização'
      }
    ];

    return (
      <div className="space-y-4 md:space-y-6">
        {/* Header compacto */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{storeStats.storeName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={storeStats.storeStatus === 'active' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {storeStats.storeStatus === 'active' ? 'Ativa' : 'Inativa'}
              </Badge>
              {storeStats.planName && (
                <Badge variant="outline" className="text-xs">
                  {storeStats.planName}
                </Badge>
              )}
            </div>
          </div>
          {/* Toggle de abrir/fechar loja + Ações rápidas */}
          <div className="flex flex-wrap items-center gap-2">
            <StoreQuickToggle storeId={validatedStoreId} variant="compact" />
            <NavLink to="/dashboard/orders">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <ShoppingCart className="w-3 h-3 mr-1" />
                Pedidos
              </Button>
            </NavLink>
            <NavLink to="/dashboard/products">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Package className="w-3 h-3 mr-1" />
                Produtos
              </Button>
            </NavLink>
            <NavLink to={`/${storeStats.storeSlug}`} target="_blank">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Ver Loja
              </Button>
            </NavLink>
          </div>
        </div>

        {/* Banner do Sistema */}
        <SystemBanner position="dashboard" />

        {/* KPIs do Dia - Barra horizontal */}
        <StoreDailyKPIs storeId={validatedStoreId} />

        {/* Alerta de Assinatura */}
        {subscriptionAlert.type && (
          <Card className={`border-2 ${
            subscriptionAlert.type === 'expired' 
              ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
              : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className={`h-5 w-5 ${
                  subscriptionAlert.type === 'expired' ? 'text-red-600' : 'text-yellow-600'
                }`} />
                {subscriptionAlert.type === 'expired' 
                  ? 'Assinatura Expirada' 
                  : 'Assinatura Próxima ao Vencimento'}
              </CardTitle>
              <CardDescription className={
                subscriptionAlert.type === 'expired' ? 'text-red-700' : 'text-yellow-700'
              }>
                {subscriptionAlert.type === 'expired'
                  ? `Plano ${subscriptionAlert.planName} expirou há ${Math.abs(subscriptionAlert.daysUntil)} dia(s).`
                  : `Plano ${subscriptionAlert.planName} vence em ${subscriptionAlert.daysUntil} dia(s).`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <NavLink to="/dashboard/subscription">
                <Button size="sm" variant={subscriptionAlert.type === 'expired' ? 'destructive' : 'default'}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Regularizar
                </Button>
              </NavLink>
            </CardContent>
          </Card>
        )}

        {/* Grid Principal - 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Coluna Esquerda */}
          <div className="space-y-4">
            {/* Estoque Baixo */}
            <LowStockAlert storeId={validatedStoreId} maxItems={4} />
            
            {/* Economia de Marketplace - Compacto */}
            <MarketplaceSavingsCard variant="compact" />
          </div>
          
          {/* Coluna Direita */}
          <div className="space-y-4">
            {/* Atividade Recente */}
            <StoreRecentActivity storeId={validatedStoreId} maxItems={5} />
          </div>
        </div>

        {/* Cards de Informações e Estatísticas - Grid 2x2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Informações da Loja */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                Informações da Loja
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                {storeInfoCards.map((card, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`${card.bgColor} p-1.5 rounded-md`}>
                        <card.icon className={`h-3 w-3 ${card.color}`} />
                      </div>
                      <span className="text-xs text-muted-foreground">{card.title}</span>
                    </div>
                    <p className="text-sm font-semibold">{card.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas do Negócio */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Estatísticas do Negócio
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                {businessCards.map((card, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <card.icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{card.title}</span>
                    </div>
                    <p className="text-sm font-semibold">{card.value}</p>
                    <p className="text-[10px] text-primary">{card.trend}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas e Recomendações - Compacto */}
        {(!storeStats.storePhone || !storeStats.storeAddress || storeStats.totalProducts === 0) && (
          <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-yellow-800 dark:text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                Complete sua Loja
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {!storeStats.storePhone && (
                  <NavLink to="/dashboard/my-store">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Phone className="w-3 h-3 mr-1" />
                      Adicionar Telefone
                    </Button>
                  </NavLink>
                )}
                {!storeStats.storeAddress && (
                  <NavLink to="/dashboard/my-store">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      Adicionar Endereço
                    </Button>
                  </NavLink>
                )}
                {storeStats.totalProducts === 0 && (
                  <NavLink to="/dashboard/products">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Package className="w-3 h-3 mr-1" />
                      Adicionar Produtos
                    </Button>
                  </NavLink>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ações Rápidas e Próximos Passos - Grid 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Ações Rápidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                <NavLink to="/dashboard/products">
                  <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Novo Produto
                  </Button>
                </NavLink>
                <NavLink to="/dashboard/categories">
                  <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Nova Categoria
                  </Button>
                </NavLink>
                <NavLink to="/dashboard/my-store">
                  <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs">
                    <Store className="w-3 h-3 mr-1" />
                    Configurar Loja
                  </Button>
                </NavLink>
                <NavLink to="/dashboard/reports">
                  <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Relatórios
                  </Button>
                </NavLink>
              </div>
            </CardContent>
          </Card>

          {/* Status e Próximos Passos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Status da Loja
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Loja configurada</p>
                    <p className="text-[10px] text-muted-foreground">
                      {storeStats.totalProducts} produto(s) • {storeStats.totalCategories} categoria(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${storeStats.storeSlug ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Cardápio Online</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {storeStats.storeSlug ? `/${storeStats.storeSlug}` : 'Configure seu link'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${storeStats.storePhone ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Contato</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {storeStats.storePhone || 'Adicione telefone'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default DashboardHome;