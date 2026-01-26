import { Route } from "react-router-dom";
import { lazy } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LazyRoute } from "@/components/LazyRoute";
import { AttendantPermissionGate } from "@/components/admin/AttendantPermissionGate";

// Store Admin Pages - Lazy loaded
const PaymentProof = lazy(() => import("@/pages/PaymentProof"));
const DashboardHome = lazy(() => import("@/pages/admin/DashboardHome"));
const SubscriptionPage = lazy(() => import("@/pages/admin/SubscriptionPage"));
const MerchantContractHistoryPage = lazy(() => import("@/pages/admin/MerchantContractHistoryPage"));
const StoreOnlinePaymentPage = lazy(() => import("@/pages/admin/StoreOnlinePaymentPage"));
const StoreConfigurationPage = lazy(() => import("@/pages/admin/StoreConfigurationPage"));
const CategoriesPage = lazy(() => import("@/pages/admin/CategoriesPage"));
const ProductsPage = lazy(() => import("@/pages/admin/ProductsPage"));
const ProductFormPage = lazy(() => import("@/pages/admin/ProductFormPage"));
const ProductImportPage = lazy(() => import("@/pages/admin/ProductImportPage"));
const AlquimiaImportPage = lazy(() => import("@/pages/admin/AlquimiaImportPage"));
const AddonCategoriesPage = lazy(() => import("@/pages/admin/AddonCategoriesPage"));
const AddonsPage = lazy(() => import("@/pages/admin/AddonsPage"));
const PromotionsPage = lazy(() => import("@/pages/admin/PromotionsPage"));
const PromotionFormPage = lazy(() => import("@/pages/admin/PromotionFormPage"));
const BannersPage = lazy(() => import("@/pages/admin/BannersPage"));
const BannerFormPage = lazy(() => import("@/pages/admin/BannerFormPage"));
const OrdersPage = lazy(() => import("@/pages/admin/OrdersPage"));
const ScheduledOrdersPage = lazy(() => import("@/pages/admin/ScheduledOrdersPage"));
const AdminCustomersPage = lazy(() => import("@/pages/admin/AdminCustomersPage"));
const ReportsPage = lazy(() => import("@/pages/admin/ReportsPage"));
const DeliveryDriversPage = lazy(() => import("@/pages/admin/DeliveryDriversPage"));
const AvailableDriversPage = lazy(() => import("@/pages/admin/AvailableDriversPage"));
const DeliveryDriverFinancials = lazy(() => import("@/pages/admin/DeliveryDriverFinancials"));
const ProfilePage = lazy(() => import("@/pages/admin/ProfilePage"));
const AttendantsPage = lazy(() => import("@/pages/admin/AttendantsPage"));
const FinancialManagementPage = lazy(() => import("@/pages/admin/FinancialManagementPage"));
const IntegrationsPage = lazy(() => import("@/pages/admin/IntegrationsPage"));
const IFoodIntegrationPage = lazy(() => import("@/pages/admin/integrations/IFoodIntegrationPage"));
const IframePage = lazy(() => import("@/pages/admin/IframePage"));
const StoreMarketingPage = lazy(() => import("@/pages/admin/StoreMarketingPage"));
const SignageManagementPage = lazy(() => import("@/pages/admin/SignageManagementPage"));
const PasswordCallManagementPage = lazy(() => import("@/pages/admin/PasswordCallManagementPage"));
const MyStorePage = lazy(() => import("@/pages/admin/MyStorePage"));
const PrintConfigPage = lazy(() => import("@/pages/admin/PrintConfigPage"));
const WhatsAppInstancePage = lazy(() => import("@/pages/admin/WhatsAppInstancePage"));
const WhatsAppConversationsPage = lazy(() => import("@/pages/admin/WhatsAppConversationsPage"));
const WhatsAppTemplatesPage = lazy(() => import("@/pages/admin/WhatsAppTemplatesPage"));
const WhatsAppCampaignsPage = lazy(() => import("@/pages/admin/WhatsAppCampaignsPage"));
const WhatsAppCampaignNewPage = lazy(() => import("@/pages/admin/WhatsAppCampaignNewPage"));
const WhatsAppCampaignMessagesPage = lazy(() => import("@/pages/admin/WhatsAppCampaignMessagesPage"));
const WhatsAppAutomationsPage = lazy(() => import("@/pages/admin/WhatsAppAutomationsPage"));
const WhatsAppContactsPage = lazy(() => import("@/pages/admin/WhatsAppContactsPage"));
const SystemUpdatesPage = lazy(() => import("@/pages/SystemUpdatesPage"));
const SentinelaPage = lazy(() => import("@/pages/store-admin/Sentinela"));
const PDVPage = lazy(() => import("@/pages/admin/PDVPage"));
const ComandasPage = lazy(() => import("@/pages/admin/ComandasPage"));
const ComandaDetailPage = lazy(() => import("@/pages/admin/ComandaDetailPage"));
const KitchenDisplayPage = lazy(() => import("@/pages/admin/KitchenDisplayPage"));
const TableQRCodePage = lazy(() => import("@/pages/admin/TableQRCodePage"));
const TotemConfigPage = lazy(() => import("@/pages/admin/TotemConfigPage"));
const BookingCalendarPage = lazy(() => import("@/pages/admin/BookingCalendarPage"));
const ProfessionalsPage = lazy(() => import("@/pages/admin/ProfessionalsPage"));
const BookingServicesPage = lazy(() => import("@/pages/admin/BookingServicesPage"));
const ProfessionalAvailabilityPage = lazy(() => import("@/pages/admin/ProfessionalAvailabilityPage"));
const BookingSettingsPage = lazy(() => import("@/pages/admin/BookingSettingsPage"));
const BookingReportsPage = lazy(() => import("@/pages/admin/BookingReportsPage"));
const BookingReviewsPage = lazy(() => import("@/pages/admin/BookingReviewsPage"));
const BookingCommissionPaymentsPage = lazy(() => import("@/pages/admin/BookingCommissionPaymentsPage"));
const ClientSubscriptionsDashboardPage = lazy(() => import("@/pages/admin/ClientSubscriptionsDashboardPage"));
const ClientSubscriptionPlansPage = lazy(() => import("@/pages/admin/ClientSubscriptionPlansPage"));
const ClientSubscribersPage = lazy(() => import("@/pages/admin/ClientSubscribersPage"));
const CrossSellRulesPage = lazy(() => import("@/pages/admin/CrossSellRulesPage"));
const UpsellCrossSellStatsPage = lazy(() => import("@/pages/admin/UpsellCrossSellStatsPage"));
const StoreDigitalCardsPage = lazy(() => import("@/pages/store-admin/StoreDigitalCardsPage"));
const StoreDigitalCardEditorPage = lazy(() => import("@/pages/store-admin/StoreDigitalCardEditorPage"));
const TutorialsPage = lazy(() => import("@/pages/store-admin/TutorialsPage"));

// Dental Module Pages
const PatientsPage = lazy(() => import("@/pages/admin/dental/PatientsPage"));
const PatientDetailPage = lazy(() => import("@/pages/admin/dental/PatientDetailPage"));
const TreatmentPlansPage = lazy(() => import("@/pages/admin/dental/TreatmentPlansPage"));
const DentalQuotesPage = lazy(() => import("@/pages/admin/dental/DentalQuotesPage"));
const DentalProceduresPage = lazy(() => import("@/pages/admin/dental/DentalProceduresPage"));
const DentalDocumentsPage = lazy(() => import("@/pages/admin/dental/DentalDocumentsPage"));

export const storeAdminRoutes = (
  <>
    {/* Dashboard Principal */}
    <Route path="/dashboard" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout>
          <LazyRoute><DashboardHome /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Comprovante de Pagamento */}
    <Route path="/payment-proof" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <LazyRoute><PaymentProof /></LazyRoute>
      </ProtectedRoute>
    } />
    
    {/* Assinatura e Contratos (Store Admin Only) */}
    <Route path="/dashboard/subscription" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout>
          <LazyRoute><SubscriptionPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/contracts" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Meus Contratos">
          <LazyRoute><MerchantContractHistoryPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/online-payment" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Pagamento Online">
          <LazyRoute><StoreOnlinePaymentPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/store-configuration" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout>
          <LazyRoute><StoreConfigurationPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Catálogo - Permissão: produtos */}
    <Route path="/dashboard/categories" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <AttendantPermissionGate permissionKey="produtos">
            <LazyRoute><CategoriesPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/products" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <AttendantPermissionGate permissionKey="produtos">
            <LazyRoute><ProductsPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/products/new" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <AttendantPermissionGate permissionKey="produtos">
            <LazyRoute><ProductFormPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/products/edit/:id" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <AttendantPermissionGate permissionKey="produtos">
            <LazyRoute><ProductFormPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/products/import" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout pageTitle="Importar Produtos">
          <LazyRoute><ProductImportPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/products/import-alquimia" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout pageTitle="Importar do Alquimia">
          <LazyRoute><AlquimiaImportPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/addon-categories" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <AttendantPermissionGate permissionKey="produtos">
            <LazyRoute><AddonCategoriesPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/addons" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <AttendantPermissionGate permissionKey="produtos">
            <LazyRoute><AddonsPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Promoções e Banners */}
    <Route path="/dashboard/promotions" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <LazyRoute><PromotionsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/promotions/new" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <LazyRoute><PromotionFormPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/promotions/:id" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <LazyRoute><PromotionFormPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/banners" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout>
          <LazyRoute><BannersPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/banners/new" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout>
          <LazyRoute><BannerFormPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/banners/edit/:id" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout>
          <LazyRoute><BannerFormPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Pedidos - Permissão: pedidos_delivery */}
    <Route path="/dashboard/orders" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <AttendantPermissionGate permissionKey="pedidos_delivery">
            <LazyRoute><OrdersPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/scheduled-orders" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout>
          <LazyRoute><ScheduledOrdersPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Clientes - Permissão: clientes */}
    <Route path="/dashboard/customers" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <AttendantPermissionGate permissionKey="clientes">
            <LazyRoute><AdminCustomersPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Relatórios - Permissão: relatorios */}
    <Route path="/dashboard/reports" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <AttendantPermissionGate permissionKey="relatorios">
            <LazyRoute><ReportsPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Entregadores */}
    <Route path="/dashboard/delivery-drivers" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout>
          <LazyRoute><DeliveryDriversPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/entregadores-disponiveis" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout pageTitle="Entregadores Disponíveis">
          <LazyRoute><AvailableDriversPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/entregadores/financeiro" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout>
          <LazyRoute><DeliveryDriverFinancials /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Perfil e Equipe */}
    <Route path="/dashboard/profile" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout>
          <LazyRoute><ProfilePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/attendants" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout>
          <LazyRoute><AttendantsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Financeiro */}
    <Route path="/dashboard/financeiro" element={
      <ProtectedRoute allowedRoles={['store_admin', 'attendant']}>
        <AdminLayout pageTitle="Gestão Financeira">
          <LazyRoute><FinancialManagementPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Integrações */}
    <Route path="/dashboard/integrations" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout>
          <LazyRoute><IntegrationsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/integrations/ifood" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Integração iFood">
          <LazyRoute><IFoodIntegrationPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/iframe/:id" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout>
          <LazyRoute><IframePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Marketing e Sinalização */}
    <Route path="/dashboard/marketing-material" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Material de Marketing">
          <LazyRoute><StoreMarketingPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/signage" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout pageTitle="Painel Digital">
          <LazyRoute><SignageManagementPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/password-call" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout pageTitle="Chamada de Senhas">
          <LazyRoute><PasswordCallManagementPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Minha Loja e Impressão */}
    <Route path="/dashboard/my-store" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout>
          <LazyRoute><MyStorePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/print-config" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
        <AdminLayout>
          <LazyRoute><PrintConfigPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* WhatsApp - Store Admin */}
    <Route path="/dashboard/whatsapp" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Conexão WhatsApp">
          <LazyRoute><WhatsAppInstancePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/conversations" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Conversas">
          <LazyRoute><WhatsAppConversationsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/templates" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Modelos de Mensagem">
          <LazyRoute><WhatsAppTemplatesPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/automations" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Mensagens Automáticas">
          <LazyRoute><WhatsAppAutomationsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/campaigns" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Campanhas WhatsApp">
          <LazyRoute><WhatsAppCampaignsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/campaigns/new" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Nova Campanha">
          <LazyRoute><WhatsAppCampaignNewPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/campaigns/:id/messages" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Histórico de Mensagens">
          <LazyRoute><WhatsAppCampaignMessagesPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/whatsapp/contacts" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Contatos WhatsApp">
          <LazyRoute><WhatsAppContactsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Novidades do Sistema */}
    <Route path="/dashboard/novidades" element={
      <ProtectedRoute allowedRoles={['master_admin', 'store_admin', 'attendant']}>
        <AdminLayout pageTitle="Novidades do Sistema">
          <LazyRoute><SystemUpdatesPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Sentinela */}
    <Route path="/dashboard/sentinela" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Sentinela">
          <LazyRoute><SentinelaPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />

    {/* PDV - Permissão: pedidos_balcao */}
    <Route path="/dashboard/pdv" element={
      <ProtectedRoute allowedRoles={['store_admin', 'attendant']}>
        <AdminLayout pageTitle="PDV - Ponto de Venda">
          <AttendantPermissionGate permissionKey="pedidos_balcao">
            <LazyRoute><PDVPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Comandas - Permissão: comandas */}
    <Route path="/dashboard/comandas" element={
      <ProtectedRoute allowedRoles={['store_admin', 'attendant']}>
        <AdminLayout pageTitle="Comandas">
          <AttendantPermissionGate permissionKey="comandas">
            <LazyRoute><ComandasPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/comandas/:id" element={
      <ProtectedRoute allowedRoles={['store_admin', 'attendant']}>
        <AdminLayout pageTitle="Detalhes da Comanda">
          <AttendantPermissionGate permissionKey="comandas">
            <LazyRoute><ComandaDetailPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* KDS/Cozinha - Permissão: kds */}
    <Route path="/dashboard/cozinha" element={
      <ProtectedRoute allowedRoles={['store_admin', 'attendant']}>
        <AdminLayout pageTitle="KDS - Cozinha">
          <AttendantPermissionGate permissionKey="kds">
            <LazyRoute><KitchenDisplayPage /></LazyRoute>
          </AttendantPermissionGate>
        </AdminLayout>
      </ProtectedRoute>
    } />
    
    {/* Mesas QR Code - Cardápio na Mesa */}
    <Route path="/dashboard/mesas-qrcode" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Mesas QR Code">
          <LazyRoute><TableQRCodePage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />

    {/* Totem de Autoatendimento */}
    <Route path="/dashboard/totem-config" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Totem de Autoatendimento">
          <LazyRoute><TotemConfigPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />

    {/* Módulo de Agendamento (Booking) */}
    <Route path="/dashboard/booking" element={
      <ProtectedRoute allowedRoles={['store_admin', 'attendant']}>
        <AdminLayout pageTitle="Agenda">
          <LazyRoute><BookingCalendarPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/booking/professionals" element={
      <ProtectedRoute allowedRoles={['store_admin', 'attendant']}>
        <AdminLayout pageTitle="Profissionais">
          <LazyRoute><ProfessionalsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/booking/services" element={
      <ProtectedRoute allowedRoles={['store_admin', 'attendant']}>
        <AdminLayout pageTitle="Serviços de Agendamento">
          <LazyRoute><BookingServicesPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/booking/disponibilidade" element={
      <ProtectedRoute allowedRoles={['store_admin', 'attendant']}>
        <AdminLayout pageTitle="Disponibilidade">
          <LazyRoute><ProfessionalAvailabilityPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/booking/configuracoes" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Configurações de Agendamento">
          <LazyRoute><BookingSettingsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/booking/relatorios" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Relatórios de Agendamentos">
          <LazyRoute><BookingReportsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/booking/avaliacoes" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Avaliações dos Profissionais">
          <LazyRoute><BookingReviewsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/booking/payments" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Pagamentos de Comissões">
          <LazyRoute><BookingCommissionPaymentsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />

    {/* Assinaturas de Clientes (Clube de Assinaturas) */}
    <Route path="/dashboard/assinaturas" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Clube de Assinaturas">
          <LazyRoute><ClientSubscriptionsDashboardPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/assinaturas/planos" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Planos de Assinatura">
          <LazyRoute><ClientSubscriptionPlansPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/assinaturas/assinantes" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Assinantes">
          <LazyRoute><ClientSubscribersPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />

    {/* Vendas Sugeridas (Upsell/Cross-sell) */}
    <Route path="/dashboard/vendas-sugeridas" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Estatísticas de Vendas Sugeridas">
          <LazyRoute><UpsellCrossSellStatsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/vendas-sugeridas/crosssell" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Regras de Cross-sell">
          <LazyRoute><CrossSellRulesPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />

    {/* Cartões Digitais da Equipe */}
    <Route path="/dashboard/cartoes-equipe" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Cartões Digitais da Equipe">
          <LazyRoute><StoreDigitalCardsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/cartoes-equipe/:cardId" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Editar Cartão Digital">
          <LazyRoute><StoreDigitalCardEditorPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/tutoriais" element={
      <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
        <AdminLayout pageTitle="Tutoriais">
          <LazyRoute><TutorialsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />

    {/* Módulo Odontológico */}
    <Route path="/dashboard/dental/pacientes" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Pacientes">
          <LazyRoute><PatientsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/dental/pacientes/:patientId" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Detalhes do Paciente">
          <LazyRoute><PatientDetailPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/dental/tratamentos" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Planos de Tratamento">
          <LazyRoute><TreatmentPlansPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/dental/orcamentos" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Orçamentos">
          <LazyRoute><DentalQuotesPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/dental/procedimentos" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Procedimentos">
          <LazyRoute><DentalProceduresPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
    <Route path="/dashboard/dental/documentos" element={
      <ProtectedRoute allowedRoles={['store_admin']}>
        <AdminLayout pageTitle="Documentos">
          <LazyRoute><DentalDocumentsPage /></LazyRoute>
        </AdminLayout>
      </ProtectedRoute>
    } />
  </>
);
