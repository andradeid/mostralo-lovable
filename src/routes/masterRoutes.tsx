import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";

// Master Admin Pages
import GoalsPage from "@/pages/admin/GoalsPage";
import NavigationGuidePage from "@/pages/admin/NavigationGuidePage";
import SalesPromptsPage from "@/pages/admin/SalesPromptsPage";
import QualificationBenefitsPage from "@/pages/admin/QualificationBenefitsPage";
import RecruitmentPage from "@/pages/admin/RecruitmentPage";
import ProspectingGuidePage from "@/pages/admin/ProspectingGuidePage";
import CompileAppsGuidePage from "@/pages/admin/CompileAppsGuidePage";
import OnboardingGuidePage from "@/pages/salesperson/OnboardingGuidePage";
import SalesMediaManagementPage from "@/pages/admin/SalesMediaManagementPage";
import BusinessIntelligencePage from "@/pages/admin/BusinessIntelligencePage";
import TestEnvironmentPage from "@/pages/admin/TestEnvironmentPage";
import IdeasPage from "@/pages/admin/IdeasPage";
import DiagnosticsPage from "@/pages/admin/DiagnosticsPage";
import WebhooksMonitorPage from "@/pages/admin/WebhooksMonitorPage";
import CloudflareGuidePage from "@/pages/admin/CloudflareGuidePage";
import IFoodHomologationPage from "@/pages/admin/IFoodHomologationPage";
import MasterWhatsAppPage from "@/pages/admin/MasterWhatsAppPage";
import StoreNotificationsManagementPage from "@/pages/admin/StoreNotificationsManagementPage";
import ExternalBillingPage from "@/pages/admin/ExternalBillingPage";
import SalespeopleListPage from "@/pages/admin/SalespeopleListPage";
import SalespersonDetailPage from "@/pages/admin/SalespersonDetailPage";
import SalespersonCommissionsPage from "@/pages/admin/SalespersonCommissionsPage";
import SalespersonActivityRulesPage from "@/pages/admin/SalespersonActivityRulesPage";
import SalespeoplePayoutsPage from "@/pages/admin/SalespeoplePayoutsPage";
import AffiliateEarningsReportsPage from "@/pages/admin/AffiliateEarningsReportsPage";
import StoresPage from "@/pages/admin/StoresPage";
import AllContractsAcceptancePage from "@/pages/admin/AllContractsAcceptancePage";
import SubscriptionPaymentConfigPage from "@/pages/admin/SubscriptionPaymentConfigPage";
import SubscriptionPaymentsManagementPage from "@/pages/admin/SubscriptionPaymentsManagementPage";
import ModuleAccessManagementPage from "@/pages/admin/ModuleAccessManagementPage";
import GatewayConfigPage from "@/pages/admin/GatewayConfigPage";
import EfiAccountsPage from "@/pages/admin/EfiAccountsPage";
import UsersPage from "@/pages/admin/UsersPage";
import ModulesPage from "@/pages/admin/ModulesPage";
import SubscribersPage from "@/pages/admin/SubscribersPage";
import PlansPage from "@/pages/admin/PlansPage";
import AdminCouponsPage from "@/pages/admin/AdminCouponsPage";
import EvolutionConfigPage from "@/pages/admin/EvolutionConfigPage";
import LeadsManagementPage from "@/pages/admin/LeadsManagementPage";
import AdminSharePage from "@/pages/admin/AdminSharePage";
import ContractTemplateEditPage from "@/pages/admin/ContractTemplateEditPage";
import SystemUpdatesManagementPage from "@/pages/admin/SystemUpdatesManagementPage";
import SystemBannersPage from "@/pages/admin/SystemBannersPage";

export const masterRoutes = (
  <>
    {/* Metas e Guias */}
    <Route path="/dashboard/metas" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout><GoalsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/navegacao" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Guia de Navegação">
          <NavigationGuidePage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/sales-prompts" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Prompts de Vendas">
          <SalesPromptsPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/qualification-benefits" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Faixas de Qualificação">
          <QualificationBenefitsPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/recrutamento" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Recrutamento de Vendedores">
          <RecruitmentPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/prospecting" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Guia de Prospecção">
          <ProspectingGuidePage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/compile-apps" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Compilar Apps">
          <CompileAppsGuidePage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/onboarding-guide" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Guia de Cadastro">
          <OnboardingGuidePage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/sales-media" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Biblioteca de Mídias">
          <SalesMediaManagementPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/business-intelligence" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Inteligência de Negócios">
          <BusinessIntelligencePage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/test-environment" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Ambiente de Testes">
          <TestEnvironmentPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/ideias" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Ideias e Funcionalidades">
          <IdeasPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/diagnostics" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Diagnóstico de Performance">
          <DiagnosticsPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/webhooks-monitor" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Monitor de Webhooks">
          <WebhooksMonitorPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/cloudflare-guide" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Guia Cloudflare">
          <CloudflareGuidePage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/ifood-homologation" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Homologação iFood">
          <IFoodHomologationPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/master-whatsapp" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="WhatsApp Master">
          <MasterWhatsAppPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/store-notifications" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Notificações das Lojas">
          <StoreNotificationsManagementPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/external-billing" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Faturamento Externo">
          <ExternalBillingPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Vendedores */}
    <Route path="/dashboard/salespeople" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout><SalespeopleListPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/salespeople/:id" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout><SalespersonDetailPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/salespeople/commissions" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout><SalespersonCommissionsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/salespeople/activity-rules" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout><SalespersonActivityRulesPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/salespeople/payouts" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Pagamentos de Vendedores"><SalespeoplePayoutsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/salespeople/affiliate-reports" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Relatórios de Afiliados"><AffiliateEarningsReportsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/salespeople/contract" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Editar Contrato"><ContractTemplateEditPage /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Lojas e Configurações */}
    <Route path="/dashboard/stores" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout><StoresPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/contract-acceptances" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Aceites de Contratos"><AllContractsAcceptancePage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/subscription-config" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout><SubscriptionPaymentConfigPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/subscription-payments" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout><SubscriptionPaymentsManagementPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/modulos/gerenciar-acesso" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Gerenciar Acesso a Módulos"><ModuleAccessManagementPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/gateway-config" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Gateway de Pagamento"><GatewayConfigPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/efi-accounts" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Contas EFI Lojistas"><EfiAccountsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/users" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout><UsersPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/modules" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Módulos"><ModulesPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/subscribers" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout><SubscribersPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/plans" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout><PlansPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/coupons" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout><AdminCouponsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/evolution-config" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Configuração Evolution API"><EvolutionConfigPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/leads" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Gestão de Leads"><LeadsManagementPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/material-divulgacao" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Material de Divulgação"><AdminSharePage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/system-updates" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Gerenciar Novidades">
          <SystemUpdatesManagementPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/system-banners" element={
      <ProtectedRoute allowedRoles={['master_admin']}>
        <AdminLayout pageTitle="Banners do Sistema">
          <SystemBannersPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
  </>
);
