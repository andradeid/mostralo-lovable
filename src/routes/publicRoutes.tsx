import { Route } from "react-router-dom";
import { lazy } from "react";
import { LazyRoute } from "@/components/LazyRoute";
import { UpdatesRedirect } from "@/components/system-updates/UpdatesRedirect";

// Critical pages - loaded immediately (landing, auth, store)
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Store from "@/pages/Store";
import NotFound from "@/pages/NotFound";

// Public Pages - Lazy loaded
const SignUp = lazy(() => import("@/pages/SignUp"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const StorePromotions = lazy(() => import("@/pages/StorePromotions"));
const ProductPage = lazy(() => import("@/pages/ProductPage"));
const StoreXML = lazy(() => import("@/pages/StoreXML"));
const GoogleShoppingFeed = lazy(() => import("@/pages/GoogleShoppingFeed"));
const MetaCommerceFeed = lazy(() => import("@/pages/MetaCommerceFeed"));
const CustomerAuth = lazy(() => import("@/pages/CustomerAuth"));
const CustomerPanel = lazy(() => import("@/pages/CustomerPanel"));
const OrderTracking = lazy(() => import("@/pages/OrderTracking"));
const TableAccessPage = lazy(() => import("@/pages/TableAccessPage"));
const TableMenuPage = lazy(() => import("@/pages/TableMenuPage"));
const TermsOfUse = lazy(() => import("@/pages/TermsOfUse"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Support = lazy(() => import("@/pages/Support"));
const UsersDemo = lazy(() => import("@/pages/UsersDemo"));
const SejaVendedor = lazy(() => import("@/pages/SejaVendedor"));
const CadastroVendedor = lazy(() => import("@/pages/CadastroVendedor"));
const CadastroVendedorSucesso = lazy(() => import("@/pages/CadastroVendedorSucesso"));
const ServerError = lazy(() => import("@/pages/ServerError"));
const Maintenance = lazy(() => import("@/pages/Maintenance"));
const Offline = lazy(() => import("@/pages/Offline"));
const StoreUnavailable = lazy(() => import("@/pages/StoreUnavailable"));
const Sitemap = lazy(() => import("@/pages/Sitemap"));
const InvoicePayment = lazy(() => import("@/pages/InvoicePayment"));
const InvoiceReceipt = lazy(() => import("@/pages/InvoiceReceipt"));
const ExternalInvoicePage = lazy(() => import("@/pages/ExternalInvoicePage"));
const ExternalInvoiceReceipt = lazy(() => import("@/pages/ExternalInvoiceReceipt"));
const DriverRegister = lazy(() => import("@/pages/DriverRegister"));
const AcceptInvitation = lazy(() => import("@/pages/AcceptInvitation"));
const VerifyContractPage = lazy(() => import("@/pages/public/VerifyContractPage"));
const NavigatePage = lazy(() => import("@/pages/public/NavigatePage"));
const FeaturesPage = lazy(() => import("@/pages/public/FeaturesPage"));
const FeirantesPage = lazy(() => import("@/pages/public/FeirantesPage"));
const LojistasLocaisPage = lazy(() => import("@/pages/public/LojistasLocaisPage"));
const FarmaciasPage = lazy(() => import("@/pages/public/FarmaciasPage"));
const SuplementosPage = lazy(() => import("@/pages/public/SuplementosPage"));
const SuplementosLandingPage = lazy(() => import("@/pages/public/SuplementosLandingPage"));
const BioMundoPropostaPage = lazy(() => import("@/pages/public/BioMundoPropostaPage"));
const SupermercadosPage = lazy(() => import("@/pages/public/SupermercadosPage"));
const AcouguesPage = lazy(() => import("@/pages/public/AcouguesPage"));
const SalespersonSalesGuidePage = lazy(() => import("@/pages/public/SalespersonSalesGuidePage"));
const TotemPage = lazy(() => import("@/pages/totem/TotemPage"));
const ConversaoLandingPage = lazy(() => import("@/pages/public/ConversaoLandingPage"));
const NichoSuplementosPage = lazy(() => import("@/pages/public/NichoSuplementosPage"));
const NichoPizzariasPage = lazy(() => import("@/pages/public/NichoPizzariasPage"));
const NichoHamburgueriasPage = lazy(() => import("@/pages/public/NichoHamburgueriasPage"));
const NichoAcaiteriasPage = lazy(() => import("@/pages/public/NichoAcaiteriasPage"));
const NichoFoodTruckPage = lazy(() => import("@/pages/public/NichoFoodTruckPage"));
const NichoFarmaciasPage = lazy(() => import("@/pages/public/NichoFarmaciasPage"));
const NichoChurrasquinhosPage = lazy(() => import("@/pages/public/NichoChurrasquinhosPage"));

export const publicRoutes = (
  <>
    {/* Critical routes - No lazy loading */}
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/loja/:slug" element={<Store />} />
    
    {/* Landing e Páginas Institucionais */}
    <Route path="/funcionalidades" element={<LazyRoute><FeaturesPage /></LazyRoute>} />
    <Route path="/para-feirantes" element={<LazyRoute><FeirantesPage /></LazyRoute>} />
    <Route path="/para-lojistas" element={<LazyRoute><LojistasLocaisPage /></LazyRoute>} />
    <Route path="/para-farmacias" element={<LazyRoute><FarmaciasPage /></LazyRoute>} />
    <Route path="/para-suplementos" element={<LazyRoute><SuplementosPage /></LazyRoute>} />
    <Route path="/suplementos" element={<LazyRoute><SuplementosLandingPage /></LazyRoute>} />
    <Route path="/proposta-biomundo" element={<LazyRoute><BioMundoPropostaPage /></LazyRoute>} />
    <Route path="/para-supermercados" element={<LazyRoute><SupermercadosPage /></LazyRoute>} />
    <Route path="/para-acougues" element={<LazyRoute><AcouguesPage /></LazyRoute>} />
    <Route path="/guia-vendedor" element={<LazyRoute><SalespersonSalesGuidePage /></LazyRoute>} />
  <Route path="/conversao" element={<LazyRoute><ConversaoLandingPage /></LazyRoute>} />
  <Route path="/nicho-suplementos" element={<LazyRoute><NichoSuplementosPage /></LazyRoute>} />
    <Route path="/nicho-pizzarias" element={<LazyRoute><NichoPizzariasPage /></LazyRoute>} />
    <Route path="/nicho-hamburguerias" element={<LazyRoute><NichoHamburgueriasPage /></LazyRoute>} />
    <Route path="/nicho-acaiterias" element={<LazyRoute><NichoAcaiteriasPage /></LazyRoute>} />
    <Route path="/nicho-foodtruck" element={<LazyRoute><NichoFoodTruckPage /></LazyRoute>} />
      <Route path="/nicho-farmacias" element={<LazyRoute><NichoFarmaciasPage /></LazyRoute>} />
      <Route path="/nicho-churrasquinhos" element={<LazyRoute><NichoChurrasquinhosPage /></LazyRoute>} />
    <Route path="/sitemap.xml" element={<LazyRoute><Sitemap /></LazyRoute>} />
    <Route path="/navegar" element={<LazyRoute><NavigatePage /></LazyRoute>} />
    
    {/* Faturas e Pagamentos Públicos */}
    <Route path="/invoice-payment/:invoiceId" element={<LazyRoute><InvoicePayment /></LazyRoute>} />
    <Route path="/receipt/:invoiceId" element={<LazyRoute><InvoiceReceipt /></LazyRoute>} />
    <Route path="/external-invoice/:invoiceId" element={<LazyRoute><ExternalInvoicePage /></LazyRoute>} />
    <Route path="/external-receipt/:invoiceId" element={<LazyRoute><ExternalInvoiceReceipt /></LazyRoute>} />
    
    {/* Autenticação */}
    <Route path="/signup" element={<LazyRoute><SignUp /></LazyRoute>} />
    <Route path="/auth/reset-password" element={<LazyRoute><ResetPassword /></LazyRoute>} />
    
    {/* Loja Pública */}
    <Route path="/loja/:slug/promocoes" element={<LazyRoute><StorePromotions /></LazyRoute>} />
    <Route path="/loja/:slug/info.xml" element={<LazyRoute><StoreXML /></LazyRoute>} />
    <Route path="/loja/:slug/feed.xml" element={<LazyRoute><GoogleShoppingFeed /></LazyRoute>} />
    <Route path="/loja/:slug/feed.csv" element={<LazyRoute><MetaCommerceFeed /></LazyRoute>} />
    <Route path="/loja/:storeSlug/produto/:productSlug" element={<LazyRoute><ProductPage /></LazyRoute>} />
    
    {/* Cardápio na Mesa (Self-Service) */}
    <Route path="/mesa/:storeSlug/:tableNumber" element={<LazyRoute><TableAccessPage /></LazyRoute>} />
    <Route path="/mesa/:storeSlug/:tableNumber/cardapio" element={<LazyRoute><TableMenuPage /></LazyRoute>} />
    
    {/* Totem de Autoatendimento */}
    <Route path="/totem/:storeSlug" element={<LazyRoute><TotemPage /></LazyRoute>} />
    
    {/* Cliente - Autenticação e Painel */}
    <Route path="/cliente/:storeSlug" element={<LazyRoute><CustomerAuth /></LazyRoute>} />
    <Route path="/painel-cliente/:storeSlug" element={<LazyRoute><CustomerPanel /></LazyRoute>} />
    <Route path="/painel-cliente/:storeSlug/:tab" element={<LazyRoute><CustomerPanel /></LazyRoute>} />
    <Route path="/checkout" element={<LazyRoute><Checkout /></LazyRoute>} />
    <Route path="/pedido/:orderId" element={<LazyRoute><OrderTracking /></LazyRoute>} />
    
    {/* Cadastros Públicos */}
    <Route path="/seja-vendedor" element={<LazyRoute><SejaVendedor /></LazyRoute>} />
    <Route path="/cadastro-vendedor" element={<LazyRoute><CadastroVendedor /></LazyRoute>} />
    <Route path="/cadastro-vendedor/sucesso" element={<LazyRoute><CadastroVendedorSucesso /></LazyRoute>} />
    <Route path="/cadastro-entregador" element={<LazyRoute><DriverRegister /></LazyRoute>} />
    <Route path="/aceitar-convite/:token" element={<LazyRoute><AcceptInvitation /></LazyRoute>} />
    
    {/* Verificação e Termos */}
    <Route path="/verificar-contrato" element={<LazyRoute><VerifyContractPage /></LazyRoute>} />
    <Route path="/termos" element={<LazyRoute><TermsOfUse /></LazyRoute>} />
    <Route path="/privacidade" element={<LazyRoute><Privacy /></LazyRoute>} />
    <Route path="/suporte" element={<LazyRoute><Support /></LazyRoute>} />
    
    {/* Novidades - Redirecionamento */}
    <Route path="/novidades" element={<UpdatesRedirect />} />
    
    {/* Demo e Utilitários */}
    <Route path="/users-demo" element={<LazyRoute><UsersDemo /></LazyRoute>} />
    
    {/* Páginas de Erro */}
    <Route path="/500" element={<LazyRoute><ServerError /></LazyRoute>} />
    <Route path="/503" element={<LazyRoute><Maintenance /></LazyRoute>} />
    <Route path="/offline" element={<LazyRoute><Offline /></LazyRoute>} />
    <Route path="/loja-indisponivel" element={<LazyRoute><StoreUnavailable /></LazyRoute>} />
    
    {/* Catch-all - No lazy loading */}
    <Route path="*" element={<NotFound />} />
  </>
);
