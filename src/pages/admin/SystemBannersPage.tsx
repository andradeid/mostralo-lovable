import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Megaphone, Calendar, Code } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SystemBanner {
  id: string;
  title: string;
  html_content: string;
  is_active: boolean;
  position: string;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

const POSITION_OPTIONS = [
  { value: 'orders_page', label: 'Página de Pedidos' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'all_pages', label: 'Todas as Páginas' },
];

const SystemBannersPage = () => {
  const [banners, setBanners] = useState<SystemBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<SystemBanner | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  
  // Form state
  const [title, setTitle] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [position, setPosition] = useState("orders_page");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_banners')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast.error("Erro ao carregar banners");
      console.error(error);
    } else {
      setBanners((data || []) as SystemBanner[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const resetForm = () => {
    setTitle("");
    setHtmlContent("");
    setIsActive(true);
    setPosition("orders_page");
    setDisplayOrder(0);
    setStartDate("");
    setEndDate("");
    setEditingBanner(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (banner: SystemBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setHtmlContent(banner.html_content);
    setIsActive(banner.is_active);
    setPosition(banner.position);
    setDisplayOrder(banner.display_order);
    setStartDate(banner.start_date ? banner.start_date.split('T')[0] : "");
    setEndDate(banner.end_date ? banner.end_date.split('T')[0] : "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !htmlContent.trim()) {
      toast.error("Preencha o título e o conteúdo HTML");
      return;
    }

    setSaving(true);

    const bannerData = {
      title: title.trim(),
      html_content: htmlContent,
      is_active: isActive,
      position,
      display_order: displayOrder,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
    };

    if (editingBanner) {
      const { error } = await supabase
        .from('system_banners')
        .update(bannerData)
        .eq('id', editingBanner.id);

      if (error) {
        toast.error("Erro ao atualizar banner");
        console.error(error);
      } else {
        toast.success("Banner atualizado com sucesso!");
        setDialogOpen(false);
        fetchBanners();
      }
    } else {
      const { error } = await supabase
        .from('system_banners')
        .insert(bannerData);

      if (error) {
        toast.error("Erro ao criar banner");
        console.error(error);
      } else {
        toast.success("Banner criado com sucesso!");
        setDialogOpen(false);
        fetchBanners();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este banner?")) return;

    const { error } = await supabase
      .from('system_banners')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir banner");
      console.error(error);
    } else {
      toast.success("Banner excluído!");
      fetchBanners();
    }
  };

  const handleToggleActive = async (banner: SystemBanner) => {
    const { error } = await supabase
      .from('system_banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(banner.is_active ? "Banner desativado" : "Banner ativado");
      fetchBanners();
    }
  };

  const handlePreview = (html: string) => {
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  const getPositionLabel = (pos: string) => {
    return POSITION_OPTIONS.find(p => p.value === pos)?.label || pos;
  };

  return (
    <AdminLayout pageTitle="Banners do Sistema">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" />
              Banners do Sistema
            </h1>
            <p className="text-muted-foreground">
              Crie banners HTML que serão exibidos em todas as lojas
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Banner
          </Button>
        </div>

        {/* Lista de Banners */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando...
          </div>
        ) : banners.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhum banner criado ainda</p>
              <Button className="mt-4" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {banners.map(banner => (
              <Card key={banner.id} className={!banner.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {banner.title}
                        {banner.is_active ? (
                          <Badge variant="default" className="bg-green-500">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          {getPositionLabel(banner.position)}
                        </span>
                        {(banner.start_date || banner.end_date) && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {banner.start_date && format(new Date(banner.start_date), "dd/MM/yyyy", { locale: ptBR })}
                            {banner.start_date && banner.end_date && " - "}
                            {banner.end_date && format(new Date(banner.end_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                        <span>Ordem: {banner.display_order}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(banner.html_content)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(banner)}
                        title={banner.is_active ? "Desativar" : "Ativar"}
                      >
                        {banner.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(banner)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(banner.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono max-h-24 overflow-auto">
                    {banner.html_content.substring(0, 300)}
                    {banner.html_content.length > 300 && "..."}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Criar/Editar */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "Editar Banner" : "Novo Banner"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título (interno)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Promoção de Natal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="html_content">Conteúdo HTML</Label>
                <Textarea
                  id="html_content"
                  value={htmlContent}
                  onChange={e => setHtmlContent(e.target.value)}
                  placeholder='<div style="background: linear-gradient(90deg, #f97316, #ea580c); padding: 16px; border-radius: 8px; color: white; text-align: center;"><strong>🎉 Novidade!</strong> Confira as novas funcionalidades...</div>'
                  className="font-mono text-sm min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  Use HTML/CSS inline para estilizar o banner. Scripts serão removidos por segurança.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Posição</Label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={displayOrder}
                    onChange={e => setDisplayOrder(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data Início (opcional)</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Data Fim (opcional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="is_active">Banner ativo</Label>
              </div>

              {/* Preview inline */}
              {htmlContent && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div 
                    className="border rounded-lg overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : editingBanner ? "Salvar" : "Criar Banner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Preview */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Preview do Banner</DialogTitle>
            </DialogHeader>
            <div 
              className="border rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default SystemBannersPage;
