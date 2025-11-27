import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

interface CustomMenu {
  id: string;
  title: string;
  iframe_url: string;
  store_id: string;
}

export default function IframePage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [menu, setMenu] = useState<CustomMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadMenu();
  }, [id, profile]);

  const loadMenu = async () => {
    if (!id || !profile?.id) return;

    try {
      // Get store_id first
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", profile.id)
        .single();

      if (storeError) throw storeError;
      if (!storeData) {
        setError(true);
        return;
      }

      // Get menu
      const { data: menuData, error: menuError } = await supabase
        .from("custom_menus")
        .select("*")
        .eq("id", id)
        .eq("store_id", storeData.id)
        .eq("is_active", true)
        .single();

      if (menuError) throw menuError;
      if (!menuData) {
        setError(true);
        toast({
          title: "Erro",
          description: "Menu não encontrado ou inativo",
          variant: "destructive",
        });
        return;
      }

      setMenu(menuData);
    } catch (error: any) {
      console.error("Erro ao carregar menu:", error);
      setError(true);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !menu) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="bg-card border-b px-6 py-4">
        <h1 className="text-2xl font-bold">{menu.title}</h1>
      </div>
      <div className="flex-1 relative">
        <iframe
          src={menu.iframe_url}
          className="w-full h-full border-0"
          title={menu.title}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          onError={() => {
            toast({
              title: "Erro ao carregar iframe",
              description: "Verifique se a URL está correta e permite incorporação",
              variant: "destructive",
            });
          }}
        />
      </div>
      <div className="bg-muted/30 border-t px-6 py-2 text-xs text-muted-foreground flex items-center gap-2">
        <AlertCircle className="h-3 w-3" />
        Conteúdo externo fornecido por: {new URL(menu.iframe_url).hostname}
      </div>
    </div>
  );
}
