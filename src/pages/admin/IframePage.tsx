import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { Database } from "@/integrations/supabase/types";

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
    if (!id || !profile?.id) {
      setLoading(false);
      setError(true);
      return;
    }

    try {
      // Get store_id first
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", profile.id)
        .single();

      if (storeError) {
        console.error("Erro ao buscar loja:", storeError);
        setError(true);
        setLoading(false);
        return;
      }
      
      if (!storeData) {
        console.error("Loja não encontrada");
        setError(true);
        setLoading(false);
        return;
      }

      // Get menu
      const { data: menuData, error: menuError } = await supabase
        .from("custom_menus" as any)
        .select("*")
        .eq("id", id)
        .eq("store_id", storeData.id)
        .eq("is_active", true)
        .single();

      if (menuError) {
        console.error("Erro ao buscar menu:", menuError);
        setError(true);
        toast({
          title: "Erro",
          description: "Erro ao carregar menu personalizado",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      if (!menuData) {
        console.error("Menu não encontrado ou inativo");
        setError(true);
        toast({
          title: "Erro",
          description: "Menu não encontrado ou inativo",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setMenu(menuData as unknown as CustomMenu);
    } catch (error: any) {
      console.error("Erro crítico ao carregar menu:", error);
      setError(true);
      toast({
        title: "Erro",
        description: error?.message || "Erro desconhecido ao carregar menu",
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
    <div className="fixed inset-0 flex flex-col">
      {/* Header compacto com botão para nova aba */}
      <div className="h-12 bg-card border-b px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <h1 className="font-semibold text-base truncate">{menu.title}</h1>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => window.open(menu.iframe_url, '_blank')}
          className="shrink-0"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir em nova aba
        </Button>
      </div>
      
      {/* Iframe em tela cheia */}
      <iframe
        src={menu.iframe_url}
        className="w-full flex-1 border-0"
        title={menu.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
