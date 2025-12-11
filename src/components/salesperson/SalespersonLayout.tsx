import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SalespersonSidebar } from "./SalespersonSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfileHeader } from "@/components/admin/UserProfileHeader";

interface SalespersonLayoutProps {
  children: ReactNode;
}

export function SalespersonLayout({ children }: SalespersonLayoutProps) {
  const navigate = useNavigate();

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
