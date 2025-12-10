import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { 
  Loader2, 
  Plus, 
  Pencil, 
  Trash2, 
  FileText,
  Image,
  FileAudio,
  Video,
  File
} from "lucide-react";

const CATEGORIES = [
  { value: 'recuperacao', label: 'Recuperação de Cliente' },
  { value: 'boas_vindas', label: 'Boas-vindas' },
  { value: 'promocao', label: 'Promoção' },
  { value: 'agradecimento', label: 'Agradecimento' },
  { value: 'custom', label: 'Personalizado' },
];

const MESSAGE_TYPES = [
  { value: 'text', label: 'Texto', icon: FileText },
  { value: 'image', label: 'Imagem', icon: Image },
  { value: 'document', label: 'Documento', icon: File },
  { value: 'audio', label: 'Áudio', icon: FileAudio },
  { value: 'video', label: 'Vídeo', icon: Video },
];

const VARIABLES = [
  { var: '{nome}', desc: 'Nome completo do cliente' },
  { var: '{primeiro_nome}', desc: 'Primeiro nome do cliente' },
  { var: '{telefone}', desc: 'Telefone do cliente' },
  { var: '{total_pedidos}', desc: 'Total de pedidos' },
  { var: '{total_gasto}', desc: 'Valor total gasto' },
  { var: '{dias_inativo}', desc: 'Dias desde último pedido' },
  { var: '{ultimo_pedido}', desc: 'Data do último pedido' },
  { var: '{loja}', desc: 'Nome da loja' },
  { var: '{link_loja}', desc: 'Link do cardápio' },
];

export default function WhatsAppTemplatesPage() {
  const { toast } = useToast();
  const { storeId } = useStoreAccess();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  const [form, setForm] = useState({
    name: '',
    category: 'recuperacao',
    message_type: 'text',
    content: '',
    media_url: '',
    media_caption: '',
    is_active: true,
  });

  useEffect(() => {
    if (storeId) {
      fetchTemplates();
    }
  }, [storeId]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates' as any)
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      category: 'recuperacao',
      message_type: 'text',
      content: '',
      media_url: '',
      media_caption: '',
      is_active: true,
    });
    setEditingTemplate(null);
  };

  const openDialog = (template?: any) => {
    if (template) {
      setEditingTemplate(template);
      setForm({
        name: template.name,
        category: template.category,
        message_type: template.message_type,
        content: template.content,
        media_url: template.media_url || '',
        media_caption: template.media_caption || '',
        is_active: template.is_active,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.content) {
      toast({
        title: "Erro",
        description: "Preencha o nome e o conteúdo da mensagem",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        store_id: storeId,
        name: form.name,
        category: form.category,
        message_type: form.message_type,
        content: form.content,
        media_url: form.media_url || null,
        media_caption: form.media_caption || null,
        is_active: form.is_active,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('whatsapp_templates' as any)
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Template atualizado" });
      } else {
        const { error } = await supabase
          .from('whatsapp_templates' as any)
          .insert(templateData);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Template criado" });
      }

      setDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Deseja remover este template?')) return;

    try {
      const { error } = await supabase
        .from('whatsapp_templates' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Template removido" });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover template",
        variant: "destructive",
      });
    }
  };

  const insertVariable = (variable: string) => {
    setForm(prev => ({
      ...prev,
      content: prev.content + variable,
    }));
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(c => c.value === value)?.label || value;
  };

  const getTypeIcon = (type: string) => {
    const TypeIcon = MESSAGE_TYPES.find(t => t.value === type)?.icon || FileText;
    return <TypeIcon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates de Mensagem</h1>
          <p className="text-muted-foreground">
            Crie modelos de mensagem para suas campanhas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
              <DialogDescription>
                Crie um modelo de mensagem com variáveis dinâmicas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome do Template *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Recuperação 7 dias"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Mensagem</Label>
                <Select
                  value={form.message_type}
                  onValueChange={(v) => setForm(prev => ({ ...prev, message_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.message_type !== 'text' && (
                <div className="space-y-2">
                  <Label>URL da Mídia</Label>
                  <Input
                    value={form.media_url}
                    onChange={(e) => setForm(prev => ({ ...prev, media_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Mensagem *</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite sua mensagem..."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Variáveis Disponíveis</Label>
                <div className="flex flex-wrap gap-2">
                  {VARIABLES.map(v => (
                    <Button
                      key={v.var}
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(v.var)}
                      title={v.desc}
                    >
                      {v.var}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label>Template Ativo</Label>
                  <p className="text-xs text-muted-foreground">
                    Templates inativos não aparecem na seleção de campanhas
                  </p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum template criado ainda.<br />
              Crie seu primeiro template para começar!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(template => (
            <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(template.message_type)}
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </div>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <CardDescription>
                  {getCategoryLabel(template.category)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {template.content}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openDialog(template)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteTemplate(template.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
