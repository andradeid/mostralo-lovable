import { useState, useEffect, useRef } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { UserProfileHeader } from "./UserProfileHeader";
import { DashboardFooter } from "./DashboardFooter";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { GlobalNewOrderAlert } from "./GlobalNewOrderAlert";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useImpersonation } from "@/hooks/useImpersonation";
import { NewOrdersProvider } from "@/contexts/NewOrdersContext";
import { useIsMobile } from "@/hooks/use-mobile";

// Componente auxiliar para colapsar sidebar automaticamente no WhatsApp chat
function SidebarAutoCollapse({ isWhatsAppChat }: { isWhatsAppChat: boolean }) {
  const { setOpen } = useSidebar();
  const hasCollapsed = useRef(false);
  useEffect(() => {
    if (isWhatsAppChat && !hasCollapsed.current) {
      setOpen(false);
      hasCollapsed.current = true;
    }
  }, [isWhatsAppChat, setOpen]);
  return null;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function AdminLayout({ children, pageTitle }: AdminLayoutProps) {
  const { user, profile, loading, userRole } = useAuth();
  const { isImpersonating } = useImpersonation();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Ocultar footer no mobile quando estiver na tela de chat
  const isWhatsAppChat = location.pathname.includes('/whatsapp/chat');
  const hideFooter = isWhatsAppChat;
  
  // Estado para modo tela cheia do Kanban
  const [isKanbanFullscreen, setIsKanbanFullscreen] = useState(false);

  // Listener para evento de fullscreen do Kanban
  useEffect(() => {
    const handleFullscreenChange = (e: CustomEvent<{ isFullscreen: boolean }>) => {
      setIsKanbanFullscreen(e.detail.isFullscreen);
    };
    
    window.addEventListener('kanbanFullscreenChange', handleFullscreenChange as EventListener);
    return () => {
      window.removeEventListener('kanbanFullscreenChange', handleFullscreenChange as EventListener);
    };
  }, []);

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

  // Redirecionar profissionais para sua área específica
  if (userRole === 'professional') {
    return <Navigate to="/profissional" replace />;
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

  // Redirecionar atendentes de /dashboard para /dashboard/atendente
  if (userRole === 'attendant' && location.pathname === '/dashboard') {
    return <Navigate to="/dashboard/atendente" replace />;
  }

  // Redirecionar store_admin não aprovado ou sem assinatura ativa para /dashboard/subscription
  if (
    profile?.user_type === 'store_admin' && 
    location.pathname !== '/dashboard/subscription' &&
    (profile?.approval_status === 'pending' || profile?.approval_status === 'rejected')
  ) {
    return <Navigate to="/dashboard/subscription" replace />;
  }

  // No WhatsApp chat: ocultar header/footer e remover padding em todos os dispositivos
  const hideHeader = isWhatsAppChat;
  const hideFooterFinal = isWhatsAppChat || hideFooter;
  const chatMainClass = isWhatsAppChat ? 'flex-1 min-w-0 overflow-hidden' : 'flex-1 min-w-0 p-6 bg-muted/30';

  return (
    <NewOrdersProvider>
      <SidebarProvider defaultOpen={!isWhatsAppChat}>
        <SidebarAutoCollapse isWhatsAppChat={isWhatsAppChat} />
        <div className="min-h-screen flex w-full">
          {isImpersonating && <ImpersonationBanner />}
          <AdminSidebar />
          
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Header - oculto em modo tela cheia e no WhatsApp chat desktop */}
            {!isKanbanFullscreen && !hideHeader && (
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
            )}
            
            <main className={chatMainClass}>
              {children}
            </main>
            
            {!hideFooter && <DashboardFooter />}
          </div>
          
          {/* Pop-up global de novo pedido */}
          <GlobalNewOrderAlert />
        </div>
      </SidebarProvider>
    </NewOrdersProvider>
  );
}