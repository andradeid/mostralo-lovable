import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";

// Store Admin Pages
import PaymentProof from "@/pages/PaymentProof";
import DashboardHome from "@/pages/admin/DashboardHome";
import SubscriptionPage from "@/pages/admin/SubscriptionPage";
import MerchantContractHistoryPage from "@/pages/admin/MerchantContractHistoryPage";
import StoreOnlinePaymentPage from "@/pages/admin/StoreOnlinePaymentPage";
import StoreConfigurationPage from "@/pages/admin/StoreConfigurationPage";
import CategoriesPage from "@/pages/admin/CategoriesPage";
import ProductsPage from "@/pages/admin/ProductsPage";
import ProductFormPage from "@/pages/admin/ProductFormPage";
import AddonCategoriesPage from "@/pages/admin/AddonCategoriesPage";
import AddonsPage from "@/pages/admin/AddonsPage";
import PromotionsPage from "@/pages/admin/PromotionsPage";
import PromotionFormPage from "@/pages/admin/PromotionFormPage";
import BannersPage from "@/pages/admin/BannersPage";
import BannerFormPage from "@/pages/admin/BannerFormPage";
import OrdersPage from "@/pages/admin/OrdersPage";
import ScheduledOrdersPage from "@/pages/admin/ScheduledOrdersPage";
import AdminCustomersPage from "@/pages/admin/AdminCustomersPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import DeliveryDriversPage from "@/pages/admin/DeliveryDriversPage";
import AvailableDriversPage from "@/pages/admin/AvailableDriversPage";
import DeliveryDriverFinancials from "@/pages/admin/DeliveryDriverFinancials";
import ProfilePage from "@/pages/admin/ProfilePage";
import AttendantsPage from "@/pages/admin/AttendantsPage";
import FinancialManagementPage from "@/pages/admin/FinancialManagementPage";
import IntegrationsPage from "@/pages/admin/IntegrationsPage";
import IFoodIntegrationPage from "@/pages/admin/integrations/IFoodIntegrationPage";
import IframePage from "@/pages/admin/IframePage";
import StoreMarketingPage from "@/pages/admin/StoreMarketingPage";
import SignageManagementPage from "@/pages/admin/SignageManagementPage";
import PasswordCallManagementPage from "@/pages/admin/PasswordCallManagementPage";
import MyStorePage from "@/pages/admin/MyStorePage";
import PrintConfigPage from "@/pages/admin/PrintConfigPage";
import WhatsAppInstancePage from "@/pages/admin/WhatsAppInstancePage";
import WhatsAppConversationsPage from "@/pages/admin/WhatsAppConversationsPage";
import WhatsAppTemplatesPage from "@/pages/admin/WhatsAppTemplatesPage";
import WhatsAppCampaignsPage from "@/pages/admin/WhatsAppCampaignsPage";
import WhatsAppCampaignNewPage from "@/pages/admin/WhatsAppCampaignNewPage";
import WhatsAppCampaignMessagesPage from "@/pages/admin/WhatsAppCampaignMessagesPage";
import WhatsAppAutomationsPage from "@/pages/admin/WhatsAppAutomationsPage";
import WhatsAppContactsPage from "@/pages/admin/WhatsAppContactsPage";
import SystemUpdatesPage from "@/pages/SystemUpdatesPage";
import SentinelaPage from "@/pages/store-admin/Sentinela";

export const storeAdminRoutes = (
  <>
    {/* Dashboard Principal */}
    <Route path="/dashboard" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout><DashboardHome /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Comprovante de Pagamento */}
    <Route path="/payment-proof" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <PaymentProof />
      </ProtectedRoute>
    } />
    
    {/* Assinatura e Contratos (Store Admin Only) */}
    <Route path="/dashboard/subscription" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout><SubscriptionPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/contracts" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Meus Contratos"><MerchantContractHistoryPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/online-payment" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Pagamento Online"><StoreOnlinePaymentPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/store-configuration" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout><StoreConfigurationPage /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Catálogo */}
    <Route path="/dashboard/categories" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><CategoriesPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/products" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><ProductsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/products/new" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><ProductFormPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/products/edit/:id" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><ProductFormPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/addon-categories" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><AddonCategoriesPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/addons" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><AddonsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Promoções e Banners */}
    <Route path="/dashboard/promotions" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><PromotionsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/promotions/new" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><PromotionFormPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/promotions/:id" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><PromotionFormPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/banners" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout><BannersPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/banners/new" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout><BannerFormPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/banners/edit/:id" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout><BannerFormPage /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Pedidos */}
    <Route path="/dashboard/orders" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><OrdersPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/scheduled-orders" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout><ScheduledOrdersPage /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Clientes e Relatórios */}
    <Route path="/dashboard/customers" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><AdminCustomersPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/reports" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><ReportsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Entregadores */}
    <Route path="/dashboard/delivery-drivers" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout><DeliveryDriversPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/entregadores-disponiveis" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout pageTitle="Entregadores Disponíveis"><AvailableDriversPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/entregadores/financeiro" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout><DeliveryDriverFinancials /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Perfil e Equipe */}
    <Route path="/dashboard/profile" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout><ProfilePage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/attendants" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout><AttendantsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Financeiro */}
    <Route path="/dashboard/financeiro" element={
      <ProtectedRoute allowedRoles={['store_admin', 'attendant']}>
        <AdminLayout pageTitle="Gestão Financeira"><FinancialManagementPage /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Integrações */}
    <Route path="/dashboard/integrations" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout><IntegrationsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/integrations/ifood" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Integração iFood"><IFoodIntegrationPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/iframe/:id" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout><IframePage /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Marketing e Sinalização */}
    <Route path="/dashboard/marketing-material" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Material de Marketing"><StoreMarketingPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/signage" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout pageTitle="Painel Digital"><SignageManagementPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/password-call" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout pageTitle="Chamada de Senhas"><PasswordCallManagementPage /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Minha Loja e Impressão */}
    <Route path="/dashboard/my-store" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout><MyStorePage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/print-config" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout><PrintConfigPage /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* WhatsApp - Store Admin */}
    <Route path="/dashboard/whatsapp" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Conexão WhatsApp"><WhatsAppInstancePage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/conversations" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Conversas"><WhatsAppConversationsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/templates" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Modelos de Mensagem"><WhatsAppTemplatesPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/automations" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Mensagens Automáticas"><WhatsAppAutomationsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/campaigns" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Campanhas WhatsApp"><WhatsAppCampaignsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/campaigns/new" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Nova Campanha"><WhatsAppCampaignNewPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/campaigns/:id/messages" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Histórico de Mensagens"><WhatsAppCampaignMessagesPage /></AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/contacts" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Contatos WhatsApp"><WhatsAppContactsPage /></AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Novidades do Sistema */}
    <Route path="/dashboard/novidades" element={
      <ProtectedRoute allowedRoles={['master_admin', 'store_admin', 'attendant']}>
        <AdminLayout pageTitle="Novidades do Sistema">
          <SystemUpdatesPage />
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Sentinela */}
    <Route path="/dashboard/sentinela" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Sentinela"><SentinelaPage /></AdminLayout>
      </ProtectedRoute>
    } />
  </>
);
