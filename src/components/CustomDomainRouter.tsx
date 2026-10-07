import { ReactNode, lazy } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useCustomDomain, type CustomDomainHome } from '@/hooks/useCustomDomain';
import { StoreSlugContext } from '@/contexts/StoreSlugContext';
import { LazyRoute } from '@/components/LazyRoute';
import Store from '@/pages/Store';
import StoreUnavailable from '@/pages/StoreUnavailable';

const StorePromotions = lazy(() => import('@/pages/StorePromotions'));
const CustomerOrdersPage = lazy(() => import('@/pages/CustomerOrdersPage'));
const ProductPage = lazy(() => import('@/pages/ProductPage'));
const StoreXML = lazy(() => import('@/pages/StoreXML'));
const GoogleShoppingFeed = lazy(() => import('@/pages/GoogleShoppingFeed'));
const MetaCommerceFeed = lazy(() => import('@/pages/MetaCommerceFeed'));
const BookingPage = lazy(() => import('@/pages/public/BookingPage'));

interface CustomDomainRouterProps {
  children: ReactNode;
}

// Rotas que devem renderizar diretamente sem verificação de domínio
const BYPASS_ROUTES = ['/painel/', '/sitemap.xml', '/robots.txt'];

/** Redireciona /loja/:slug/... para o mesmo caminho sem prefixo no domínio próprio */
function StripStorePrefix() {
  const params = useParams();
  const location = useLocation();
  const rest = params['*'] ? `/${params['*']}` : '/';
  return <Navigate to={`${rest}${location.search}${location.hash}`} replace />;
}

/** /agendar/:qualquer no domínio próprio → /agendar mantendo a query */
function ToBookingRoot() {
  const location = useLocation();
  return <Navigate to={`/agendar${location.search}${location.hash}`} replace />;
}

/** Rotas da vitrine no domínio personalizado (sem o prefixo /loja/:slug) */
function CustomDomainStoreRoutes({ slug, home, children }: { slug: string; home: CustomDomainHome; children: ReactNode }) {
  const booking = <LazyRoute><BookingPage /></LazyRoute>;
  return (
    <StoreSlugContext.Provider value={slug}>
      <Routes>
        <Route path="/" element={home === 'booking' ? booking : <Store />} />
        <Route path="/agendar" element={booking} />
        <Route path="/agendar/*" element={<ToBookingRoot />} />
        {home === 'booking' && <Route path="/loja" element={<Store />} />}
        <Route path="/produto/:productSlug" element={<LazyRoute><ProductPage /></LazyRoute>} />
        <Route path="/promocoes" element={<LazyRoute><StorePromotions /></LazyRoute>} />
        <Route path="/meus-pedidos" element={<LazyRoute><CustomerOrdersPage /></LazyRoute>} />
        <Route path="/info.xml" element={<LazyRoute><StoreXML /></LazyRoute>} />
        <Route path="/feed.xml" element={<LazyRoute><GoogleShoppingFeed /></LazyRoute>} />
        <Route path="/feed.csv" element={<LazyRoute><MetaCommerceFeed /></LazyRoute>} />
        <Route path="/loja/:anySlug/*" element={<StripStorePrefix />} />
        <Route path="/loja/:anySlug" element={<Navigate to="/" replace />} />
        {/* Demais rotas (checkout, login etc.) seguem as rotas normais */}
        <Route path="*" element={<>{children}</>} />
      </Routes>
    </StoreSlugContext.Provider>
  );
}

const CustomDomainRouterInner = ({ children }: CustomDomainRouterProps) => {
  const { storeSlug, home, isCustomDomain, isLoading } = useCustomDomain();

  if (isLoading) return null;
  if (!isCustomDomain) return <>{children}</>;
  if (!storeSlug) return <StoreUnavailable />;
  return <CustomDomainStoreRoutes slug={storeSlug} home={home}>{children}</CustomDomainStoreRoutes>;
};

export function CustomDomainRouter({ children }: CustomDomainRouterProps) {
  const location = useLocation();
  const shouldBypass = BYPASS_ROUTES.some(route => location.pathname.startsWith(route));
  if (shouldBypass) return <>{children}</>;
  return <CustomDomainRouterInner>{children}</CustomDomainRouterInner>;
}
