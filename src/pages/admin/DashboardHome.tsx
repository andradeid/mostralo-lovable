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

      // Buscar estatísticas da loja
      const [productsResult, activeProductsResult, categoriesResult, activeCategoriesResult] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact' }).eq('store_id', storeData.id),
        supabase.from('products').select('*', { count: 'exact' }).eq('store_id', storeData.id).eq('is_available', true),
        supabase.from('categories').select('*', { count: 'exact' }).eq('store_id', storeData.id),
        supabase.from('categories').select('*', { count: 'exact' }).eq('store_id', storeData.id).eq('is_active', true)
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
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Executivo</h1>
          <p className="text-muted-foreground">
            Visão estratégica do negócio • Métricas financeiras e crescimento
          </p>
        </div>

        {/* KPIs Financeiros */}
        <MasterAdminKPIs />

        {/* Projeções e Valuation */}
        <GrowthProjections />

        {/* Alertas e Atividades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PendingActions />
          <RecentActivityReal />
        </div>

        {/* Saúde das Lojas */}
        <StoreHealthIndicators />

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>Funcionalidades mais utilizadas</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NavLink to="/dashboard/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Usuários
              </Button>
            </NavLink>
            <NavLink to="/dashboard/stores">
              <Button variant="outline" className="w-full justify-start">
                <Store className="w-4 h-4 mr-2" />
                Lojas
              </Button>
            </NavLink>
            <NavLink to="/dashboard/plans">
              <Button variant="outline" className="w-full justify-start">
                <Package className="w-4 h-4 mr-2" />
                Planos
              </Button>
            </NavLink>
            <NavLink to="/dashboard/reports">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Relatórios
              </Button>
            </NavLink>
          </CardContent>
        </Card>
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Painel de controle da {storeStats.storeName}
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge 
              variant={storeStats.storeStatus === 'active' ? 'default' : 'destructive'}
            >
              {storeStats.storeStatus === 'active' ? 'Loja Ativa' : 'Loja Inativa'}
            </Badge>
            {storeStats.planName && (
              <Badge variant="outline">
                {storeStats.planName}
              </Badge>
            )}
          </div>
        </div>

        {/* Alerta de Assinatura */}
        {subscriptionAlert.type && (
          <Card className={`border-2 ${
            subscriptionAlert.type === 'expired' 
              ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
              : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className={`h-5 w-5 ${
                  subscriptionAlert.type === 'expired' ? 'text-red-600' : 'text-yellow-600'
                }`} />
                {subscriptionAlert.type === 'expired' 
                  ? '❌ Assinatura Expirada' 
                  : '⚠️ Assinatura Próxima ao Vencimento'}
              </CardTitle>
              <CardDescription className={
                subscriptionAlert.type === 'expired' ? 'text-red-700' : 'text-yellow-700'
              }>
                {subscriptionAlert.type === 'expired'
                  ? `Sua assinatura do plano ${subscriptionAlert.planName} expirou há ${Math.abs(subscriptionAlert.daysUntil)} dia(s). Regularize para continuar usando o sistema.`
                  : `Sua assinatura do plano ${subscriptionAlert.planName} vence em ${subscriptionAlert.daysUntil} dia(s). ${subscriptionAlert.pendingInvoices} mensalidade(s) pendente(s).`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NavLink to="/dashboard/subscription">
                <Button variant={subscriptionAlert.type === 'expired' ? 'destructive' : 'default'}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Ver Detalhes e Pagar
                </Button>
              </NavLink>
            </CardContent>
          </Card>
        )}

        {/* Card de Economia de Marketplace */}
        <MarketplaceSavingsCard className="mb-6" />

        {/* Cards de Informações da Loja */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Informações da Loja</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {storeInfoCards.map((card, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className={`${card.bgColor} p-2 rounded-md`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cards de Estatísticas do Negócio */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Estatísticas do Negócio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessCards.map((card, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {card.description}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    {card.trend}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Alertas e Recomendações */}
        {(!storeStats.storePhone || !storeStats.storeAddress || storeStats.totalProducts === 0) && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <AlertCircle className="w-5 h-5 mr-2" />
                Recomendações para sua Loja
              </CardTitle>
              <CardDescription className="text-yellow-700">
                Complete as configurações para melhorar a experiência dos clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!storeStats.storePhone && (
                  <div className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-white">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">Adicione um telefone de contato</span>
                    </div>
                    <NavLink to="/dashboard/my-store">
                      <Button size="sm" variant="outline">Configurar</Button>
                    </NavLink>
                  </div>
                )}
                {!storeStats.storeAddress && (
                  <div className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-white">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">Adicione o endereço da loja</span>
                    </div>
                    <NavLink to="/dashboard/my-store">
                      <Button size="sm" variant="outline">Configurar</Button>
                    </NavLink>
                  </div>
                )}
                {storeStats.totalProducts === 0 && (
                  <div className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-white">
                    <div className="flex items-center space-x-3">
                      <Package className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">Adicione produtos ao seu cardápio</span>
                    </div>
                    <NavLink to="/dashboard/products">
                      <Button size="sm" variant="outline">Adicionar</Button>
                    </NavLink>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>Funcionalidades mais utilizadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <NavLink to="/dashboard/products">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Produto
                </Button>
              </NavLink>
              <NavLink to="/dashboard/categories">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </NavLink>
              <NavLink to="/dashboard/my-store">
                <Button variant="outline" className="w-full justify-start">
                  <Store className="w-4 h-4 mr-2" />
                  Configurar Loja
                </Button>
              </NavLink>
              <NavLink to="/dashboard/reports">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Relatórios
                </Button>
              </NavLink>
            </CardContent>
          </Card>

          {/* Status e Próximos Passos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Próximos Passos
              </CardTitle>
              <CardDescription>Recomendações para melhorar sua loja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {storeStats.totalProducts === 0 ? (
                  <div className="text-center py-6">
                    <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Comece adicionando produtos ao seu cardápio
                    </p>
                    <NavLink to="/dashboard/products">
                      <Button size="sm">Adicionar Primeiro Produto</Button>
                    </NavLink>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Loja configurada</p>
                        <p className="text-xs text-muted-foreground">
                          {storeStats.totalProducts} produto(s) cadastrado(s)
                        </p>
                      </div>
                    </div>
                    {storeStats.totalCategories === 0 && (
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Organize em categorias</p>
                          <p className="text-xs text-muted-foreground">
                            Melhore a navegação do cardápio
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Compartilhe seu cardápio</p>
                        <p className="text-xs text-muted-foreground">
                          URL: /{storeStats.storeSlug}
                        </p>
                      </div>
                    </div>
                  </>
                )}
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