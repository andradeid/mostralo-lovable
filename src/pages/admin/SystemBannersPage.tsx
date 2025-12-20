import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Megaphone, Calendar, Code, HelpCircle, ChevronDown, Copy, Check, Smartphone, Monitor } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const HTML_EXAMPLES = [
  {
    name: "Banner Informativo (Azul)",
    html: `<div style="background: #3b82f6; padding: 16px; border-radius: 8px; color: white; text-align: center;">
  <strong>ℹ️ Informação:</strong> Atualizamos nosso sistema. Confira as novidades!
</div>`
  },
  {
    name: "Banner Promocional (Gradiente)",
    html: `<div style="background: linear-gradient(90deg, #f97316, #ea580c); padding: 16px; border-radius: 8px; color: white; text-align: center;">
  <strong>🎉 Promoção!</strong> 20% de desconto em todos os produtos até sexta-feira!
</div>`
  },
  {
    name: "Banner de Alerta (Amarelo)",
    html: `<div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; color: #92400e; text-align: center;">
  <strong>⚠️ Atenção:</strong> Manutenção programada para amanhã das 2h às 4h.
</div>`
  },
  {
    name: "Banner de Sucesso (Verde)",
    html: `<div style="background: #10b981; padding: 16px; border-radius: 8px; color: white; text-align: center;">
  <strong>✅ Novidade!</strong> Nova funcionalidade de relatórios disponível no menu.
</div>`
  },
  {
    name: "Banner com Link/Botão",
    html: `<div style="background: linear-gradient(90deg, #6366f1, #8b5cf6); padding: 16px; border-radius: 8px; color: white; text-align: center;">
  <strong>🚀 Novo recurso!</strong> Agora você pode exportar relatórios em PDF.
  <a href="#" style="color: white; text-decoration: underline; margin-left: 8px;">Saiba mais</a>
</div>`
  },
];

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('desktop');
  
  // Form state
  const [title, setTitle] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [position, setPosition] = useState("orders_page");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCopyExample = async (html: string, index: number) => {
    await navigator.clipboard.writeText(html);
    setCopiedIndex(index);
    toast.success("HTML copiado!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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
    <div className="space-y-6">
        {/* Botão Novo Banner */}
        <div className="flex justify-end">
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Banner
          </Button>
        </div>

        {/* Seção de Ajuda */}
        <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Como criar banners HTML</CardTitle>
                  </div>
                  <ChevronDown className={`h-5 w-5 transition-transform ${helpOpen ? "rotate-180" : ""}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use HTML com CSS inline para criar banners. Copie um dos exemplos abaixo e personalize:
                </p>
                
                <div className="space-y-3">
                  {HTML_EXAMPLES.map((example, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-muted/30">
                        <span className="font-medium text-sm">{example.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyExample(example.html, index)}
                          className="h-8"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="h-4 w-4 mr-1 text-green-500" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copiar
                            </>
                          )}
                        </Button>
                      </div>
                      <div 
                        className="p-3 border-t"
                        dangerouslySetInnerHTML={{ __html: example.html }}
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                  <strong className="text-blue-700 dark:text-blue-400">📏 Dimensões Recomendadas:</strong>
                  <ul className="mt-2 space-y-1 text-blue-600 dark:text-blue-300 list-disc list-inside">
                    <li><strong>Altura máxima:</strong> 80-100px (para não ocupar muito espaço)</li>
                    <li><strong>Padding:</strong> 12px a 16px</li>
                    <li><strong>Largura:</strong> 100% (responsivo)</li>
                    <li>Evite mais de 2 linhas de texto em mobile</li>
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                  <strong className="text-amber-700 dark:text-amber-400">⚠️ Dicas importantes:</strong>
                  <ul className="mt-2 space-y-1 text-amber-600 dark:text-amber-300 list-disc list-inside">
                    <li>Use sempre CSS inline (style="...") em vez de tags &lt;style&gt;</li>
                    <li>Emojis chamam atenção! Use moderadamente</li>
                    <li>Scripts são removidos por segurança</li>
                    <li>Teste o preview antes de salvar</li>
                  </ul>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

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

              {/* Preview em tempo real melhorado */}
              {htmlContent && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Preview em Tempo Real
                    </Label>
                    <div className="flex gap-1 bg-muted rounded-lg p-1">
                      <Button 
                        type="button" 
                        variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewMode('mobile')}
                        className="h-7 px-2"
                      >
                        <Smartphone className="h-4 w-4 mr-1" />
                        Mobile
                      </Button>
                      <Button 
                        type="button" 
                        variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPreviewMode('desktop')}
                        className="h-7 px-2"
                      >
                        <Monitor className="h-4 w-4 mr-1" />
                        Desktop
                      </Button>
                    </div>
                  </div>
                  
                  <div className={`bg-muted/30 rounded-lg p-4 flex justify-center ${previewMode === 'mobile' ? '' : ''}`}>
                    <div className={`${previewMode === 'mobile' ? 'w-[375px]' : 'w-full'}`}>
                      <p className="text-xs text-muted-foreground mb-2 text-center">
                        {previewMode === 'mobile' ? '📱 Visualização Mobile (375px)' : '🖥️ Visualização Desktop'}
                      </p>
                      <div 
                        className="border rounded-lg overflow-hidden bg-background"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                      />
                    </div>
                  </div>
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
  );
};

export default SystemBannersPage;
