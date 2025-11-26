import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff, Search, Image as ImageIcon } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  store_id: string;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  is_active: boolean;
  display_order: number;
  stores: {
    name: string;
  };
}

interface Store {
  id: string;
  name: string;
}

export default function BannersPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
    loadBanners();
  }, [selectedStore]);

  const loadStores = async () => {
    try {
      let query = supabase.from("stores").select("id, name");
      
      if (profile?.user_type === "store_admin") {
        query = query.eq("owner_id", profile.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar lojas",
        description: error.message,
      });
    }
  };

  const loadBanners = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("banners")
        .select(`
          *,
          stores!inner (name, owner_id)
        `)
        .order("display_order", { ascending: true });
      
      if (profile?.user_type === "store_admin") {
        query = query.eq("stores.owner_id", profile.id);
      }
      
      if (selectedStore !== "all") {
        query = query.eq("store_id", selectedStore);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar banners",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("banners")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: `Banner ${!currentStatus ? "ativado" : "desativado"} com sucesso!`,
      });
      
      loadBanners();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar banner",
        description: error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", deleteId);
      
      if (error) throw error;
      
      toast({
        title: "Banner excluído com sucesso!",
      });
      
      loadBanners();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir banner",
        description: error.message,
      });
    } finally {
      setDeleteId(null);
    }
  };

  const filteredBanners = banners.filter(banner =>
    banner.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeBanners = filteredBanners.filter(b => b.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Banners</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os banners da sua loja
          </p>
        </div>
        <Button onClick={() => navigate("/dashboard/banners/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Banner
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Banners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBanners.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Banners Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeBanners}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Banners Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {filteredBanners.length - activeBanners}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {profile?.user_type === "master_admin" && (
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por loja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as lojas</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Banners List */}
      {filteredBanners.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum banner encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro banner para a loja
            </p>
            <Button onClick={() => navigate("/dashboard/banners/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Banner
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBanners.map((banner) => (
            <Card key={banner.id}>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Banner Preview */}
                  {banner.desktop_image_url && (
                    <div className="relative aspect-[4/1] overflow-hidden rounded-lg bg-muted">
                      <img
                        src={banner.desktop_image_url}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Banner Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{banner.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(banner.stores) ? banner.stores[0]?.name : banner.stores.name}
                        </p>
                      </div>
                      <Badge variant={banner.is_active ? "default" : "secondary"}>
                        {banner.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/banners/edit/${banner.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(banner.id, banner.is_active)}
                      >
                        {banner.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(banner.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
