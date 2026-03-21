import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, Users, Store, Package, ShoppingCart, Plus, Eye, TrendingUp, 
  Calendar, MapPin, Phone, Globe, CreditCard, CheckCircle, AlertCircle, Clock
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
import { OperationalStatus } from '@/components/admin/dashboard/OperationalStatus';
import { AdaptiveKPIs } from '@/components/admin/dashboard/AdaptiveKPIs';
import { NowBlock } from '@/components/admin/dashboard/NowBlock';
import { TodayTimeline } from '@/components/admin/dashboard/TodayTimeline';
import { DashboardAlerts } from '@/components/admin/dashboard/DashboardAlerts';
import { TeamHighlights } from '@/components/admin/dashboard/TeamHighlights';
import { OccupancyBlock } from '@/components/admin/dashboard/OccupancyBlock';
import { ShopNowBlock } from '@/components/admin/dashboard/ShopNowBlock';
import { ShopSalesChart } from '@/components/admin/dashboard/ShopSalesChart';
import { ShopTopProducts } from '@/components/admin/dashboard/ShopTopProducts';
import { ShopOrderFunnel } from '@/components/admin/dashboard/ShopOrderFunnel';
import { ShopInsights } from '@/components/admin/dashboard/ShopInsights';
import { ShopCustomerStats } from '@/components/admin/dashboard/ShopCustomerStats';
import { ShopOperationCenter } from '@/components/admin/dashboard/ShopOperationCenter';
import { ShopDashboardState } from '@/components/admin/dashboard/ShopDashboardState';
import { useModuleEnabled } from '@/hooks/useModuleEnabled';
import { useDashboardPreference, resolveEffectiveMode } from '@/hooks/useDashboardPreference';
import { useShopDashboardMode } from '@/hooks/useShopDashboardMode';

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
  const { storeId: validatedStoreId, storeName, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();

  // Módulos ativos + preferência do usuário
  const rawBookingEnabled = useModuleEnabled('booking');
  const rawShopEnabled = useModuleEnabled('catalog');
  const { mode: dashboardPref } = useDashboardPreference();
  const { effectiveBooking: bookingEnabled, effectiveShop: shopEnabled } = resolveEffectiveMode(
    dashboardPref, rawBookingEnabled, rawShopEnabled
  );
  const { data: shopMode } = useShopDashboardMode(shopEnabled && !bookingEnabled ? validatedStoreId : null);

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
      let query = supabase
        .from('stores')
        .select(`
          *,
          plans:plan_id (
            name
          )
        `)
        .eq('id', validatedStoreId);
      
      if (userRole === 'store_admin') {
        query = query.eq('owner_id', user.id);
      }
      
      const { data: storeData } = await query.single();

      if (!storeData) {
        setStoreStats({
          totalProducts: 0, activeProducts: 0, totalCategories: 0,
          activeCategories: 0, storeName: 'Nenhuma loja encontrada',
          storeStatus: 'inactive', storeCreatedAt: '', planName: null,
          storeSlug: '', storePhone: null, storeAddress: null
        });
        return;
      }

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
      if ((profile?.user_type === 'store_admin' || userRole === 'attendant') && storeAccessLoading) return;
      if ((profile?.user_type === 'store_admin' || userRole === 'attendant') && !hasAccess) {
        setLoading(false);
        return;
      }

      if (profile?.user_type === 'master_admin') {
        await fetchMasterAdminStats();
      } else if (validatedStoreId) {
        await fetchStoreStats();
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

  // ========== MASTER ADMIN DASHBOARD ==========
  if (profile?.user_type === 'master_admin' && stats) {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return '☀️ Bom dia';
      if (hour < 18) return '🌤️ Boa tarde';
      return '🌙 Boa noite';
    };

    const currentDate = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
      <div className="space-y-4 md:space-y-6">
        <SystemBanner position="dashboard" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              {getGreeting()}, Administrador
            </h1>
            <p className="text-sm text-muted-foreground capitalize">{currentDate}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <NavLink to="/dashboard/users">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Users className="w-3 h-3 mr-1" /> Usuários
              </Button>
            </NavLink>
            <NavLink to="/dashboard/stores">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Store className="w-3 h-3 mr-1" /> Lojas
              </Button>
            </NavLink>
            <NavLink to="/dashboard/plans">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Package className="w-3 h-3 mr-1" /> Planos
              </Button>
            </NavLink>
            <NavLink to="/dashboard/reports">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <TrendingUp className="w-3 h-3 mr-1" /> Relatórios
              </Button>
            </NavLink>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <MasterAdminKPIs compact />
          <PendingActions />
        </div>
        <GrowthProjections />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <RecentActivityReal />
          <StoreHealthIndicators />
        </div>
      </div>
    );
  }

  // ========== STORE ADMIN / ATTENDANT DASHBOARD (COMMAND CENTER) ==========
  if (storeStats) {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return '☀️ Bom dia';
      if (hour < 18) return '🌤️ Boa tarde';
      return '🌙 Boa noite';
    };

    const currentDate = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });

    // Ações rápidas adaptativas
    const quickActions = [];
    if (bookingEnabled) {
      quickActions.push(
        { label: 'Novo Agendamento', icon: Plus, to: '/dashboard/booking?new=true', primary: true },
        { label: 'Ver Agenda', icon: Calendar, to: '/dashboard/booking' },
        { label: 'Profissionais', icon: Users, to: '/dashboard/booking/profissionais' },
      );
    }
    if (shopEnabled) {
      quickActions.push(
        { label: 'Pedidos', icon: ShoppingCart, to: '/dashboard/orders' },
        { label: 'Produtos', icon: Package, to: '/dashboard/products' },
      );
    }
    quickActions.push(
      { label: 'Relatórios', icon: TrendingUp, to: bookingEnabled ? '/dashboard/booking/reports' : '/dashboard/reports' },
    );
    if (storeStats.storeSlug) {
      quickActions.push(
        { label: 'Ver Loja', icon: Eye, to: `/loja/${storeStats.storeSlug}`, external: true },
      );
    }

    return (
      <div className="space-y-4 md:space-y-5 pb-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{getGreeting()}</p>
            <h1 className="text-xl md:text-2xl font-bold">{storeStats.storeName}</h1>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{currentDate}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StoreQuickToggle storeId={validatedStoreId} variant="compact" />
            {storeStats.planName && (
              <Badge variant="outline" className="text-xs">{storeStats.planName}</Badge>
            )}
          </div>
        </div>

        {/* Status Operacional */}
        <OperationalStatus storeId={validatedStoreId} />

        {/* Banner do Sistema */}
        <SystemBanner position="dashboard" />

        {/* Alerta de Assinatura */}
        {subscriptionAlert.type && (
          <Card className={`border-2 ${
            subscriptionAlert.type === 'expired' 
              ? 'border-destructive bg-destructive/5' 
              : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className={`h-5 w-5 ${
                  subscriptionAlert.type === 'expired' ? 'text-destructive' : 'text-yellow-600'
                }`} />
                {subscriptionAlert.type === 'expired' ? 'Assinatura Expirada' : 'Assinatura Próxima ao Vencimento'}
              </CardTitle>
              <CardDescription>
                {subscriptionAlert.type === 'expired'
                  ? `Plano ${subscriptionAlert.planName} expirou há ${Math.abs(subscriptionAlert.daysUntil)} dia(s).`
                  : `Plano ${subscriptionAlert.planName} vence em ${subscriptionAlert.daysUntil} dia(s).`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <NavLink to="/dashboard/subscription">
                <Button size="sm" variant={subscriptionAlert.type === 'expired' ? 'destructive' : 'default'}>
                  <CreditCard className="w-4 h-4 mr-2" /> Regularizar
                </Button>
              </NavLink>
            </CardContent>
          </Card>
        )}

        {/* KPIs Adaptativos */}
        <AdaptiveKPIs 
          storeId={validatedStoreId} 
          bookingEnabled={bookingEnabled} 
          shopEnabled={shopEnabled} 
        />

        {/* Alertas inteligentes */}
        <DashboardAlerts storeId={validatedStoreId} bookingEnabled={bookingEnabled} />

        {/* Insights da loja (se shop focado) */}
        {shopEnabled && !bookingEnabled && <ShopInsights storeId={validatedStoreId} />}

        {/* Centro de Operação (se shop focado) */}
        {shopEnabled && !bookingEnabled && (
          <ShopOperationCenter storeId={validatedStoreId} />
        )}

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* Coluna Esquerda */}
          <div className="space-y-4">
            {/* Bloco "Agora" - Booking */}
            {bookingEnabled && (
              <NowBlock 
                storeId={validatedStoreId} 
                bookingEnabled={bookingEnabled} 
                shopEnabled={shopEnabled} 
              />
            )}

            {/* Ocupação (se booking ativo) */}
            {bookingEnabled && <OccupancyBlock storeId={validatedStoreId} />}

            {/* Gráfico de vendas (se shop focado) */}
            {shopEnabled && !bookingEnabled && (
              <ShopSalesChart storeId={validatedStoreId} />
            )}

            {/* Top Produtos (se shop focado) */}
            {shopEnabled && !bookingEnabled && (
              <ShopTopProducts storeId={validatedStoreId} />
            )}

            {/* Estoque Baixo (se loja ativa) */}
            {shopEnabled && <LowStockAlert storeId={validatedStoreId} maxItems={4} />}
          </div>

          {/* Coluna Direita */}
          <div className="space-y-4">
            {/* Timeline do dia (se booking ativo) */}
            {bookingEnabled && <TodayTimeline storeId={validatedStoreId} />}

            {/* Equipe (se booking ativo) */}
            {bookingEnabled && <TeamHighlights storeId={validatedStoreId} />}

            {/* Funil de pedidos (se shop focado) */}
            {shopEnabled && !bookingEnabled && (
              <ShopOrderFunnel storeId={validatedStoreId} />
            )}

            {/* Clientes (se shop focado) */}
            {shopEnabled && !bookingEnabled && (
              <ShopCustomerStats storeId={validatedStoreId} />
            )}

            {/* Atividade Recente */}
            <StoreRecentActivity storeId={validatedStoreId} maxItems={5} />
          </div>
        </div>

        {/* Vendas e Funil - quando ambos ativos */}
        {shopEnabled && bookingEnabled && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <ShopSalesChart storeId={validatedStoreId} />
            <ShopOrderFunnel storeId={validatedStoreId} />
          </div>
        )}

        {/* Ações Rápidas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, i) => (
                <NavLink 
                  key={i} 
                  to={action.to} 
                  {...((action as any).external ? { target: '_blank' } : {})}
                >
                  <Button 
                    variant={(action as any).primary ? 'default' : 'outline'} 
                    size="sm" 
                    className="h-9 text-xs"
                  >
                    <action.icon className="w-3.5 h-3.5 mr-1.5" />
                    {action.label}
                  </Button>
                </NavLink>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Economia Marketplace */}
        <MarketplaceSavingsCard variant="compact" />

        {/* Complete sua loja */}
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
                      <Phone className="w-3 h-3 mr-1" /> Adicionar Telefone
                    </Button>
                  </NavLink>
                )}
                {!storeStats.storeAddress && (
                  <NavLink to="/dashboard/my-store">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <MapPin className="w-3 h-3 mr-1" /> Adicionar Endereço
                    </Button>
                  </NavLink>
                )}
                {storeStats.totalProducts === 0 && (
                  <NavLink to="/dashboard/products">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Package className="w-3 h-3 mr-1" /> Adicionar Produtos
                    </Button>
                  </NavLink>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
};

export default DashboardHome;
