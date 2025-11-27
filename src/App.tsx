import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "next-themes";
import { useRouteTheme } from "@/hooks/useRouteTheme";
import { CustomDomainRouter } from "@/components/CustomDomainRouter";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DeliveryDriverLayout } from "@/components/delivery/DeliveryDriverLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SignUp from "./pages/SignUp";
import PaymentProof from "./pages/PaymentProof";
import DashboardHome from "./pages/admin/DashboardHome";
import Store from "./pages/Store";
import StorePromotions from "./pages/StorePromotions";
import ProductPage from "./pages/ProductPage";
import StoreXML from "./pages/StoreXML";
import CustomerAuth from "./pages/CustomerAuth";
import CustomerPanel from "./pages/CustomerPanel";
import CustomerProfile from "./pages/CustomerProfile";
import OrderTracking from "./pages/OrderTracking";
import TermsOfUse from "./pages/TermsOfUse";
import Privacy from "./pages/Privacy";
import Checkout from "./pages/Checkout";
import Support from "./pages/Support";
import UsersDemo from "./pages/UsersDemo";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import Maintenance from "./pages/Maintenance";
import Offline from "./pages/Offline";
import StoreUnavailable from "./pages/StoreUnavailable";
import UsersPage from "./pages/admin/UsersPage";
import SubscribersPage from "./pages/admin/SubscribersPage";
import SubscriptionPage from "./pages/admin/SubscriptionPage";
import ModulesPage from "./pages/admin/ModulesPage";
import SubscriptionPaymentConfigPage from "./pages/admin/SubscriptionPaymentConfigPage";
import SubscriptionPaymentsManagementPage from "./pages/admin/SubscriptionPaymentsManagementPage";
import PlansPage from "./pages/admin/PlansPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import ProductsPage from "./pages/admin/ProductsPage";
import ProfilePage from "./pages/admin/ProfilePage";
import MyStorePage from "./pages/admin/MyStorePage";
import StoresPage from "./pages/admin/StoresPage";
import StoreConfigurationPage from "./pages/admin/StoreConfigurationPage";
import AddonCategoriesPage from './pages/admin/AddonCategoriesPage';
import AddonsPage from './pages/admin/AddonsPage';
import ProductFormPage from "./pages/admin/ProductFormPage";
import BannersPage from './pages/admin/BannersPage';
import BannerFormPage from './pages/admin/BannerFormPage';
import PromotionsPage from './pages/admin/PromotionsPage';
import PromotionFormPage from './pages/admin/PromotionFormPage';
import OrdersPage from './pages/admin/OrdersPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import ReportsPage from './pages/admin/ReportsPage';
import ScheduledOrdersPage from './pages/admin/ScheduledOrdersPage';
import DeliveryDriversPage from './pages/admin/DeliveryDriversPage';
import DeliveryDriverFinancials from './pages/admin/DeliveryDriverFinancials';
import DeliveryDriverPanel from './pages/DeliveryDriverPanel';
import DeliveryDriverReports from './pages/DeliveryDriverReports';
import DeliveryDriverPayments from './pages/DeliveryDriverPayments';
import DeliveryDriverProfile from './pages/DeliveryDriverProfile';
import DeliverySettingsPage from './pages/DeliverySettingsPage';
import PrintConfigPage from './pages/admin/PrintConfigPage';
import DriverRegister from './pages/DriverRegister';
import AcceptInvitation from './pages/AcceptInvitation';
import AvailableDriversPage from './pages/admin/AvailableDriversPage';
import AttendantsPage from './pages/admin/AttendantsPage';
import IntegrationsPage from './pages/admin/IntegrationsPage';
import IframePage from './pages/admin/IframePage';
import GoalsPage from './pages/admin/GoalsPage';
import SalesPromptsPage from './pages/admin/SalesPromptsPage';

const queryClient = new QueryClient();

// Componente interno para controlar o tema baseado na rota
function ThemeController() {
  useRouteTheme();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ThemeController />
              <CustomDomainRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/payment-proof" element={
              <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
                <PaymentProof />
              </ProtectedRoute>
            } />
            
            {/* Rotas do Dashboard - Protegidas para admins */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['store_admin', 'master_admin']}>
                <AdminLayout><DashboardHome /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/metas" element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <AdminLayout><GoalsPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/sales-prompts" element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <AdminLayout pageTitle="Prompts de Vendas">
                  <SalesPromptsPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/stores" element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <AdminLayout><StoresPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/subscription" element={
              <ProtectedRoute allowedRoles={['store_admin']}>
                <AdminLayout><SubscriptionPage /></AdminLayout>
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
            <Route path="/dashboard/store-configuration" element={
              <ProtectedRoute allowedRoles={['store_admin']}>
                <AdminLayout><StoreConfigurationPage /></AdminLayout>
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
            <Route path="/dashboard/customers" element={
              <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
                <AdminLayout><AdminCustomersPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/coupons" element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <AdminLayout><AdminCouponsPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/reports" element={
              <ProtectedRoute allowedRoles={['store_admin', 'master_admin', 'attendant']}>
                <AdminLayout><ReportsPage /></AdminLayout>
              </ProtectedRoute>
            } />
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
            <Route path="/dashboard/integrations" element={
              <ProtectedRoute allowedRoles={['store_admin']}>
                <AdminLayout><IntegrationsPage /></AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard/iframe/:id" element={
              <ProtectedRoute allowedRoles={['store_admin']}>
                <AdminLayout><IframePage /></AdminLayout>
              </ProtectedRoute>
            } />
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

            {/* Rotas do Entregador - Protegidas para delivery_driver */}
            <Route path="/delivery-panel" element={
              <ProtectedRoute allowedRoles={['delivery_driver']}>
                <DeliveryDriverLayout>
                  <DeliveryDriverPanel />
                </DeliveryDriverLayout>
              </ProtectedRoute>
            } />
            <Route path="/delivery-reports" element={
              <ProtectedRoute allowedRoles={['delivery_driver']}>
                <DeliveryDriverLayout>
                  <DeliveryDriverReports />
                </DeliveryDriverLayout>
              </ProtectedRoute>
            } />
            <Route path="/delivery-payments" element={
              <ProtectedRoute allowedRoles={['delivery_driver']}>
                <DeliveryDriverLayout>
                  <DeliveryDriverPayments />
                </DeliveryDriverLayout>
              </ProtectedRoute>
            } />
            <Route path="/delivery-profile" element={
              <ProtectedRoute allowedRoles={['delivery_driver']}>
                <DeliveryDriverLayout>
                  <DeliveryDriverProfile />
                </DeliveryDriverLayout>
              </ProtectedRoute>
            } />
            <Route path="/delivery-settings" element={
              <ProtectedRoute allowedRoles={['delivery_driver']}>
                <DeliveryDriverLayout>
                  <DeliverySettingsPage />
                </DeliveryDriverLayout>
              </ProtectedRoute>
            } />
            <Route path="/users-demo" element={<UsersDemo />} />
            <Route path="/cadastro-entregador" element={<DriverRegister />} />
            <Route path="/aceitar-convite/:token" element={<AcceptInvitation />} />
            <Route path="/loja/:slug" element={<Store />} />
            <Route path="/loja/:slug/promocoes" element={<StorePromotions />} />
            <Route path="/loja/:slug/info.xml" element={<StoreXML />} />
            <Route path="/loja/:storeSlug/produto/:productSlug" element={<ProductPage />} />
          <Route path="/cliente/:storeSlug" element={<CustomerAuth />} />
          <Route path="/painel-cliente/:storeSlug" element={<CustomerPanel />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pedido/:orderId" element={<OrderTracking />} />
            <Route path="/painel-cliente/:storeSlug/perfil" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerProfile />
              </ProtectedRoute>
            } />
            <Route path="/termos" element={<TermsOfUse />} />
            <Route path="/privacidade" element={<Privacy />} />
            <Route path="/suporte" element={<Support />} />
            
            {/* Error Pages */}
            <Route path="/500" element={<ServerError />} />
            <Route path="/503" element={<Maintenance />} />
            <Route path="/offline" element={<Offline />} />
            <Route path="/loja-indisponivel" element={<StoreUnavailable />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CustomDomainRouter>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
