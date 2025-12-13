import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SalespersonSidebar } from "./SalespersonSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfileHeader } from "@/components/admin/UserProfileHeader";
import { SalespersonBlockedPage } from "@/pages/salesperson/SalespersonBlockedPage";

interface SalespersonLayoutProps {
  children: ReactNode;
}

interface SalespersonData {
  is_blocked: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
}

export function SalespersonLayout({ children }: SalespersonLayoutProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salespersonData, setSalespersonData] = useState<SalespersonData | null>(null);

  useEffect(() => {
    const checkSalespersonStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("salespeople")
          .select("is_blocked, blocked_reason, blocked_at")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Erro ao buscar dados do vendedor:", error);
        } else {
          setSalespersonData(data);
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSalespersonStatus();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/auth");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  // Se o vendedor estiver bloqueado, mostrar tela de bloqueio
  if (salespersonData?.is_blocked) {
    return (
      <SalespersonBlockedPage
        blockedReason={salespersonData.blocked_reason}
        blockedAt={salespersonData.blocked_at}
      />
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SalespersonSidebar onSignOut={handleSignOut} />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background flex items-center px-4 md:px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center justify-between w-full">
              <h1 className="text-lg md:text-xl font-semibold">Painel do Vendedor</h1>
              <UserProfileHeader />
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-6 bg-muted/30 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
