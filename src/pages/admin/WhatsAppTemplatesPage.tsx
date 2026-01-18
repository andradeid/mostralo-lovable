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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  File,
  Copy,
  BookOpen,
  Heart,
  Gift,
  RotateCcw,
  Sparkles,
  BarChart3
} from "lucide-react";

const CATEGORIES = [
  { value: 'recuperacao', label: 'Recuperação de Cliente', icon: RotateCcw },
  { value: 'boas_vindas', label: 'Boas-vindas', icon: Sparkles },
  { value: 'promocao', label: 'Promoção', icon: Gift },
  { value: 'agradecimento', label: 'Agradecimento', icon: Heart },
  { value: 'proposta', label: 'Proposta Comercial', icon: FileText },
  { value: 'custom', label: 'Personalizado', icon: FileText },
];

const MESSAGE_TYPES = [
  { value: 'text', label: 'Texto', icon: FileText },
  { value: 'image', label: 'Imagem', icon: Image },
  { value: 'document', label: 'Documento', icon: File },
  { value: 'audio', label: 'Áudio', icon: FileAudio },
  { value: 'video', label: 'Vídeo', icon: Video },
  { value: 'poll', label: 'Enquete', icon: BarChart3 },
];

const VARIABLES = [
  // Gerais / Cliente
  { var: '{nome}', desc: 'Nome completo do cliente' },
  { var: '{primeiro_nome}', desc: 'Primeiro nome do cliente' },
  { var: '{telefone}', desc: 'Telefone do cliente' },
  { var: '{total_pedidos}', desc: 'Total de pedidos' },
  { var: '{total_gasto}', desc: 'Valor total gasto' },
  { var: '{dias_inativo}', desc: 'Dias desde último pedido' },
  { var: '{ultimo_pedido}', desc: 'Data do último pedido' },
  { var: '{loja}', desc: 'Nome da loja' },
  { var: '{link_loja}', desc: 'Link do cardápio' },
  // Propostas Comerciais
  { var: '{empresa}', desc: 'Nome da empresa do cliente' },
  { var: '{email}', desc: 'Email do cliente' },
  { var: '{valor_mensal}', desc: 'Valor mensal da proposta' },
  { var: '{valor_total}', desc: 'Valor total do contrato' },
  { var: '{valor_setup}', desc: 'Taxa de setup/implantação' },
  { var: '{desconto_percentual}', desc: 'Percentual de desconto' },
  { var: '{desconto_valor}', desc: 'Valor do desconto em R$' },
  { var: '{numero_proposta}', desc: 'Número da proposta' },
  { var: '{ciclo_cobranca}', desc: 'Ciclo de cobrança (mensal, anual, etc)' },
  { var: '{forma_pagamento}', desc: 'Forma de pagamento escolhida' },
  { var: '{link_proposta}', desc: 'Link da proposta comercial' },
  { var: '{validade}', desc: 'Data de validade da proposta' },
];

export default function WhatsAppTemplatesPage() {
  const { toast } = useToast();
  const { storeId } = useStoreAccess();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [defaultTemplates, setDefaultTemplates] = useState<any[]>([]);
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
      fetchDefaultTemplates();
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

  const fetchDefaultTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates' as any)
        .select('*')
        .is('store_id', null)
        .eq('is_default', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setDefaultTemplates(data || []);
    } catch (error) {
      console.error('Erro ao buscar templates padrão:', error);
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

  const useDefaultTemplate = async (template: any) => {
    setSaving(true);
    try {
      const templateData = {
        store_id: storeId,
        name: template.name,
        category: template.category,
        message_type: template.message_type,
        content: template.content,
        media_url: template.media_url || null,
        media_caption: template.media_caption || null,
        is_active: true,
        is_default: false,
        // Campos de enquete
        poll_question: template.poll_question || null,
        poll_options: template.poll_options || null,
        poll_selectable_count: template.poll_selectable_count || 1,
        // Campos de lista
        list_title: template.list_title || null,
        list_button_text: template.list_button_text || null,
        list_sections: template.list_sections || null,
      };

      const { error } = await supabase
        .from('whatsapp_templates' as any)
        .insert(templateData);

      if (error) throw error;
      
      toast({ 
        title: "Template adicionado!", 
        description: `"${template.name}" foi copiado para sua loja. Você pode editá-lo livremente.` 
      });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao usar template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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

  const getCategoryInfo = (value: string) => {
    return CATEGORIES.find(c => c.value === value) || CATEGORIES[4];
  };

  const getTypeIcon = (type: string) => {
    const TypeIcon = MESSAGE_TYPES.find(t => t.value === type)?.icon || FileText;
    return <TypeIcon className="h-4 w-4" />;
  };

  // Agrupar templates padrão por categoria
  const groupedDefaultTemplates = defaultTemplates.reduce((acc: Record<string, any[]>, template: any) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, any[]>);

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

      {/* Templates Padrão */}
      {defaultTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">📚 Modelos Prontos</CardTitle>
            </div>
            <CardDescription>
              Templates profissionais prontos para usar, incluindo enquetes e listas interativas. Clique em "Usar" para copiar para sua loja e personalizar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedDefaultTemplates).map(([category, categoryTemplates]: [string, any[]]) => {
                const catInfo = getCategoryInfo(category);
                const CatIcon = catInfo.icon;
                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <CatIcon className="h-4 w-4 text-primary" />
                        <span>{catInfo.label}</span>
                        <Badge variant="secondary" className="ml-2">
                          {categoryTemplates.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-3 md:grid-cols-2 pt-2">
                        {categoryTemplates.map((template: any) => (
                          <div 
                            key={template.id} 
                            className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-medium text-sm">{template.name}</h4>
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => useDefaultTemplate(template)}
                                disabled={saving}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Usar
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">
                              {template.content}
                            </p>
                            {template.message_type === 'poll' && template.poll_question && (
                              <div className="mt-2 p-2 bg-primary/10 rounded text-xs">
                                <p className="font-medium">📊 {template.poll_question}</p>
                                <p className="text-muted-foreground mt-1">
                                  {(() => {
                                    const options = Array.isArray(template.poll_options) 
                                      ? template.poll_options 
                                      : (typeof template.poll_options === 'string' ? JSON.parse(template.poll_options || '[]') : []);
                                    return (
                                      <>
                                        {options.slice(0, 3).join(' • ')}
                                        {options.length > 3 ? '...' : ''}
                                      </>
                                    );
                                  })()}
                                </p>
                              </div>
                            )}
                            {template.message_type === 'list' && template.list_button_text && (
                              <div className="mt-2 p-2 bg-green-500/10 rounded text-xs">
                                <p className="font-medium">📋 {template.list_title}</p>
                                <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-300 rounded text-xs">
                                  {template.list_button_text}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Templates da Loja */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Meus Templates
          {templates.length > 0 && (
            <Badge variant="outline">{templates.length}</Badge>
          )}
        </h2>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum template criado ainda.<br />
                Use um modelo pronto acima ou crie do zero!
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
                    {getCategoryInfo(template.category).label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 whitespace-pre-line">
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
    </div>
  );
}
