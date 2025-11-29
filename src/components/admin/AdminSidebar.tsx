import { useState, useEffect } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  Users,
  CreditCard,
  Store,
  BarChart3,
  Settings,
  User,
  LogOut,
  Crown,
  Package,
  FileText,
  ShoppingCart,
  Home,
  Plus,
  Grid3X3,
  Grid,
  Image,
  UserCircle,
  Calendar,
  Loader2,
  Bike,
  DollarSign,
  Tag,
  Receipt,
  Printer,
  Ticket,
  ExternalLink,
  Target,
  Bot,
  MessageSquare,
  TrendingUp
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNewOrders } from "@/contexts/NewOrdersContext";

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, profile, userRole } = useAuth();
  const { storeId: validatedStoreId, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();
  const { toast } = useToast();
  const { pendingOrdersCount } = useNewOrders();
  
  const collapsed = state === "collapsed";
  const currentPath = location.pathname;
  
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const [planInfo, setPlanInfo] = useState<{
    planName: string;
    expiresAt: string | null;
    status: 'active' | 'expiring' | 'expired';
  } | null>(null);
  const [customMenus, setCustomMenus] = useState<Array<{
    id: string;
    title: string;
    iframe_url: string;
    sort_order: number;
    is_active: boolean;
  }>>([]);

  // Log inicial do componente
  console.log('🚀 AdminSidebar: Componente renderizado', {
    profileType: profile?.user_type,
    profileId: profile?.id,
    hasActiveSubscription,
    loadingConfig
  });

  // Buscar configurações da loja e informações do plano
  useEffect(() => {
    const fetchStoreConfig = async () => {
      // Master admins não precisam buscar loja
      if (userRole === 'master_admin' || profile?.user_type === 'master_admin') {
        setLoadingConfig(false);
        setHasActiveSubscription(true);
        return;
      }

      // Aguardar validação do storeAccess
      if (storeAccessLoading) {
        return;
      }

      // Store admins e atendentes podem acessar
      if ((profile?.user_type === 'store_admin' || userRole === 'attendant') && validatedStoreId && hasAccess) {
        try {
          console.log('🔍 AdminSidebar: Buscando loja ID:', validatedStoreId);
          
          // Buscar loja usando o storeId validado (funciona para store_admin e attendant)
          const { data: store, error: storeError } = await supabase
            .from('stores')
            .select(`
              id, 
              delivery_config,
              subscription_expires_at,
              status,
              plan_id,
              plans:plan_id (name)
            `)
            .eq('id', validatedStoreId)
            .single();

          console.log('🔍 AdminSidebar: Resultado da busca:', {
            hasStore: !!store,
            storeId: store?.id,
            subscriptionExpiresAt: store?.subscription_expires_at,
            error: storeError?.message
          });

          if (storeError) {
            console.error('❌ AdminSidebar: Erro ao buscar loja:', storeError);
            setHasActiveSubscription(false);
            setLoadingConfig(false);
            return;
          }

          if (store) {
            processStoreData(store);
          } else {
            console.warn('⚠️ AdminSidebar: Loja não encontrada');
            setHasActiveSubscription(false);
          }
        } catch (error) {
          console.error('❌ AdminSidebar: Erro ao buscar configurações:', error);
          setHasActiveSubscription(false);
        } finally {
          setLoadingConfig(false);
        }
      } else if (!storeAccessLoading) {
        // Se não é store_admin/attendant OU não tem validatedStoreId/hasAccess
        // E não está mais carregando, definir loading como false
        console.log('ℹ️ AdminSidebar: Sem loja válida ou sem acesso');
        setHasActiveSubscription(false);
        setLoadingConfig(false);
      }
    };

    const processStoreData = (store: any) => {
      setStoreConfig(store);

      // Buscar informações do plano
      const expiresAt = store.subscription_expires_at;
      const plan = (store as any).plans;
      const planName = plan?.name ?? 'Sem Plano';
      
      console.log('📅 AdminSidebar: Processando dados da loja:', {
        expiresAt,
        planName,
        today: new Date().toISOString().split('T')[0]
      });
      
      // VALIDAÇÃO SIMPLES: Se subscription_expires_at > hoje = ativo, senão = expirado
      let subscriptionActive = false;
      let status: 'active' | 'expiring' | 'expired' = 'expired';
      
      if (expiresAt) {
        const expirationDate = new Date(expiresAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas a data
        expirationDate.setHours(0, 0, 0, 0);
        
        console.log('📅 AdminSidebar: Comparando datas:', {
          expirationDate: expirationDate.toISOString().split('T')[0],
          today: today.toISOString().split('T')[0],
          isGreater: expirationDate > today
        });
        
        // Se data de expiração é maior que hoje = ATIVO
        if (expirationDate > today) {
          subscriptionActive = true;
          const daysUntil = Math.ceil(
            (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysUntil <= 30) {
            status = 'expiring';
          } else {
            status = 'active';
          }
          
          console.log('✅ AdminSidebar: Assinatura ATIVA:', { daysUntil, status });
        } else {
          // Data de expiração <= hoje = EXPIRADO
          subscriptionActive = false;
          status = 'expired';
          console.log('❌ AdminSidebar: Assinatura EXPIRADA');
        }
      } else {
        // Sem data de expiração = considerar expirado (a menos que seja master_admin)
        subscriptionActive = false;
        status = 'expired';
        console.log('⚠️ AdminSidebar: Sem data de expiração - considerado expirado');
      }

      setPlanInfo({
        planName: planName,
        expiresAt: expiresAt,
        status: status
      });
      
      console.log('🎯 AdminSidebar: Definindo hasActiveSubscription:', subscriptionActive);
      setHasActiveSubscription(subscriptionActive);
    };

    fetchStoreConfig();
  }, [profile, validatedStoreId, storeAccessLoading, hasAccess, userRole]);

  // Real-time subscription para mudanças nas configurações da loja
  useEffect(() => {
    if (profile?.user_type === 'store_admin' && storeConfig?.id && profile?.id) {
      const channel = supabase
        .channel('store-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'stores',
            filter: `id=eq.${storeConfig.id}`
          },
          (payload) => {
            if (payload.new) {
              setStoreConfig(payload.new as any);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile, storeConfig?.id]);

  // Monitorar mudanças no estado
  useEffect(() => {
    console.log('🔄 AdminSidebar: Estado atualizado:', {
      hasActiveSubscription,
      loadingConfig,
      storeConfig: storeConfig ? { id: storeConfig.id, expiresAt: storeConfig.subscription_expires_at } : null,
      planInfo,
      profileType: profile?.user_type,
      profileId: profile?.id
    });
  }, [hasActiveSubscription, loadingConfig, storeConfig, planInfo, profile]);

  // Buscar menus personalizados para store_admin
  useEffect(() => {
    const fetchCustomMenus = async () => {
      if (profile?.user_type !== 'store_admin' || !validatedStoreId) {
        setCustomMenus([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('custom_menus' as any)
          .select('*')
          .eq('store_id', validatedStoreId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Erro ao buscar menus personalizados:', error);
          setCustomMenus([]);
          return;
        }
        
        setCustomMenus((data || []) as any);
      } catch (error) {
        console.error('Erro crítico ao buscar menus personalizados:', error);
        setCustomMenus([]);
      }
    };

    fetchCustomMenus();
  }, [profile, validatedStoreId]);

  const getNavigationItems = () => {
    console.log('📋 AdminSidebar: getNavigationItems chamado', {
      profileType: profile?.user_type,
      userRole,
      hasActiveSubscription,
      loadingConfig,
      approvalStatus: profile?.approval_status ?? 'unknown'
    });

    // Menu para Atendente
    if (userRole === 'attendant') {
      return [
        { title: 'Pedidos', url: '/dashboard/orders', icon: ShoppingCart, group: 'Vendas' },
        { title: 'Clientes', url: '/dashboard/customers', icon: UserCircle, group: 'Vendas' },
        { title: 'Relatórios', url: '/dashboard/reports', icon: BarChart3, group: 'Vendas' },
        { title: 'Promoções', url: '/dashboard/promotions', icon: Tag, group: 'Vendas' },
        { title: 'Produtos', url: '/dashboard/products', icon: Package, group: 'Loja' },
        { title: 'Categorias', url: '/dashboard/categories', icon: Grid, group: 'Loja' },
        { title: 'Adicionais', url: '/dashboard/addons', icon: Plus, group: 'Loja' },
        { title: 'Categorias de Adicionais', url: '/dashboard/addon-categories', icon: Grid3X3, group: 'Loja' },
        { title: 'Perfil', url: '/dashboard/profile', icon: User, group: 'Conta' }
      ];
    }

    if (profile?.user_type === 'master_admin') {
      return [
        { title: 'Dashboard', url: '/dashboard', icon: Home, group: 'Principal' },
        { title: 'Inteligência de Negócios', url: '/dashboard/business-intelligence', icon: TrendingUp, group: 'Principal' },
        { title: 'Metas', url: '/dashboard/metas', icon: Target, group: 'Principal' },
        { title: 'Vendedores', url: '/dashboard/salespeople', icon: Users, group: 'Vendedores' },
        { title: 'Configurar Bônus', url: '/dashboard/salespeople/commissions', icon: DollarSign, group: 'Vendedores' },
        { title: 'Prompts de Vendas', url: '/dashboard/sales-prompts', icon: MessageSquare, group: 'Vendedores' },
        { title: 'Guia de Prospecção', url: '/dashboard/prospecting', icon: Target, group: 'Vendedores' },
        { title: 'Assinantes', url: '/dashboard/subscribers', icon: CreditCard, group: 'Gerenciamento' },
        { title: 'Lojas', url: '/dashboard/stores', icon: Store, group: 'Gerenciamento' },
        { title: 'Usuários', url: '/dashboard/users', icon: UserCircle, group: 'Gerenciamento' },
        { title: 'Módulos', url: '/dashboard/modules', icon: Package, group: 'Sistema' },
        { title: 'Pagamentos Assinaturas', url: '/dashboard/subscription-payments', icon: Receipt, group: 'Financeiro' },
        { title: 'Planos', url: '/dashboard/plans', icon: CreditCard, group: 'Financeiro' },
        { title: 'Config. Pagamentos', url: '/dashboard/subscription-config', icon: DollarSign, group: 'Financeiro' },
        { title: 'Cupons', url: '/dashboard/coupons', icon: Ticket, group: 'Sistema' },
        { title: 'Perfil', url: '/dashboard/profile', icon: User, group: 'Conta' }
      ];
    } else {
      // Store admin (lojista)
      // VERIFICAÇÃO: Se usuário está pendente/rejeitado ou sem assinatura ativa
      const isApprovalPending = profile?.approval_status === 'pending' || profile?.approval_status === 'rejected';
      
      // Se ainda está carregando, não bloquear o menu
      if (loadingConfig) {
        console.log('⏳ AdminSidebar: Ainda carregando - mostrando menu temporário');
        // Retornar menu completo enquanto carrega (evita flash de menu vazio)
        return [
          { title: 'Dashboard', url: '/dashboard', icon: Home, group: 'Principal' },
          { title: 'Minha Assinatura', url: '/dashboard/subscription', icon: CreditCard, group: 'Conta' }
        ];
      }
      
      // VALIDAÇÃO SIMPLES: subscription_expires_at > hoje = ativo
      // Se hasActiveSubscription é false OU null (sem data), bloquear
      // Se hasActiveSubscription é true, permitir
      const isSubscriptionInactive = hasActiveSubscription === false || hasActiveSubscription === null;
      
      console.log('🎯 AdminSidebar: Verificando menu:', {
        isApprovalPending,
        hasActiveSubscription,
        isSubscriptionInactive,
        loadingConfig,
        storeConfigId: storeConfig?.id,
        subscriptionExpiresAt: storeConfig?.subscription_expires_at
      });
      
      // IMPORTANTE: Se a assinatura está ativa, liberar o menu mesmo se approval_status for pending
      // A assinatura ativa é o critério principal para acesso
      if (hasActiveSubscription === true) {
        console.log('✅ AdminSidebar: Menu completo liberado - assinatura ativa!');
        // Menu completo será retornado abaixo
      } else if (isApprovalPending || isSubscriptionInactive) {
        // Só bloquear se NÃO tiver assinatura ativa E (estiver pendente OU sem assinatura)
        console.log('⚠️ AdminSidebar: Menu bloqueado - mostrando apenas "Minha Assinatura"', {
          reason: isApprovalPending ? 'Aprovação pendente' : 'Assinatura inativa',
          hasActiveSubscription,
          isApprovalPending
        });
        return [
          { title: 'Minha Assinatura', url: '/dashboard/subscription', icon: CreditCard, group: 'Conta' }
        ];
      }

      // Menu completo para usuários aprovados com assinatura ativa
      const scheduledOrdersEnabled = 
        storeConfig?.delivery_config?.scheduled_orders?.enabled === true;

      return [
        { title: 'Dashboard', url: '/dashboard', icon: Home, group: 'Principal' },
        { title: 'Pedidos', url: '/dashboard/orders', icon: ShoppingCart, group: 'Vendas' },
        // CONDICIONAL: Só aparece se pedidos agendados estiverem habilitados
        ...(scheduledOrdersEnabled ? [{
          title: 'Pedidos Agendados',
          url: '/dashboard/scheduled-orders',
          icon: Calendar,
          group: 'Vendas'
        }] : []),
        { title: 'Clientes', url: '/dashboard/customers', icon: UserCircle, group: 'Vendas' },
        { title: 'Relatórios', url: '/dashboard/reports', icon: BarChart3, group: 'Vendas' },
        { title: 'Minha Loja', url: '/dashboard/my-store', icon: Store, group: 'Loja' },
        { title: 'Produtos', url: '/dashboard/products', icon: Package, group: 'Loja' },
        { title: 'Categorias', url: '/dashboard/categories', icon: Grid, group: 'Loja' },
        { title: 'Adicionais', url: '/dashboard/addons', icon: Plus, group: 'Loja' },
        { title: 'Categorias de Adicionais', url: '/dashboard/addon-categories', icon: Grid3X3, group: 'Loja' },
        { title: 'Banners', url: '/dashboard/banners', icon: Image, group: 'Loja' },
        { title: 'Promoções', url: '/dashboard/promotions', icon: Tag, group: 'Vendas' },
        { title: 'Entregadores', url: '/dashboard/delivery-drivers', icon: Bike, group: 'Entregadores' },
        { title: 'Entregadores Disponíveis', url: '/dashboard/entregadores-disponiveis', icon: UserCircle, group: 'Entregadores' },
        { title: 'Financeiro - Entregadores', url: '/dashboard/entregadores/financeiro', icon: DollarSign, group: 'Entregadores' },
        { title: 'Atendentes', url: '/dashboard/attendants', icon: Users, group: 'Gerenciamento' },
        { title: 'Configurar Impressão', url: '/dashboard/print-config', icon: Printer, group: 'Configurações' },
        { title: 'Minha Assinatura', url: '/dashboard/subscription', icon: CreditCard, group: 'Conta' },
        { title: 'Perfil', url: '/dashboard/profile', icon: User, group: 'Conta' },
        // Integrações - menu fixo para gerenciar
        { title: 'Gerenciar Integrações', url: '/dashboard/integrations', icon: ExternalLink, group: 'Integrações' },
        // Menus personalizados dinâmicos
        ...customMenus.map(menu => ({
          title: menu.title,
          url: `/dashboard/iframe/${menu.id}`,
          icon: ExternalLink,
          group: 'Integrações'
        }))
      ];
    }
  };

  const navigationItems = getNavigationItems();
  
  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    const active = isActive(path);
    return active 
      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
      : "hover:bg-muted text-muted-foreground hover:text-foreground";
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout.",
        variant: "destructive"
      });
    }
  };

  // Loading state durante busca de configurações
  if (loadingConfig && profile?.user_type === 'store_admin') {
    console.log('⏳ AdminSidebar: Mostrando loading...');
    return (
      <Sidebar className={collapsed ? "w-16" : "w-64"}>
        <SidebarContent className="bg-background border-r">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Log final antes de renderizar
  console.log('🎨 AdminSidebar: Renderizando sidebar', {
    hasActiveSubscription,
    loadingConfig,
    menuItemsCount: getNavigationItems().length
  });

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent className="bg-background border-r">
        {/* Logo/Header */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-lg font-bold text-primary">Mostralo</h2>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            )}
          </div>
        </div>


        {/* Navigation Groups */}
        {Object.entries(groupedItems).map(([groupName, items]) => (
          <SidebarGroup key={groupName}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-4 py-2">
                {groupName}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/dashboard"}
                        className={getNavClassName(item.url)}
                      >
                        <item.icon className="w-4 h-4" />
                        {!collapsed && (
                          <span className="ml-3 flex items-center gap-2 flex-1">
                            {item.title}
                            {/* Badge de novos pedidos */}
                            {item.url === '/dashboard/orders' && pendingOrdersCount > 0 && (
                              <Badge 
                                variant="destructive" 
                                className="ml-auto animate-pulse bg-red-600 text-white text-xs px-2 py-0.5"
                              >
                                {pendingOrdersCount === 1 ? '1 NOVO' : `${pendingOrdersCount} NOVOS`}
                              </Badge>
                            )}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Logout Button */}
        <div className="mt-auto p-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="ml-3">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}