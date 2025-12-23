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
import { useLocation } from "react-router-dom";

// Rotas modulares
import {
  publicRoutes,
  masterRoutes,
  storeAdminRoutes,
  deliveryRoutes,
  salespersonRoutes,
  customerRoutes
} from "@/routes";

// Página de sinalização (100% pública)
import SignageDisplayPage from "@/pages/public/SignageDisplayPage";

const queryClient = new QueryClient();

// Componente interno para controlar o tema baseado na rota
function ThemeController() {
  useRouteTheme();
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
