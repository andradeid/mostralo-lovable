import { Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import SignUp from "@/pages/SignUp";
import Store from "@/pages/Store";
import StorePromotions from "@/pages/StorePromotions";
import ProductPage from "@/pages/ProductPage";
import StoreXML from "@/pages/StoreXML";
import GoogleShoppingFeed from "@/pages/GoogleShoppingFeed";
import MetaCommerceFeed from "@/pages/MetaCommerceFeed";
import CustomerAuth from "@/pages/CustomerAuth";
import CustomerPanel from "@/pages/CustomerPanel";
import OrderTracking from "@/pages/OrderTracking";
import TermsOfUse from "@/pages/TermsOfUse";
import Privacy from "@/pages/Privacy";
import Checkout from "@/pages/Checkout";
import Support from "@/pages/Support";
import UsersDemo from "@/pages/UsersDemo";
import SejaVendedor from "@/pages/SejaVendedor";
import CadastroVendedor from "@/pages/CadastroVendedor";
import CadastroVendedorSucesso from "@/pages/CadastroVendedorSucesso";
import NotFound from "@/pages/NotFound";
import ServerError from "@/pages/ServerError";
import Maintenance from "@/pages/Maintenance";
import Offline from "@/pages/Offline";
import StoreUnavailable from "@/pages/StoreUnavailable";
import Sitemap from "@/pages/Sitemap";
import InvoicePayment from "@/pages/InvoicePayment";
import InvoiceReceipt from "@/pages/InvoiceReceipt";
import ExternalInvoicePage from "@/pages/ExternalInvoicePage";
import ExternalInvoiceReceipt from "@/pages/ExternalInvoiceReceipt";
import DriverRegister from "@/pages/DriverRegister";
import AcceptInvitation from "@/pages/AcceptInvitation";
import VerifyContractPage from "@/pages/public/VerifyContractPage";
import NavigatePage from "@/pages/public/NavigatePage";
import FeaturesPage from "@/pages/public/FeaturesPage";
import FeirantesPage from "@/pages/public/FeirantesPage";
import LojistasLocaisPage from "@/pages/public/LojistasLocaisPage";
import FarmaciasPage from "@/pages/public/FarmaciasPage";
import SuplementosPage from "@/pages/public/SuplementosPage";
import SuplementosLandingPage from "@/pages/public/SuplementosLandingPage";
import BioMundoPropostaPage from "@/pages/public/BioMundoPropostaPage";
import SupermercadosPage from "@/pages/public/SupermercadosPage";
import AcouguesPage from "@/pages/public/AcouguesPage";
import SalespersonSalesGuidePage from "@/pages/public/SalespersonSalesGuidePage";
import { UpdatesRedirect } from "@/components/system-updates/UpdatesRedirect";

export const publicRoutes = (
  <>
    {/* Landing e Páginas Institucionais */}
    <Route path="/" element={<Index />} />
    <Route path="/funcionalidades" element={<FeaturesPage />} />
    <Route path="/para-feirantes" element={<FeirantesPage />} />
    <Route path="/para-lojistas" element={<LojistasLocaisPage />} />
    <Route path="/para-farmacias" element={<FarmaciasPage />} />
    <Route path="/para-suplementos" element={<SuplementosPage />} />
    <Route path="/suplementos" element={<SuplementosLandingPage />} />
    <Route path="/proposta-biomundo" element={<BioMundoPropostaPage />} />
    <Route path="/para-supermercados" element={<SupermercadosPage />} />
    <Route path="/para-acougues" element={<AcouguesPage />} />
    <Route path="/guia-vendedor" element={<SalespersonSalesGuidePage />} />
    <Route path="/sitemap.xml" element={<Sitemap />} />
    <Route path="/navegar" element={<NavigatePage />} />
    
    {/* Faturas e Pagamentos Públicos */}
    <Route path="/invoice-payment/:invoiceId" element={<InvoicePayment />} />
    <Route path="/receipt/:invoiceId" element={<InvoiceReceipt />} />
    <Route path="/external-invoice/:invoiceId" element={<ExternalInvoicePage />} />
    <Route path="/external-receipt/:invoiceId" element={<ExternalInvoiceReceipt />} />
    
    {/* Autenticação */}
    <Route path="/auth" element={<Auth />} />
    <Route path="/signup" element={<SignUp />} />
    
    {/* Loja Pública */}
    <Route path="/loja/:slug" element={<Store />} />
    <Route path="/loja/:slug/promocoes" element={<StorePromotions />} />
    <Route path="/loja/:slug/info.xml" element={<StoreXML />} />
    <Route path="/loja/:slug/feed.xml" element={<GoogleShoppingFeed />} />
    <Route path="/loja/:slug/feed.csv" element={<MetaCommerceFeed />} />
    <Route path="/loja/:storeSlug/produto/:productSlug" element={<ProductPage />} />
    
    {/* Cliente - Autenticação e Painel */}
    <Route path="/cliente/:storeSlug" element={<CustomerAuth />} />
    <Route path="/painel-cliente/:storeSlug" element={<CustomerPanel />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/pedido/:orderId" element={<OrderTracking />} />
    
    {/* Cadastros Públicos */}
    <Route path="/seja-vendedor" element={<SejaVendedor />} />
    <Route path="/cadastro-vendedor" element={<CadastroVendedor />} />
    <Route path="/cadastro-vendedor/sucesso" element={<CadastroVendedorSucesso />} />
    <Route path="/cadastro-entregador" element={<DriverRegister />} />
    <Route path="/aceitar-convite/:token" element={<AcceptInvitation />} />
    
    {/* Verificação e Termos */}
    <Route path="/verificar-contrato" element={<VerifyContractPage />} />
    <Route path="/termos" element={<TermsOfUse />} />
    <Route path="/privacidade" element={<Privacy />} />
    <Route path="/suporte" element={<Support />} />
    
    {/* Novidades - Redirecionamento */}
    <Route path="/novidades" element={<UpdatesRedirect />} />
    
    {/* Demo e Utilitários */}
    <Route path="/users-demo" element={<UsersDemo />} />
    
    {/* Páginas de Erro */}
    <Route path="/500" element={<ServerError />} />
    <Route path="/503" element={<Maintenance />} />
    <Route path="/offline" element={<Offline />} />
    <Route path="/loja-indisponivel" element={<StoreUnavailable />} />
    
    {/* Catch-all */}
    <Route path="*" element={<NotFound />} />
  </>
);
