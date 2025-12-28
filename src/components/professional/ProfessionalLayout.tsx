import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ProfessionalSidebar } from "./ProfessionalSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfileHeader } from "@/components/admin/UserProfileHeader";
import { Loader2 } from "lucide-react";

interface ProfessionalLayoutProps {
  children: ReactNode;
}

interface ProfessionalData {
  id: string;
  name: string;
  photo_url: string | null;
  is_active: boolean;
  store_id: string;
  stores?: {
    name: string;
  };
}

export function ProfessionalLayout({ children }: ProfessionalLayoutProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [professionalData, setProfessionalData] = useState<ProfessionalData | null>(null);

  useEffect(() => {
    const checkProfessionalStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("professionals")
          .select(`
            id,
            name,
            photo_url,
            is_active,
            store_id,
            stores:store_id (name)
          `)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Erro ao buscar dados do profissional:", error);
          toast.error("Erro ao carregar dados do profissional");
          navigate("/auth");
          return;
        }

        if (!data) {
          toast.error("Você não está vinculado como profissional");
          navigate("/auth");
          return;
        }

        if (!data.is_active) {
          toast.error("Sua conta de profissional está desativada");
          navigate("/auth");
          return;
        }

        setProfessionalData(data);
      } catch (error) {
        console.error("Erro ao verificar status:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkProfessionalStatus();
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ProfessionalSidebar 
          onSignOut={handleSignOut}
          professionalName={professionalData?.name}
          professionalPhoto={professionalData?.photo_url || undefined}
          storeName={professionalData?.stores?.name}
        />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background flex items-center px-4 md:px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center justify-between w-full">
              <h1 className="text-lg md:text-xl font-semibold">Portal do Profissional</h1>
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
