import { useState, useMemo } from "react";
import { 
  Map, 
  Search, 
  ExternalLink, 
  Copy, 
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
  FileText,
  Check,
  CreditCard,
  Filter,
  LayoutGrid,
  List,
  ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    icon: <Globe className="h-4 w-4" />,
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
      { path: "/sobre", name: "Sobre o Mostralo", component: "AboutPage.tsx", roles: ["public"] },
      { path: "/all-in-one", name: "All-in-One", component: "AllInOnePage.tsx", roles: ["public"] },
      { path: "/diagnostico", name: "Diagnóstico de Negócio", component: "DiagnosticoPage.tsx", roles: ["public"] },
      { path: "/diagnostico-delivery", name: "Diagnóstico Delivery", component: "DiagnosticoDeliveryPage.tsx", roles: ["public"] },
      { path: "/diagnostico-servicos", name: "Diagnóstico Serviços", component: "DiagnosticoServicosPage.tsx", roles: ["public"] },
      { path: "/conversao", name: "Página de Conversão", component: "ConversaoLandingPage.tsx", roles: ["public"] },
      { path: "/gestao-total", name: "Gestão Total", component: "GestaoTotalPage.tsx", roles: ["public"] },
      { path: "/gestao-360", name: "Gestão 360°", component: "Gestao360Page.tsx", roles: ["public"] },
      { path: "/suplementos", name: "Suplementos (Landing)", component: "SuplementosLandingPage.tsx", roles: ["public"] },
      { path: "/navegar", name: "Navegação Pública", component: "NavigatePage.tsx", roles: ["public"] },
      { path: "/mostralo-chat", name: "Mostralo Chat (WhatsApp)", component: "MostraloChatPage.tsx", roles: ["public"] },
    ]
  },
  {
    id: "public-verticals",
    title: "Verticais por Segmento",
    icon: <BarChart3 className="h-4 w-4" />,
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
    id: "public-nichos",
    title: "Verticais por Nicho",
    icon: <Store className="h-4 w-4" />,
    badgeColor: "bg-emerald-500",
    routes: [
      { path: "/nicho-acaiterias", name: "Nicho: Açaiterias", component: "NichoAcaiteriasPage.tsx", roles: ["public"] },
      { path: "/nicho-arenas", name: "Nicho: Arenas Esportivas", component: "NichoArenasEsportivasPage.tsx", roles: ["public"] },
      { path: "/nicho-barbearias", name: "Nicho: Barbearias", component: "NichoBarbeariasPage.tsx", roles: ["public"] },
      { path: "/nicho-churrasquinhos", name: "Nicho: Churrasquinhos", component: "NichoChurrasquinhosPage.tsx", roles: ["public"] },
      { path: "/nicho-distribuidoras", name: "Nicho: Distribuidoras", component: "NichoDistribuidorasPage.tsx", roles: ["public"] },
      { path: "/nicho-farmacias", name: "Nicho: Farmácias", component: "NichoFarmaciasPage.tsx", roles: ["public"] },
      { path: "/nicho-foodtruck", name: "Nicho: Food Trucks", component: "NichoFoodTruckPage.tsx", roles: ["public"] },
      { path: "/nicho-hamburguerias", name: "Nicho: Hamburguerias", component: "NichoHamburgueriasPage.tsx", roles: ["public"] },
      { path: "/nicho-nail-designers", name: "Nicho: Nail Designers", component: "NichoNailDesignersPage.tsx", roles: ["public"] },
      { path: "/nicho-padarias", name: "Nicho: Padarias", component: "NichoPadariasPage.tsx", roles: ["public"] },
      { path: "/nicho-pastelarias", name: "Nicho: Pastelarias", component: "NichoPastelariasPage.tsx", roles: ["public"] },
      { path: "/nicho-pet-shop", name: "Nicho: Pet Shops", component: "NichoPetShopsPage.tsx", roles: ["public"] },
      { path: "/nicho-pizzarias", name: "Nicho: Pizzarias", component: "NichoPizzariasPage.tsx", roles: ["public"] },
      { path: "/nicho-sorveterias", name: "Nicho: Sorveterias", component: "NichoSorveteriasPage.tsx", roles: ["public"] },
      { path: "/nicho-supermercados", name: "Nicho: Supermercados", component: "NichoSupermercadosPage.tsx", roles: ["public"] },
      { path: "/nicho-suplementos", name: "Nicho: Suplementos", component: "NichoSuplementosPage.tsx", roles: ["public"] },
    ]
  },
  {
    id: "public-recruitment",
    title: "Recrutamento",
    icon: <Briefcase className="h-4 w-4" />,
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
    icon: <ShoppingCart className="h-4 w-4" />,
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
    id: "totem-tables",
    title: "Totem e Mesas",
    icon: <ShoppingCart className="h-4 w-4" />,
    badgeColor: "bg-teal-500",
    routes: [
      { path: "/totem/:storeSlug", name: "Totem Autoatendimento", component: "TotemPage.tsx", roles: ["public"] },
      { path: "/mesa/:storeSlug/:tableNumber", name: "Acesso Mesa", component: "TableAccessPage.tsx", roles: ["public"] },
      { path: "/mesa/:storeSlug/:tableNumber/cardapio", name: "Cardápio Mesa", component: "TableMenuPage.tsx", roles: ["public"] },
      { path: "/c/:slug", name: "Cartão Digital Público", component: "DigitalCardPublicPage.tsx", roles: ["public"] },
    ]
  },
  {
    id: "booking",
    title: "Agendamentos",
    icon: <FileText className="h-4 w-4" />,
    badgeColor: "bg-pink-500",
    routes: [
      { path: "/agendar/:storeSlug", name: "Agendamento Online", component: "BookingPage.tsx", roles: ["public"] },
      { path: "/avaliar/:token", name: "Avaliação de Agendamento", component: "BookingReviewPage.tsx", roles: ["public"] },
    ]
  },
  {
    id: "client-subscriptions",
    title: "Clube de Assinaturas",
    icon: <CreditCard className="h-4 w-4" />,
    badgeColor: "bg-violet-500",
    routes: [
      { path: "/dashboard/assinaturas/planos", name: "Planos de Assinatura", component: "ClientSubscriptionPlansPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/assinaturas/assinantes", name: "Gestão de Assinantes", component: "ClientSubscribersPage.tsx", roles: ["store_admin"] },
    ]
  },
  {
    id: "public-invoices",
    title: "Faturas e Pagamentos",
    icon: <FileText className="h-4 w-4" />,
    badgeColor: "bg-indigo-500",
    routes: [
      { path: "/invoice-payment/:invoiceId", name: "Pagamento de Fatura", component: "InvoicePayment.tsx", roles: ["public"] },
      { path: "/receipt/:invoiceId", name: "Recibo de Fatura", component: "InvoiceReceipt.tsx", roles: ["public"] },
      { path: "/external-invoice/:invoiceId", name: "Fatura Externa", component: "ExternalInvoicePage.tsx", roles: ["public"] },
      { path: "/external-receipt/:invoiceId", name: "Recibo Fatura Externa", component: "ExternalInvoiceReceipt.tsx", roles: ["public"] },
    ]
  },
  {
    id: "master-admin",
    title: "Master Admin",
    icon: <Crown className="h-4 w-4" />,
    badgeColor: "bg-purple-500",
    routes: [
      { path: "/dashboard", name: "Dashboard Principal", component: "AdminDashboard.tsx", roles: ["master_admin"] },
      { path: "/dashboard/business-intelligence", name: "Inteligência de Negócios", component: "BusinessIntelligenceDashboard.tsx", roles: ["master_admin"] },
      { path: "/dashboard/metas", name: "Metas e Objetivos", component: "GoalsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/navegacao", name: "Guia de Navegação", component: "NavigationGuidePage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/novidades", name: "Novidades do Sistema", component: "SystemUpdatesPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/subscribers", name: "Assinantes", component: "SubscribersPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/stores", name: "Lojas", component: "StoresPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/users", name: "Usuários", component: "UsersPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/modules", name: "Módulos", component: "ModulesPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/compile-apps", name: "Compilar Apps", component: "CompileAppsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/whatsapp-connections", name: "Conexões WhatsApp", component: "WhatsAppConnectionsPage.tsx", roles: ["master_admin"] },
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
      { path: "/dashboard/diagnostics", name: "Diagnóstico de Performance", component: "DiagnosticsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/webhooks-monitor", name: "Monitor de Webhooks", component: "WebhooksMonitorPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/cloudflare-guide", name: "Guia Cloudflare", component: "CloudflareGuidePage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/ifood-homologation", name: "Homologação iFood", component: "IFoodHomologationPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/master-whatsapp", name: "WhatsApp Master", component: "MasterWhatsAppPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/store-notifications", name: "Notificações das Lojas", component: "StoreNotificationsManagementPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/external-billing", name: "Faturamento Externo", component: "ExternalBillingPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/contract-acceptances", name: "Aceites de Contratos", component: "AllContractsAcceptancePage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/modulos/gerenciar-acesso", name: "Gerenciar Acesso a Módulos", component: "ModuleAccessManagementPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/gateway-config", name: "Gateway de Pagamento", component: "GatewayConfigPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/efi-accounts", name: "Contas EFI Lojistas", component: "EfiAccountsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/follow-up-queue", name: "Fila de Follow-up", component: "FollowUpQueuePage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/sales-media", name: "Biblioteca de Mídias", component: "SalesMediaManagementPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/system-updates", name: "Gerenciar Novidades", component: "SystemUpdatesManagementPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/system-banners", name: "Banners do Sistema", component: "SystemBannersPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/documentacao-tecnica", name: "Documentação Técnica", component: "TechnicalDocsPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/popup-ab-test", name: "Teste A/B Popup", component: "PopupABTestPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/test-environment", name: "Ambiente de Testes", component: "TestEnvironmentPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/ideias", name: "Ideias e Funcionalidades", component: "IdeasPage.tsx", roles: ["master_admin"] },
      { path: "/dashboard/tutorials-management", name: "Gerenciar Tutoriais", component: "TutorialsManagementPage.tsx", roles: ["master_admin"] },
    ]
  },
  {
    id: "store-admin",
    title: "Store Admin (Lojista)",
    icon: <Store className="h-4 w-4" />,
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
      { path: "/dashboard/tutoriais", name: "Central de Tutoriais", component: "TutorialsPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/assinaturas/planos", name: "Planos de Assinatura", component: "ClientSubscriptionPlansPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/assinaturas/assinantes", name: "Gestão de Assinantes", component: "ClientSubscribersPage.tsx", roles: ["store_admin"] },
    ]
  },
  {
    id: "salesperson",
    title: "Painel do Vendedor",
    icon: <Briefcase className="h-4 w-4" />,
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
    icon: <Bike className="h-4 w-4" />,
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
    icon: <AlertTriangle className="h-4 w-4" />,
    badgeColor: "bg-red-500",
    routes: [
      { path: "/404", name: "Página Não Encontrada", component: "NotFound.tsx", roles: ["public"] },
      { path: "/500", name: "Erro do Servidor", component: "ServerError.tsx", roles: ["public"] },
      { path: "/503", name: "Em Manutenção", component: "Maintenance.tsx", roles: ["public"] },
      { path: "/offline", name: "Sem Conexão", component: "Offline.tsx", roles: ["public"] },
      { path: "/loja-indisponivel", name: "Loja Indisponível", component: "StoreUnavailable.tsx", roles: ["public"] },
      { path: "*", name: "Fallback 404", component: "NotFound.tsx", roles: ["public"] },
    ]
  },
];

const roleConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  public: { label: "Público", color: "text-green-400", dotColor: "bg-green-400" },
  authenticated: { label: "Autenticado", color: "text-blue-400", dotColor: "bg-blue-400" },
  master_admin: { label: "Master", color: "text-purple-400", dotColor: "bg-purple-400" },
  store_admin: { label: "Lojista", color: "text-yellow-400", dotColor: "bg-yellow-400" },
  salesperson: { label: "Vendedor", color: "text-orange-400", dotColor: "bg-orange-400" },
  delivery_driver: { label: "Entregador", color: "text-gray-400", dotColor: "bg-gray-400" },
  customer: { label: "Cliente", color: "text-cyan-400", dotColor: "bg-cyan-400" },
  attendant: { label: "Atendente", color: "text-pink-400", dotColor: "bg-pink-400" },
};

export default function NavigationGuidePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const stats = useMemo(() => {
    const allRoutes = routeSections.flatMap(s => s.routes);
    return {
      total: allRoutes.length,
      sections: routeSections.length,
      public: allRoutes.filter(r => r.roles.includes("public")).length,
      protected: allRoutes.filter(r => !r.roles.includes("public")).length,
    };
  }, []);

  const filteredSections = useMemo(() => {
    let sections = selectedCategory === "all" 
      ? routeSections 
      : routeSections.filter(s => s.id === selectedCategory);

    return sections.map(section => ({
      ...section,
      routes: section.routes.filter(route => {
        const matchesSearch = !searchTerm.trim() || 
          route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.component?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = selectedRole === "all" || 
          route.roles.includes(selectedRole as any);

        return matchesSearch && matchesRole;
      })
    })).filter(section => section.routes.length > 0);
  }, [searchTerm, selectedCategory, selectedRole]);

  const filteredCount = useMemo(() => 
    filteredSections.reduce((acc, s) => acc + s.routes.length, 0), 
    [filteredSections]
  );

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    toast({ title: "Copiado!", description: path });
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background p-3 md:p-4 lg:p-6">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Map className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground">Guia de Navegação</h1>
            <p className="text-xs text-muted-foreground">{stats.total} rotas em {stats.sections} categorias</p>
          </div>
        </div>
        {/* KPI pills */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <Globe className="h-3.5 w-3.5 text-green-400" />
            <span className="text-xs font-medium text-green-400">{stats.public} públicas</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Lock className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">{stats.protected} protegidas</span>
          </div>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar rota, nome ou componente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border text-sm h-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[160px] md:w-[200px] h-9 text-xs bg-card">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {routeSections.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[130px] md:w-[160px] h-9 text-xs bg-card">
              <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas roles</SelectItem>
              {Object.entries(roleConfig).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="hidden md:flex border border-border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      {(searchTerm || selectedCategory !== "all" || selectedRole !== "all") && (
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-xs">
            {filteredCount} resultado{filteredCount !== 1 ? "s" : ""}
          </Badge>
          {(searchTerm || selectedCategory !== "all" || selectedRole !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground"
              onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setSelectedRole("all"); }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {/* Seções agrupadas */}
      <div className="space-y-4">
        {filteredSections.map((section) => {
          const isCollapsed = collapsedSections.has(section.id);
          
          return (
            <div key={section.id}>
              {/* Header da seção */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-2 mb-2 group cursor-pointer"
              >
                <div className={`p-1.5 rounded-md ${section.badgeColor}/20`}>
                  {section.icon}
                </div>
                <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
                <Badge variant="outline" className="text-[10px] h-5">
                  {section.routes.length}
                </Badge>
                <div className="flex-1 h-px bg-border ml-2" />
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${!isCollapsed ? 'rotate-90' : ''}`} />
              </button>

              {/* Grid de rotas */}
              {!isCollapsed && (
                viewMode === "grid" ? (
                  <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {section.routes.map((route, idx) => (
                      <RouteCard
                        key={idx}
                        route={route}
                        copiedPath={copiedPath}
                        onCopy={handleCopy}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {section.routes.map((route, idx) => (
                      <RouteListItem
                        key={idx}
                        route={route}
                        copiedPath={copiedPath}
                        onCopy={handleCopy}
                      />
                    ))}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {filteredSections.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma rota encontrada</p>
          <p className="text-xs mt-1">Tente ajustar os filtros</p>
        </div>
      )}
    </div>
  );
}

function RouteCard({ route, copiedPath, onCopy }: { 
  route: RouteInfo; 
  copiedPath: string | null;
  onCopy: (path: string) => void;
}) {
  const isNavigable = !route.path.includes(':') && !route.path.includes('*');
  
  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-colors group">
      <CardContent className="p-3">
        {/* Nome + ações */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-medium text-sm text-foreground leading-tight truncate flex-1">
            {route.name}
          </h3>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onCopy(route.path)}
            >
              {copiedPath === route.path ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
            {isNavigable && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href={route.path} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Path */}
        <code className="text-xs text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded font-mono block truncate mb-2">
          {route.path}
        </code>

        {/* Component + Roles */}
        <div className="flex items-center justify-between gap-2">
          {route.component && (
            <span className="text-[10px] text-muted-foreground truncate">
              {route.component}
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {route.roles.map((role, idx) => {
              const config = roleConfig[role];
              return (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full ${config?.dotColor || 'bg-gray-400'}`}
                  title={config?.label || role}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RouteListItem({ route, copiedPath, onCopy }: { 
  route: RouteInfo; 
  copiedPath: string | null;
  onCopy: (path: string) => void;
}) {
  const isNavigable = !route.path.includes(':') && !route.path.includes('*');
  
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group">
      {/* Roles dots */}
      <div className="flex items-center gap-0.5 shrink-0">
        {route.roles.map((role, idx) => {
          const config = roleConfig[role];
          return (
            <span
              key={idx}
              className={`w-2 h-2 rounded-full ${config?.dotColor || 'bg-gray-400'}`}
              title={config?.label || role}
            />
          );
        })}
      </div>

      {/* Name */}
      <span className="font-medium text-sm text-foreground truncate min-w-[120px] max-w-[200px] lg:max-w-[280px]">
        {route.name}
      </span>

      {/* Path */}
      <code className="text-xs text-primary/70 font-mono truncate flex-1 hidden sm:block">
        {route.path}
      </code>

      {/* Component */}
      {route.component && (
        <span className="text-[10px] text-muted-foreground truncate max-w-[180px] hidden lg:block">
          {route.component}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onCopy(route.path)}
        >
          {copiedPath === route.path ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
        {isNavigable && (
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <a href={route.path} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
