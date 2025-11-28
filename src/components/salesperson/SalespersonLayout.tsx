import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SalespersonSidebar } from "./SalespersonSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <div className="mb-4">
              <SidebarTrigger />
            </div>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
