import { useState, useMemo } from "react";
import { 
  Map, 
  Search, 
  ExternalLink, 
  Copy, 
  ChevronDown, 
  ChevronUp,
  Globe,
  Lock,
  Crown,
  Store,
  Briefcase,
  Bike,
  Users,
  AlertTriangle,
  BarChart3,
  ShoppingCart,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

interface RouteInfo {
  path: string;
  name: string;
  component?: string;
  roles: ('public' | 'authenticated' | 'master_admin' | 'store_admin' | 'salesperson' | 'delivery_driver' | 'customer' | 'attendant')[];
}

interface RouteSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  badgeColor: string;
  routes: RouteInfo[];
}

const routeSections: RouteSection[] = [
  {
    id: "public-landing",
    title: "Páginas Públicas (Landing)",
    icon: <Globe className="h-5 w-5" />,
    badgeColor: "bg-green-500",
    routes: [
      { path: "/", name: "Home / Landing Page", component: "Index.tsx", roles: ["public"] },
      { path: "/funcionalidades", name: "Funcionalidades do Sistema", component: "FeaturesPage.tsx", roles: ["public"] },
      { path: "/login", name: "Login", component: "Login.tsx", roles: ["public"] },
      { path: "/signup", name: "Cadastro de Lojista", component: "SignUp.tsx", roles: ["public"] },
      { path: "/politica-de-privacidade", name: "Política de Privacidade", component: "PrivacyPolicy.tsx", roles: ["public"] },
      { path: "/termos-de-uso", name: "Termos de Uso", component: "TermsOfService.tsx", roles: ["public"] },
      { path: "/termos-lojista", name: "Termos do Lojista", component: "MerchantTerms.tsx", roles: ["public"] },
      { path: "/verificar-contrato", name: "Verificar Contrato", component: "ContractVerificationPage.tsx", roles: ["public"] },
      { path: "/contato", name: "Contato", component: "Contact.tsx", roles: ["public"] },
    ]
  },
  {
    id: "public-verticals",
    title: "Verticais por Segmento",
    icon: <BarChart3 className="h-5 w-5" />,
    badgeColor: "bg-green-500",
    routes: [
      { path: "/para-feirantes", name: "Para Feirantes", component: "ForFeirantesPage.tsx", roles: ["public"] },
      { path: "/para-lojistas", name: "Para Lojistas", component: "ForLojistasPage.tsx", roles: ["public"] },
      { path: "/para-farmacias", name: "Para Farmácias", component: "ForFarmaciasPage.tsx", roles: ["public"] },
      { path: "/para-acougues", name: "Para Açougues", component: "ForAcouguesPage.tsx", roles: ["public"] },
      { path: "/para-supermercados", name: "Para Supermercados", component: "ForSupermercadosPage.tsx", roles: ["public"] },
      { path: "/para-suplementos", name: "Para Suplementos", component: "SuplementosPage.tsx", roles: ["public"] },
      { path: "/proposta-biomundo", name: "Proposta BioMundo", component: "BioMundoProposalPage.tsx", roles: ["public"] },
    ]
  },
  {
    id: "public-recruitment",
    title: "Recrutamento",
    icon: <Briefcase className="h-5 w-5" />,
    badgeColor: "bg-green-500",
    routes: [
      { path: "/seja-vendedor", name: "Seja Vendedor (Landing)", component: "BecomeSalespersonPage.tsx", roles: ["public"] },
      { path: "/cadastro-vendedor", name: "Cadastro de Vendedor", component: "SalespersonSignUp.tsx", roles: ["public"] },
      { path: "/guia-vendedor", name: "Guia do Vendedor", component: "SalespersonSalesGuidePage.tsx", roles: ["public"] },
      { path: "/cadastro-entregador", name: "Cadastro de Entregador", component: "DeliveryDriverSignUp.tsx", roles: ["public"] },
    ]
  },
  {
    id: "store-customer",
    title: "Loja / Cliente",
    icon: <ShoppingCart className="h-5 w-5" />,
    badgeColor: "bg-blue-500",
    routes: [
      { path: "/loja/:slug", name: "Vitrine da Loja", component: "Store.tsx", roles: ["public"] },
      { path: "/loja/:slug/produto/:productSlug", name: "Página do Produto", component: "ProductPage.tsx", roles: ["public"] },
      { path: "/loja/:slug/feed.xml", name: "Feed Google Shopping", roles: ["public"] },
      { path: "/loja/:slug/feed.csv", name: "Feed Instagram/Meta", roles: ["public"] },
      { path: "/checkout/:storeSlug", name: "Checkout", component: "Checkout.tsx", roles: ["public"] },
      { path: "/pedido/:orderId", name: "Acompanhar Pedido", component: "OrderTracking.tsx", roles: ["public"] },
      { path: "/cliente", name: "Área do Cliente", component: "CustomerAreaPage.tsx", roles: ["customer"] },
      { path: "/cliente/pedidos", name: "Meus Pedidos", component: "CustomerOrdersPage.tsx", roles: ["customer"] },
      { path: "/cliente/perfil", name: "Perfil do Cliente", component: "CustomerProfilePage.tsx", roles: ["customer"] },
    ]
  },
  {
    id: "master-admin",
    title: "Master Admin",
    icon: <Crown className="h-5 w-5" />,
    badgeColor: "bg-purple-500",
    routes: [
      { path: "/dashboard", name: "Dashboard Principal", component: "AdminDashboard.tsx", roles: ["master_admin"] },
      { path: "/dashboard/business-intelligence", name: "Inteligência de Negócios", component: "BusinessIntelligenceDashboard.tsx", roles: ["master_admin"] },
      { path: "/dashboard/metas", name: "Metas e Objetivos", component: "GoalsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/navegacao", name: "Guia de Navegação", component: "NavigationGuidePage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/subscribers", name: "Assinantes", component: "SubscribersPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/stores", name: "Lojas", component: "StoresPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/users", name: "Usuários", component: "UsersPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/modules", name: "Módulos", component: "ModulesPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/compile-apps", name: "Compilar Apps", component: "CompileAppsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/evolution-config", name: "Evolution API", component: "EvolutionConfigPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/subscription-payments", name: "Pagamentos Assinaturas", component: "SubscriptionPaymentsManagementPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/plans", name: "Planos", component: "PlansPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/subscription-config", name: "Config. Pagamentos", component: "SubscriptionPaymentConfigPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/coupons", name: "Cupons", component: "CouponsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/salespeople", name: "Vendedores", component: "SalespeopleListPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/salespeople/:id", name: "Detalhes Vendedor", component: "SalespersonDetailPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/salespeople/payouts", name: "Pagamentos Vendedores", component: "SalespersonPayoutsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/salespeople/affiliate-reports", name: "Relatórios Afiliados", component: "AffiliateReportsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/salespeople/commissions", name: "Configurar Bônus", component: "SalespersonCommissionsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/salespeople/contract", name: "Editar Contrato", component: "SalespersonContractEditPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/leads", name: "Leads", component: "LeadsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/sales-prompts", name: "Prompts de Vendas", component: "SalesPromptsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/recrutamento", name: "Recrutamento de Vendedores", component: "RecruitmentPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/qualification-benefits", name: "Faixas de Qualificação", component: "QualificationBenefitsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/prospecting", name: "Guia de Prospecção", component: "ProspectingGuidePage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/onboarding-guide", name: "Guia de Cadastro", component: "OnboardingGuidePage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/material-divulgacao", name: "Material de Divulgação", component: "MarketingMaterialPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/salespeople/activity-rules", name: "Regras de Atividade", component: "SalespersonActivityRulesPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/salespeople/contract", name: "Editar Contrato PJ", component: "ContractTemplateEditPage.tsx", roles: ["master_admin"] },
    ]
  },
  {
    id: "store-admin",
    title: "Store Admin (Lojista)",
    icon: <Store className="h-5 w-5" />,
    badgeColor: "bg-yellow-500",
    routes: [
      { path: "/dashboard", name: "Dashboard da Loja", component: "StoreAdminDashboard.tsx", roles: ["store_admin"] },
      { path: "/dashboard/orders", name: "Pedidos", component: "OrdersPage.tsx", roles: ["store_admin", "attendant"] },
      { path: "/dashboard/scheduled-orders", name: "Pedidos Agendados", component: "ScheduledOrdersPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/customers", name: "Clientes", component: "CustomersPage.tsx", roles: ["store_admin", "attendant"] },
      { path: "/dashboard/reports", name: "Relatórios", component: "ReportsPage.tsx", roles: ["store_admin", "attendant"] },
      { path: "/dashboard/my-store", name: "Minha Loja", component: "MyStorePage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/products", name: "Produtos", component: "ProductsPage.tsx", roles: ["store_admin", "attendant"] },
      { path: "/dashboard/categories", name: "Categorias", component: "CategoriesPage.tsx", roles: ["store_admin", "attendant"] },
      { path: "/dashboard/addons", name: "Adicionais", component: "AddonsPage.tsx", roles: ["store_admin", "attendant"] },
      { path: "/dashboard/addon-categories", name: "Categorias de Adicionais", component: "AddonCategoriesPage.tsx", roles: ["store_admin", "attendant"] },
      { path: "/dashboard/banners", name: "Banners", component: "BannersPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/promotions", name: "Promoções", component: "PromotionsPage.tsx", roles: ["store_admin", "attendant"] },
      { path: "/dashboard/delivery-drivers", name: "Entregadores", component: "DeliveryDriversPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/delivery-drivers/financials", name: "Financeiro Entregadores", component: "DeliveryDriverFinancials.tsx", roles: ["store_admin"] },
      { path: "/dashboard/delivery-drivers/invite", name: "Convidar Entregadores", component: "InviteDeliveryDrivers.tsx", roles: ["store_admin"] },
      { path: "/dashboard/attendants", name: "Atendentes", component: "AttendantsPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/whatsapp", name: "WhatsApp Marketing", component: "WhatsAppMarketingPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/whatsapp/contacts", name: "Contatos WhatsApp", component: "WhatsAppContactsPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/whatsapp/groups", name: "Grupos WhatsApp", component: "WhatsAppGroupsPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/whatsapp/campaigns", name: "Campanhas WhatsApp", component: "WhatsAppCampaignsPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/whatsapp/templates", name: "Templates WhatsApp", component: "WhatsAppTemplatesPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/material-divulgacao", name: "Material de Marketing", component: "StoreMarketingMaterialPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/print-config", name: "Configuração de Impressão", component: "PrintConfigPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/integrations", name: "Integrações (iFrames)", component: "IntegrationsPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/subscription", name: "Minha Assinatura", component: "SubscriptionPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/contract-history", name: "Histórico de Contratos", component: "MerchantContractHistory.tsx", roles: ["store_admin"] },
      { path: "/dashboard/settings", name: "Configurações da Loja", component: "StoreSettingsPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/profile", name: "Perfil", component: "ProfilePage.tsx", roles: ["store_admin", "attendant"] },
    ]
  },
  {
    id: "salesperson",
    title: "Painel do Vendedor",
    icon: <Briefcase className="h-5 w-5" />,
    badgeColor: "bg-orange-500",
    routes: [
      { path: "/vendedor", name: "Dashboard Vendedor", component: "SalespersonDashboard.tsx", roles: ["salesperson"] },
      { path: "/vendedor/link", name: "Meu Link de Indicação", component: "SalespersonLinkPage.tsx", roles: ["salesperson"] },
      { path: "/vendedor/vendas", name: "Minhas Vendas", component: "SalespersonSalesPage.tsx", roles: ["salesperson"] },
      { path: "/vendedor/leads", name: "Meus Leads", component: "SalespersonLeadsPage.tsx", roles: ["salesperson"] },
      { path: "/vendedor/pagamentos", name: "Pagamentos", component: "SalespersonPaymentsPage.tsx", roles: ["salesperson"] },
      { path: "/vendedor/contratos", name: "Meus Contratos", component: "SalespersonContractsPage.tsx", roles: ["salesperson"] },
      { path: "/vendedor/contrato", name: "Aceitar Contrato", component: "SalespersonContractAcceptancePage.tsx", roles: ["salesperson"] },
      { path: "/vendedor/material", name: "Material de Divulgação", component: "SalespersonMaterialPage.tsx", roles: ["salesperson"] },
      { path: "/vendedor/prompts", name: "Prompts de IA", component: "SalespersonPromptsPage.tsx", roles: ["salesperson"] },
      { path: "/vendedor/prospeccao", name: "Guia de Prospecção", component: "SalespersonProspectingPage.tsx", roles: ["salesperson"] },
      { path: "/vendedor/onboarding", name: "Guia de Cadastro", component: "SalespersonOnboardingPage.tsx", roles: ["salesperson"] },
      { path: "/vendedor/upgrade", name: "Upgrade para PJ", component: "SalespersonUpgradePage.tsx", roles: ["salesperson"] },
      { path: "/vendedor/perfil", name: "Perfil", component: "SalespersonProfilePage.tsx", roles: ["salesperson"] },
    ]
  },
  {
    id: "delivery-driver",
    title: "Painel do Entregador",
    icon: <Bike className="h-5 w-5" />,
    badgeColor: "bg-gray-500",
    routes: [
      { path: "/entregador", name: "Dashboard Entregador", component: "DeliveryDriverDashboard.tsx", roles: ["delivery_driver"] },
      { path: "/entregador/pedidos", name: "Meus Pedidos", component: "DeliveryDriverOrdersPage.tsx", roles: ["delivery_driver"] },
      { path: "/entregador/ganhos", name: "Meus Ganhos", component: "DeliveryDriverEarningsPage.tsx", roles: ["delivery_driver"] },
      { path: "/entregador/convites", name: "Convites de Lojas", component: "DeliveryDriverInvitationsPage.tsx", roles: ["delivery_driver"] },
      { path: "/entregador/perfil", name: "Perfil", component: "DeliveryDriverProfilePage.tsx", roles: ["delivery_driver"] },
    ]
  },
  {
    id: "error-pages",
    title: "Páginas de Erro",
    icon: <AlertTriangle className="h-5 w-5" />,
    badgeColor: "bg-red-500",
    routes: [
      { path: "/404", name: "Página Não Encontrada", component: "NotFound.tsx", roles: ["public"] },
      { path: "/loja-indisponivel", name: "Loja Indisponível", component: "StoreUnavailable.tsx", roles: ["public"] },
      { path: "*", name: "Fallback 404", component: "NotFound.tsx", roles: ["public"] },
    ]
  },
];

const getRoleBadge = (role: string) => {
  const roleConfig: Record<string, { label: string; className: string }> = {
    public: { label: "Público", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    authenticated: { label: "Autenticado", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    master_admin: { label: "Master Admin", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    store_admin: { label: "Lojista", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    salesperson: { label: "Vendedor", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    delivery_driver: { label: "Entregador", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
    customer: { label: "Cliente", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    attendant: { label: "Atendente", className: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  };
  
  const config = roleConfig[role] || { label: role, className: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
};

export default function NavigationGuidePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(routeSections.map(s => s.id));
  const { toast } = useToast();

  // Calcular estatísticas
  const stats = useMemo(() => {
    const allRoutes = routeSections.flatMap(s => s.routes);
    const totalRoutes = allRoutes.length;
    const publicRoutes = allRoutes.filter(r => r.roles.includes("public")).length;
    const protectedRoutes = totalRoutes - publicRoutes;
    const masterAdminRoutes = allRoutes.filter(r => r.roles.includes("master_admin")).length;
    const storeAdminRoutes = allRoutes.filter(r => r.roles.includes("store_admin")).length;
    const salespersonRoutes = allRoutes.filter(r => r.roles.includes("salesperson")).length;
    const deliveryDriverRoutes = allRoutes.filter(r => r.roles.includes("delivery_driver")).length;
    const customerRoutes = allRoutes.filter(r => r.roles.includes("customer")).length;
    
    return {
      totalRoutes,
      publicRoutes,
      protectedRoutes,
      masterAdminRoutes,
      storeAdminRoutes,
      salespersonRoutes,
      deliveryDriverRoutes,
      customerRoutes
    };
  }, []);

  // Filtrar rotas baseado na busca
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return routeSections;
    
    const term = searchTerm.toLowerCase();
    return routeSections.map(section => ({
      ...section,
      routes: section.routes.filter(
        route => 
          route.path.toLowerCase().includes(term) || 
          route.name.toLowerCase().includes(term) ||
          route.component?.toLowerCase().includes(term)
      )
    })).filter(section => section.routes.length > 0);
  }, [searchTerm]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `"${text}" copiado para a área de transferência.`,
    });
  };

  const toggleAllSections = (expand: boolean) => {
    if (expand) {
      setExpandedSections(routeSections.map(s => s.id));
    } else {
      setExpandedSections([]);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Map className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Guia de Navegação
          </h1>
        </div>
        <p className="text-muted-foreground">
          Índice completo de todas as rotas do sistema organizadas por área funcional.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalRoutes}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.publicRoutes}</div>
            <div className="text-xs text-green-400/70">Públicas</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.protectedRoutes}</div>
            <div className="text-xs text-blue-400/70">Protegidas</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.masterAdminRoutes}</div>
            <div className="text-xs text-purple-400/70">Master Admin</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.storeAdminRoutes}</div>
            <div className="text-xs text-yellow-400/70">Lojista</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{stats.salespersonRoutes}</div>
            <div className="text-xs text-orange-400/70">Vendedor</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-500/10 border-gray-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.deliveryDriverRoutes}</div>
            <div className="text-xs text-gray-400/70">Entregador</div>
          </CardContent>
        </Card>
        <Card className="bg-cyan-500/10 border-cyan-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-400">{stats.customerRoutes}</div>
            <div className="text-xs text-cyan-400/70">Cliente</div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de busca e controles */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, caminho ou componente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAllSections(true)}
            className="flex items-center gap-1"
          >
            <ChevronDown className="h-4 w-4" />
            Expandir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAllSections(false)}
            className="flex items-center gap-1"
          >
            <ChevronUp className="h-4 w-4" />
            Colapsar
          </Button>
        </div>
      </div>

      {/* Lista de rotas */}
      <Accordion
        type="multiple"
        value={expandedSections}
        onValueChange={setExpandedSections}
        className="space-y-3"
      >
        {filteredSections.map((section) => (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="border border-border rounded-lg bg-card overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${section.badgeColor}/20`}>
                  {section.icon}
                </div>
                <span className="font-semibold text-foreground">{section.title}</span>
                <Badge variant="secondary" className="ml-2">
                  {section.routes.length} rotas
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2 mt-2">
                {section.routes.map((route, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">{route.name}</span>
                        {route.roles.map((role, roleIdx) => (
                          <span key={roleIdx}>{getRoleBadge(role)}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <code className="text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {route.path}
                        </code>
                        {route.component && (
                          <span className="text-muted-foreground text-xs">
                            → {route.component}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(route.path)}
                        title="Copiar caminho"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {!route.path.includes(':') && !route.path.includes('*') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                        >
                          <a
                            href={route.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir em nova aba"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {filteredSections.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma rota encontrada para "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}
