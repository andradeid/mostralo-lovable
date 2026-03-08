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
  FileText,
  Check,
  CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
    icon: <Globe className="h-4 w-4 md:h-5 md:w-5" />,
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
      // Páginas Públicas Faltantes
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
    icon: <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />,
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
    icon: <Store className="h-4 w-4 md:h-5 md:w-5" />,
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
    icon: <Briefcase className="h-4 w-4 md:h-5 md:w-5" />,
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
    icon: <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />,
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
    icon: <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />,
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
    icon: <FileText className="h-4 w-4 md:h-5 md:w-5" />,
    badgeColor: "bg-pink-500",
    routes: [
      { path: "/agendar/:storeSlug", name: "Agendamento Online", component: "BookingPage.tsx", roles: ["public"] },
      { path: "/avaliar/:token", name: "Avaliação de Agendamento", component: "BookingReviewPage.tsx", roles: ["public"] },
    ]
  },
  {
    id: "client-subscriptions",
    title: "🆕 Clube de Assinaturas",
    icon: <CreditCard className="h-4 w-4 md:h-5 md:w-5" />,
    badgeColor: "bg-violet-500",
    routes: [
      { path: "/dashboard/assinaturas/planos", name: "Planos de Assinatura", component: "ClientSubscriptionPlansPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/assinaturas/assinantes", name: "Gestão de Assinantes", component: "ClientSubscribersPage.tsx", roles: ["store_admin"] },
    ]
  },
  {
    id: "public-invoices",
    title: "Faturas e Pagamentos",
    icon: <FileText className="h-4 w-4 md:h-5 md:w-5" />,
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
    icon: <Crown className="h-4 w-4 md:h-5 md:w-5" />,
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
      // Páginas Master Admin Faltantes
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
    icon: <Store className="h-4 w-4 md:h-5 md:w-5" />,
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
      { path: "/dashboard/assinaturas/planos", name: "🆕 Planos de Assinatura", component: "ClientSubscriptionPlansPage.tsx", roles: ["store_admin"] },
      { path: "/dashboard/assinaturas/assinantes", name: "🆕 Gestão de Assinantes", component: "ClientSubscribersPage.tsx", roles: ["store_admin"] },
    ]
  },
  {
    id: "salesperson",
    title: "Painel do Vendedor",
    icon: <Briefcase className="h-4 w-4 md:h-5 md:w-5" />,
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
    icon: <Bike className="h-4 w-4 md:h-5 md:w-5" />,
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
    icon: <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />,
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

// Role config com iniciais para mobile
const roleConfig: Record<string, { label: string; initial: string; className: string }> = {
  public: { label: "Público", initial: "P", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  authenticated: { label: "Autenticado", initial: "A", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  master_admin: { label: "Master Admin", initial: "M", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  store_admin: { label: "Lojista", initial: "L", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  salesperson: { label: "Vendedor", initial: "V", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  delivery_driver: { label: "Entregador", initial: "E", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  customer: { label: "Cliente", initial: "C", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  attendant: { label: "Atendente", initial: "At", className: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
};

const getRoleBadge = (role: string) => {
  const config = roleConfig[role] || { label: role, initial: role[0]?.toUpperCase() || "?", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
  return (
    <Badge variant="outline" className={`text-[10px] md:text-xs shrink-0 ${config.className}`}>
      <span className="md:hidden">{config.initial}</span>
      <span className="hidden md:inline">{config.label}</span>
    </Badge>
  );
};

export default function NavigationGuidePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(routeSections.map(s => s.id));
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
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

  // Contar rotas filtradas
  const filteredCount = useMemo(() => {
    return filteredSections.reduce((acc, section) => acc + section.routes.length, 0);
  }, [filteredSections]);

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

  const statsCards = [
    { value: stats.totalRoutes, label: "Total", className: "bg-card border-border", valueClass: "text-foreground" },
    { value: stats.publicRoutes, label: "Públicas", className: "bg-green-500/10 border-green-500/30", valueClass: "text-green-400" },
    { value: stats.protectedRoutes, label: "Protegidas", className: "bg-blue-500/10 border-blue-500/30", valueClass: "text-blue-400" },
    { value: stats.masterAdminRoutes, label: "Master", className: "bg-purple-500/10 border-purple-500/30", valueClass: "text-purple-400" },
    { value: stats.storeAdminRoutes, label: "Lojista", className: "bg-yellow-500/10 border-yellow-500/30", valueClass: "text-yellow-400" },
    { value: stats.salespersonRoutes, label: "Vendedor", className: "bg-orange-500/10 border-orange-500/30", valueClass: "text-orange-400" },
    { value: stats.deliveryDriverRoutes, label: "Entregador", className: "bg-gray-500/10 border-gray-500/30", valueClass: "text-gray-400" },
    { value: stats.customerRoutes, label: "Cliente", className: "bg-cyan-500/10 border-cyan-500/30", valueClass: "text-cyan-400" },
  ];

  return (
    <div className="min-h-screen bg-background p-3 md:p-6">
      {/* Header Compacto */}
      <div className="mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
          <Map className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            Guia de Navegação
          </h1>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">
          Índice completo de todas as rotas do sistema.
        </p>
      </div>

      {/* Estatísticas - Scroll Horizontal no Mobile */}
      <ScrollArea className="w-full mb-4 md:mb-6">
        <div className="flex gap-2 pb-2 md:grid md:grid-cols-4 lg:grid-cols-8 md:gap-3 md:pb-0">
          {statsCards.map((stat, idx) => (
            <Card key={idx} className={`${stat.className} min-w-[70px] md:min-w-0 shrink-0`}>
              <CardContent className="p-2 md:p-4 text-center">
                <div className={`text-lg md:text-2xl font-bold ${stat.valueClass}`}>{stat.value}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground truncate">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="md:hidden" />
      </ScrollArea>

      {/* Barra de busca e controles */}
      <div className="flex gap-2 mb-4 md:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border text-sm h-9 md:h-10"
          />
        </div>
        {searchTerm && (
          <Badge variant="secondary" className="h-9 md:h-10 px-2 flex items-center text-[10px] md:text-xs shrink-0">
            {filteredCount}
          </Badge>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => toggleAllSections(true)}
          className="h-9 w-9 md:h-10 md:w-auto md:px-3 shrink-0"
          title="Expandir tudo"
        >
          <ChevronDown className="h-4 w-4" />
          <span className="hidden md:inline ml-1">Expandir</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => toggleAllSections(false)}
          className="h-9 w-9 md:h-10 md:w-auto md:px-3 shrink-0"
          title="Colapsar tudo"
        >
          <ChevronUp className="h-4 w-4" />
          <span className="hidden md:inline ml-1">Colapsar</span>
        </Button>
      </div>

      {/* Lista de rotas */}
      <Accordion
        type="multiple"
        value={expandedSections}
        onValueChange={setExpandedSections}
        className="space-y-2 md:space-y-3"
      >
        {filteredSections.map((section) => (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="border border-border rounded-lg bg-card overflow-hidden"
          >
            <AccordionTrigger className="px-3 md:px-4 py-2 md:py-3 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <div className={`p-1.5 md:p-2 rounded-lg ${section.badgeColor}/20 shrink-0`}>
                  {section.icon}
                </div>
                <span className="font-semibold text-foreground text-sm md:text-base truncate">{section.title}</span>
                <Badge variant="secondary" className="text-[10px] md:text-xs shrink-0">
                  {section.routes.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-2 md:px-4 pb-3 md:pb-4">
              <div className="space-y-2 mt-2">
                {section.routes.map((route, idx) => (
                  <div
                    key={idx}
                    className="p-2 md:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {/* Linha 1: Nome + Botões */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground text-sm md:text-base truncate flex-1 min-w-0">
                        {route.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 md:h-9 md:w-9 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-800/50"
                          onClick={() => {
                            navigator.clipboard.writeText(route.path);
                            setCopiedPath(route.path);
                            toast({ title: "Copiado!", description: route.path });
                            setTimeout(() => setCopiedPath(null), 2000);
                          }}
                          title="Copiar caminho"
                        >
                          {copiedPath === route.path ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        {!route.path.includes(':') && !route.path.includes('*') && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 md:h-9 md:w-9 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30 border-green-200 dark:border-green-800/50"
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
                    
                    {/* Linha 2: Path + Componente */}
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs md:text-sm text-primary bg-primary/10 px-1.5 md:px-2 py-0.5 rounded truncate max-w-[200px] md:max-w-none">
                        {route.path}
                      </code>
                      {route.component && (
                        <span className="hidden md:inline text-muted-foreground text-xs truncate">
                          → {route.component}
                        </span>
                      )}
                    </div>
                    
                    {/* Linha 3: Badges de roles */}
                    <div className="flex items-center gap-1 mt-1.5 overflow-x-auto pb-1">
                      {route.roles.map((role, roleIdx) => (
                        <span key={roleIdx}>{getRoleBadge(role)}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {filteredSections.length === 0 && (
        <div className="text-center py-8 md:py-12 text-muted-foreground">
          <FileText className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
          <p className="text-sm md:text-base">Nenhuma rota encontrada para "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}
