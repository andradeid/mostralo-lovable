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
import { TermsGuard } from "@/components/TermsGuard";
import { IdleTimeoutManager } from "@/components/IdleTimeoutManager";
import { useLocation } from "react-router-dom";
import { usePlatformTracking } from "@/hooks/usePlatformTracking";
import { useTrackPageVisit } from "@/hooks/useTrackPageVisit";

// Rotas modulares
import {
  publicRoutes,
  masterRoutes,
  storeAdminRoutes,
  deliveryRoutes,
  salespersonRoutes,
  customerRoutes,
  professionalRoutes
} from "@/routes";

// Página de sinalização (100% pública)
import SignageDisplayPage from "@/pages/public/SignageDisplayPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry automático: 3 tentativas com backoff exponencial
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      // Cache de 2 minutos — reduz queries repetidas e alivia o banco
      staleTime: 1000 * 120,
      // Evita rajada de requests ao alternar abas
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Retry para mutations críticas (1 tentativa extra)
      retry: 1,
      retryDelay: 2000,
    },
  },
});

// Componente interno para controlar o tema baseado na rota
function ThemeController() {
  useRouteTheme();
  usePlatformTracking();
  useTrackPageVisit();
  return null;
}

// Rotas 100% públicas que NÃO passam pelo AuthProvider
function PublicRoutesHandler() {
  const location = useLocation();
  
  // Padrões de rotas completamente públicas (sem auth)
  if (location.pathname.startsWith('/painel/')) {
    return (
      <Routes>
        <Route path="/painel/:slug" element={<SignageDisplayPage />} />
      </Routes>
    );
  }
  
  // Todas as outras rotas passam pelos providers normais
  return <MainAppWithProviders />;
}

// App principal com todos os providers de autenticação
function MainAppWithProviders() {
  return (
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ThemeController />
          <IdleTimeoutManager />
          <TermsGuard>
            <CustomDomainRouter>
              <Routes>
                {/* Rotas Master Admin */}
                {masterRoutes}
                
                {/* Rotas Store Admin */}
                {storeAdminRoutes}
                
                {/* Rotas Entregador */}
                {deliveryRoutes}
                
                {/* Rotas Vendedor */}
                {salespersonRoutes}
                
                {/* Rotas Profissional */}
                {professionalRoutes}
                
                {/* Rotas Cliente */}
                {customerRoutes}
                
                {/* Rotas Públicas (sempre por último - contém catch-all) */}
                {publicRoutes}
              </Routes>
            </CustomDomainRouter>
          </TermsGuard>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  );
}

// Componente App principal
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <PublicRoutesHandler />
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
