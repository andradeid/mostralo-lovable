import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
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

interface CustomMenu {
  id: string;
  title: string;
  iframe_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export default function IntegrationsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [menus, setMenus] = useState<CustomMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<CustomMenu | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    iframe_url: "",
    sort_order: 0,
  });

  useEffect(() => {
    loadStoreAndMenus();
  }, [profile]);

  const loadStoreAndMenus = async () => {
    if (!profile?.id) return;

    try {
      // Get store_id from stores table
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", profile.id)
        .single();

      if (storeError) throw storeError;
      if (!storeData) {
        toast({
          title: "Erro",
          description: "Loja não encontrada",
          variant: "destructive",
        });
        return;
      }

      setStoreId(storeData.id);

      // Load custom menus
      const { data: menusData, error: menusError } = await supabase
        .from("custom_menus")
        .select("*")
        .eq("store_id", storeData.id)
        .order("sort_order", { ascending: true });

      if (menusError) throw menusError;
      setMenus(menusData || []);
    } catch (error: any) {
      console.error("Erro ao carregar menus:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!storeId) return;

    try {
      if (selectedMenu) {
        // Update
        const { error } = await supabase
          .from("custom_menus")
          .update({
            title: formData.title,
            iframe_url: formData.iframe_url,
            sort_order: formData.sort_order,
          })
          .eq("id", selectedMenu.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Menu atualizado com sucesso",
        });
      } else {
        // Insert
        const { error } = await supabase.from("custom_menus").insert({
          store_id: storeId,
          title: formData.title,
          iframe_url: formData.iframe_url,
          sort_order: formData.sort_order,
        });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Menu criado com sucesso",
        });
      }

      setDialogOpen(false);
      setSelectedMenu(null);
      setFormData({ title: "", iframe_url: "", sort_order: 0 });
      loadStoreAndMenus();
    } catch (error: any) {
      console.error("Erro ao salvar menu:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedMenu) return;

    try {
      const { error } = await supabase
        .from("custom_menus")
        .delete()
        .eq("id", selectedMenu.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Menu excluído com sucesso",
      });

      setDeleteDialogOpen(false);
      setSelectedMenu(null);
      loadStoreAndMenus();
    } catch (error: any) {
      console.error("Erro ao excluir menu:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (menu: CustomMenu) => {
    try {
      const { error } = await supabase
        .from("custom_menus")
        .update({ is_active: !menu.is_active })
        .eq("id", menu.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: menu.is_active ? "Menu desativado" : "Menu ativado",
      });

      loadStoreAndMenus();
    } catch (error: any) {
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (menu: CustomMenu) => {
    setSelectedMenu(menu);
    setFormData({
      title: menu.title,
      iframe_url: menu.iframe_url,
      sort_order: menu.sort_order,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedMenu(null);
    setFormData({
      title: "",
      iframe_url: "",
      sort_order: menus.length,
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Menus Personalizados</h1>
          <p className="text-muted-foreground mt-2">
            Adicione iframes de sites externos ao seu painel
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Menu
        </Button>
      </div>

      {menus.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <ExternalLink className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum menu personalizado</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro menu para integrar ferramentas externas
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Menu
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="text-center">Ordem</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menus.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell className="font-medium">{menu.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{menu.iframe_url}</TableCell>
                  <TableCell className="text-center">{menu.sort_order}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={menu.is_active}
                      onCheckedChange={() => handleToggleActive(menu)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(menu)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedMenu(menu);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMenu ? "Editar Menu" : "Novo Menu"}
            </DialogTitle>
            <DialogDescription>
              Configure o menu personalizado que será exibido no sidebar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Menu</Label>
              <Input
                id="title"
                placeholder="Ex: Calculadora de Frete"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iframe_url">URL do Iframe</Label>
              <Input
                id="iframe_url"
                placeholder="https://exemplo.com"
                value={formData.iframe_url}
                onChange={(e) =>
                  setFormData({ ...formData, iframe_url: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Ordem de Exibição</Label>
              <Input
                id="sort_order"
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o menu "{selectedMenu?.title}"?
              Esta ação não pode ser desfeita.
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
