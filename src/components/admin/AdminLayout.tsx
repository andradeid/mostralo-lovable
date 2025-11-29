import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { UserProfileHeader } from "./UserProfileHeader";
import { DashboardFooter } from "./DashboardFooter";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { GlobalNewOrderAlert } from "./GlobalNewOrderAlert";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useImpersonation } from "@/hooks/useImpersonation";
import { useEffect } from "react";
import { initializeChatwoot, removeChatwoot } from "@/lib/chatwootWidget";
import { NewOrdersProvider } from "@/contexts/NewOrdersContext";

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function AdminLayout({ children, pageTitle }: AdminLayoutProps) {
  const { user, profile, loading, userRole } = useAuth();
  const { isImpersonating } = useImpersonation();
  const location = useLocation();

  // Inicializar Chatwoot para suporte
  useEffect(() => {
    if (user && (userRole === 'master_admin' || userRole === 'store_admin' || userRole === 'attendant')) {
      initializeChatwoot();
    }
    
    return () => {
      removeChatwoot();
    };
  }, [user, userRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Bloquear acesso de delivery drivers
  if (userRole === 'delivery_driver') {
    return <Navigate to="/delivery-panel" replace />;
  }

  // Se ainda não temos profile, mas a role indica admin/attendant, permite seguir; caso contrário, aguarda
  if (!profile) {
    if (userRole === 'master_admin' || userRole === 'store_admin' || userRole === 'attendant') {
      // ok, continua
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }
  }

  // Bloquear acesso de usuários sem perfil/role administrativa
  if (
    profile && profile.user_type !== 'master_admin' && profile.user_type !== 'store_admin' &&
    userRole !== 'master_admin' && userRole !== 'store_admin' && userRole !== 'attendant'
  ) {
    return <Navigate to="/" replace />;
  }

  // Redirecionar atendentes de /dashboard para /dashboard/orders
  if (userRole === 'attendant' && location.pathname === '/dashboard') {
    return <Navigate to="/dashboard/orders" replace />;
  }

  // Redirecionar store_admin não aprovado ou sem assinatura ativa para /dashboard/subscription
  if (
    profile?.user_type === 'store_admin' && 
    location.pathname !== '/dashboard/subscription' &&
    (profile?.approval_status === 'pending' || profile?.approval_status === 'rejected')
  ) {
    return <Navigate to="/dashboard/subscription" replace />;
  }

  return (
    <NewOrdersProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          {isImpersonating && <ImpersonationBanner />}
          <AdminSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className={`h-16 border-b bg-background flex items-center px-6 ${isImpersonating ? 'mt-12' : ''}`}>
              <SidebarTrigger className="mr-4" />
              <div className="flex items-center justify-between w-full">
                <h1 className="text-xl font-semibold">
                  {pageTitle || (
                    profile?.user_type === 'master_admin' 
                      ? 'Painel Administrativo' 
                      : userRole === 'attendant'
                      ? 'Painel do Atendente'
                      : 'Painel da Loja'
                  )}
                </h1>
                <UserProfileHeader />
              </div>
            </header>
            
            <main className="flex-1 p-6 bg-muted/30">
              {children}
            </main>
            
            <DashboardFooter />
          </div>
          
          {/* Pop-up global de novo pedido */}
          <GlobalNewOrderAlert />
        </div>
      </SidebarProvider>
    </NewOrdersProvider>
  );
}