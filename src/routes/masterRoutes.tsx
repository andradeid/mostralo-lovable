import { Route } from "react-router-dom";
import { lazy } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LazyRoute } from "@/components/LazyRoute";

// Master Admin Pages - Lazy loaded
const GoalsPage = lazy(() => import("@/pages/admin/GoalsPage"));
const NavigationGuidePage = lazy(() => import("@/pages/admin/NavigationGuidePage"));
const SalesPromptsPage = lazy(() => import("@/pages/admin/SalesPromptsPage"));
const QualificationBenefitsPage = lazy(() => import("@/pages/admin/QualificationBenefitsPage"));
const RecruitmentPage = lazy(() => import("@/pages/admin/RecruitmentPage"));
const ProspectingGuidePage = lazy(() => import("@/pages/admin/ProspectingGuidePage"));
const CompileAppsGuidePage = lazy(() => import("@/pages/admin/CompileAppsGuidePage"));
const OnboardingGuidePage = lazy(() => import("@/pages/salesperson/OnboardingGuidePage"));
const SalesMediaManagementPage = lazy(() => import("@/pages/admin/SalesMediaManagementPage"));
const BusinessIntelligencePage = lazy(() => import("@/pages/admin/BusinessIntelligencePage"));
const TestEnvironmentPage = lazy(() => import("@/pages/admin/TestEnvironmentPage"));
const IdeasPage = lazy(() => import("@/pages/admin/IdeasPage"));
const DiagnosticsPage = lazy(() => import("@/pages/admin/DiagnosticsPage"));
const WebhooksMonitorPage = lazy(() => import("@/pages/admin/WebhooksMonitorPage"));
const CloudflareGuidePage = lazy(() => import("@/pages/admin/CloudflareGuidePage"));
const IFoodHomologationPage = lazy(() => import("@/pages/admin/IFoodHomologationPage"));
const MasterWhatsAppPage = lazy(() => import("@/pages/admin/MasterWhatsAppPage"));
const StoreNotificationsManagementPage = lazy(() => import("@/pages/admin/StoreNotificationsManagementPage"));
const ExternalBillingPage = lazy(() => import("@/pages/admin/ExternalBillingPage"));
const SalespeopleListPage = lazy(() => import("@/pages/admin/SalespeopleListPage"));
const SalespersonDetailPage = lazy(() => import("@/pages/admin/SalespersonDetailPage"));
const SalespersonCommissionsPage = lazy(() => import("@/pages/admin/SalespersonCommissionsPage"));
const SalespersonActivityRulesPage = lazy(() => import("@/pages/admin/SalespersonActivityRulesPage"));
const SalespeoplePayoutsPage = lazy(() => import("@/pages/admin/SalespeoplePayoutsPage"));
const AffiliateEarningsReportsPage = lazy(() => import("@/pages/admin/AffiliateEarningsReportsPage"));
const StoresPage = lazy(() => import("@/pages/admin/StoresPage"));
const AllContractsAcceptancePage = lazy(() => import("@/pages/admin/AllContractsAcceptancePage"));
const SubscriptionPaymentConfigPage = lazy(() => import("@/pages/admin/SubscriptionPaymentConfigPage"));
const SubscriptionPaymentsManagementPage = lazy(() => import("@/pages/admin/SubscriptionPaymentsManagementPage"));
const ModuleAccessManagementPage = lazy(() => import("@/pages/admin/ModuleAccessManagementPage"));
const GatewayConfigPage = lazy(() => import("@/pages/admin/GatewayConfigPage"));
const EfiAccountsPage = lazy(() => import("@/pages/admin/EfiAccountsPage"));
const UsersPage = lazy(() => import("@/pages/admin/UsersPage"));
const ModulesPage = lazy(() => import("@/pages/admin/ModulesPage"));
const SubscribersPage = lazy(() => import("@/pages/admin/SubscribersPage"));
const PlansPage = lazy(() => import("@/pages/admin/PlansPage"));
const AdminCouponsPage = lazy(() => import("@/pages/admin/AdminCouponsPage"));
const EvolutionConfigPage = lazy(() => import("@/pages/admin/EvolutionConfigPage"));
const LeadsManagementPage = lazy(() => import("@/pages/admin/LeadsManagementPage"));
const FollowUpQueuePage = lazy(() => import("@/pages/admin/FollowUpQueuePage"));
const AdminSharePage = lazy(() => import("@/pages/admin/AdminSharePage"));
const ContractTemplateEditPage = lazy(() => import("@/pages/admin/ContractTemplateEditPage"));
const SystemUpdatesManagementPage = lazy(() => import("@/pages/admin/SystemUpdatesManagementPage"));
const SystemBannersPage = lazy(() => import("@/pages/admin/SystemBannersPage"));
const TechnicalDocsPage = lazy(() => import("@/pages/admin/TechnicalDocsPage"));
const TechSpecsPage = lazy(() => import("@/pages/admin/TechSpecsPage"));
const PopupABTestPage = lazy(() => import("@/pages/admin/PopupABTestPage"));
const AdminDigitalCardPage = lazy(() => import("@/pages/admin/AdminDigitalCardPage"));
const TutorialsManagementPage = lazy(() => import("@/pages/admin/TutorialsManagementPage"));
const ProposalsListPage = lazy(() => import("@/pages/admin/ProposalsListPage"));
const ProposalBuilderPage = lazy(() => import("@/pages/admin/ProposalBuilderPage"));
const NicheTemplatesPage = lazy(() => import("@/pages/admin/NicheTemplatesPage"));
const CompanySettingsPage = lazy(() => import("@/pages/admin/CompanySettingsPage"));
const GoogleAppsConfigPage = lazy(() => import("@/pages/admin/GoogleAppsConfigPage"));
const ImageSearchConfigPage = lazy(() => import("@/pages/admin/ImageSearchConfigPage"));
const SystemFinancePage = lazy(() => import("@/pages/admin/SystemFinancePage"));
const OpenAIUsagePage = lazy(() => import("@/pages/admin/OpenAIUsagePage"));
const WhatsAppWebhookConfigPage = lazy(() => import("@/pages/dashboard/WhatsAppWebhookConfigPage"));

export const masterRoutes = (
  <>
    {/* Metas e Guias */}
    <Route path="/dashboard/metas" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout>
          <LazyRoute><GoalsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/navegacao" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Guia de Navegação">
          <LazyRoute><NavigationGuidePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/sales-prompts" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Prompts de Vendas">
          <LazyRoute><SalesPromptsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/qualification-benefits" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Faixas de Qualificação">
          <LazyRoute><QualificationBenefitsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/recrutamento" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Recrutamento de Vendedores">
          <LazyRoute><RecruitmentPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/prospecting" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Guia de Prospecção">
          <LazyRoute><ProspectingGuidePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/compile-apps" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Compilar Apps">
          <LazyRoute><CompileAppsGuidePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/onboarding-guide" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Guia de Cadastro">
          <LazyRoute><OnboardingGuidePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/sales-media" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Biblioteca de Mídias">
          <LazyRoute><SalesMediaManagementPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/business-intelligence" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Inteligência de Negócios">
          <LazyRoute><BusinessIntelligencePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/test-environment" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Ambiente de Testes">
          <LazyRoute><TestEnvironmentPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/ideias" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Ideias e Funcionalidades">
          <LazyRoute><IdeasPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/diagnostics" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Diagnóstico de Performance">
          <LazyRoute><DiagnosticsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/webhooks-monitor" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Monitor de Webhooks">
          <LazyRoute><WebhooksMonitorPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/cloudflare-guide" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Guia Cloudflare">
          <LazyRoute><CloudflareGuidePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/ifood-homologation" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Homologação iFood">
          <LazyRoute><IFoodHomologationPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/master-whatsapp" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="WhatsApp Master">
          <LazyRoute><MasterWhatsAppPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/store-notifications" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Notificações das Lojas">
          <LazyRoute><StoreNotificationsManagementPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/external-billing" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Faturamento Externo">
          <LazyRoute><ExternalBillingPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Vendedores */}
    <Route path="/dashboard/salespeople" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout>
          <LazyRoute><SalespeopleListPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/salespeople/:id" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout>
          <LazyRoute><SalespersonDetailPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/salespeople/commissions" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout>
          <LazyRoute><SalespersonCommissionsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/salespeople/activity-rules" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout>
          <LazyRoute><SalespersonActivityRulesPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/salespeople/payouts" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Pagamentos de Vendedores">
          <LazyRoute><SalespeoplePayoutsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/salespeople/affiliate-reports" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Relatórios de Afiliados">
          <LazyRoute><AffiliateEarningsReportsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/salespeople/contract" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Editar Contrato">
          <LazyRoute><ContractTemplateEditPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Lojas e Configurações */}
    <Route path="/dashboard/stores" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout>
          <LazyRoute><StoresPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/contract-acceptances" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Aceites de Contratos">
          <LazyRoute><AllContractsAcceptancePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/company-settings" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Configurações da Empresa">
          <LazyRoute><CompanySettingsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/subscription-config" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout>
          <LazyRoute><SubscriptionPaymentConfigPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/subscription-payments" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout>
          <LazyRoute><SubscriptionPaymentsManagementPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/modulos/gerenciar-acesso" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Gerenciar Acesso a Módulos">
          <LazyRoute><ModuleAccessManagementPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/gateway-config" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Gateway de Pagamento">
          <LazyRoute><GatewayConfigPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/efi-accounts" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Contas EFI Lojistas">
          <LazyRoute><EfiAccountsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/users" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout>
          <LazyRoute><UsersPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/modules" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Módulos">
          <LazyRoute><ModulesPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/subscribers" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout>
          <LazyRoute><SubscribersPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/plans" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout>
          <LazyRoute><PlansPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/coupons" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout>
          <LazyRoute><AdminCouponsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/evolution-config" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Configuração Evolution API">
          <LazyRoute><EvolutionConfigPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/leads" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Gestão de Leads">
          <LazyRoute><LeadsManagementPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/follow-up-queue" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Fila de Follow-up">
          <LazyRoute><FollowUpQueuePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/material-divulgacao" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Material de Divulgação">
          <LazyRoute><AdminSharePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/system-updates" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Gerenciar Novidades">
          <LazyRoute><SystemUpdatesManagementPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/system-banners" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Banners do Sistema">
          <LazyRoute><SystemBannersPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/documentacao-tecnica" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Documentação Técnica">
          <LazyRoute><TechnicalDocsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/sistemas/especificacoes" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Especificações Técnicas">
          <LazyRoute><TechSpecsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/popup-ab-test" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Teste A/B - Popup Diagnóstico">
          <LazyRoute><PopupABTestPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/cartao-digital" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Meu Cartão Digital">
          <LazyRoute><AdminDigitalCardPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/tutorials-management" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Gerenciar Tutoriais">
          <LazyRoute><TutorialsManagementPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Propostas Comerciais */}
    <Route path="/dashboard/propostas" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Propostas Comerciais">
          <LazyRoute><ProposalsListPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/propostas/nova" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Nova Proposta">
          <LazyRoute><ProposalBuilderPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/propostas/templates" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Templates por Nicho">
          <LazyRoute><NicheTemplatesPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/google-apps" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Configurações Google Apps">
          <LazyRoute><GoogleAppsConfigPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/image-search-config" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Busca de Imagens">
          <LazyRoute><ImageSearchConfigPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/system-finance" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Finanças do Sistema">
          <LazyRoute><SystemFinancePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/openai-usage" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Custos OpenAI">
          <LazyRoute><OpenAIUsagePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp-webhooks" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Webhooks de Imagens">
          <LazyRoute><WhatsAppWebhookConfigPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />

    {/* Marketing & Tracking */}
    <Route path="/dashboard/marketing-tracking" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Marketing & Tracking">
          <LazyRoute><MarketingTrackingPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
  </>
);
