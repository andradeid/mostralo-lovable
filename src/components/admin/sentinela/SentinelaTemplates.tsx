import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Copy, Edit2, Eye, FileText, Loader2, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SentinelaTemplate {
  id: string;
  store_id: string | null;
  category: string;
  name: string;
  content: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface SentinelaTemplatesProps {
  storeId: string;
  storeName?: string;
  storeSlug?: string;
}

const CATEGORIES = [
  { value: 'recompra', label: '🔄 Recompra', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  { value: 'lembrete_suave', label: '⏰ Lembrete Suave', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
  { value: 'urgencia', label: '🔥 Urgência', color: 'bg-red-500/10 text-red-500 border-red-500/30' },
  { value: 'promocional', label: '🎁 Promocional', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
  { value: 'fidelidade', label: '💚 Fidelidade', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
];

const PREVIEW_DATA = {
  nome: 'João Silva',
  primeiro_nome: 'João',
  produto: 'Café Premium 500g',
  loja: 'Minha Loja',
  link_loja: 'https://minha-loja.mostralo.com'
};

export function SentinelaTemplates({ storeId, storeName, storeSlug }: SentinelaTemplatesProps) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<SentinelaTemplate | null>(null);
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'recompra',
    content: ''
  });

  // Buscar templates (globais + da loja)
  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ['sentinela-templates', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sentinela_templates')
        .select('*')
        .or(`is_default.eq.true,store_id.eq.${storeId}`)
        .eq('is_active', true)
        .order('category')
        .order('name');

      if (error) throw error;
      return data as SentinelaTemplate[];
    },
    enabled: !!storeId
  });

  // Criar template
  const createMutation = useMutation({
    mutationFn: async (template: typeof newTemplate) => {
      const { data, error } = await supabase
        .from('sentinela_templates')
        .insert({
          store_id: storeId,
          category: template.category,
          name: template.name,
          content: template.content,
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinela-templates', storeId] });
      toast.success('Template criado com sucesso');
      setIsCreateOpen(false);
      setNewTemplate({ name: '', category: 'recompra', content: '' });
    },
    onError: (error) => {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template');
    }
  });

  // Atualizar template
  const updateMutation = useMutation({
    mutationFn: async (template: SentinelaTemplate) => {
      const { error } = await supabase
        .from('sentinela_templates')
        .update({
          name: template.name,
          category: template.category,
          content: template.content
        })
        .eq('id', template.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinela-templates', storeId] });
      toast.success('Template atualizado');
      setIsEditOpen(false);
      setEditingTemplate(null);
    },
    onError: (error) => {
      console.error('Erro ao atualizar template:', error);
      toast.error('Erro ao atualizar template');
    }
  });

  // Deletar template
  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('sentinela_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentinela-templates', storeId] });
      toast.success('Template removido');
    },
    onError: (error) => {
      console.error('Erro ao remover template:', error);
      toast.error('Erro ao remover template');
    }
  });

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  };

  const replaceVariables = (content: string) => {
    return content
      .replace(/{nome}/gi, PREVIEW_DATA.nome)
      .replace(/{primeiro_nome}/gi, PREVIEW_DATA.primeiro_nome)
      .replace(/{produto}/gi, PREVIEW_DATA.produto)
      .replace(/{loja}/gi, storeName || PREVIEW_DATA.loja)
      .replace(/{link_loja}/gi, storeSlug ? `https://${storeSlug}.mostralo.com` : PREVIEW_DATA.link_loja);
  };

  const handlePreview = (content: string) => {
    setPreviewContent(replaceVariables(content));
    setIsPreviewOpen(true);
  };

  const handleCopyTemplate = (template: SentinelaTemplate) => {
    setNewTemplate({
      name: `${template.name} (Cópia)`,
      category: template.category,
      content: template.content
    });
    setIsCreateOpen(true);
  };

  const handleEdit = (template: SentinelaTemplate) => {
    setEditingTemplate(template);
    setIsEditOpen(true);
  };

  const globalTemplates = templates?.filter(t => t.is_default) || [];
  const storeTemplates = templates?.filter(t => !t.is_default && t.store_id === storeId) || [];
  
  const filteredGlobalTemplates = selectedCategory 
    ? globalTemplates.filter(t => t.category === selectedCategory)
    : globalTemplates;
  
  const filteredStoreTemplates = selectedCategory
    ? storeTemplates.filter(t => t.category === selectedCategory)
    : storeTemplates;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header e Filtros */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Button>
          {CATEGORIES.map(cat => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
              <DialogDescription>
                Crie um template personalizado para sua loja
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Template</Label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Lembrete Especial"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={newTemplate.category}
                    onValueChange={(v) => setNewTemplate(prev => ({ ...prev, category: v }))}
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
                <Label>Mensagem</Label>
                <Textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite sua mensagem aqui..."
                  rows={8}
                />
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Variáveis disponíveis:</p>
                    <div className="flex flex-wrap gap-2">
                      <code className="bg-background px-1.5 py-0.5 rounded text-xs">{'{nome}'}</code>
                      <code className="bg-background px-1.5 py-0.5 rounded text-xs">{'{primeiro_nome}'}</code>
                      <code className="bg-background px-1.5 py-0.5 rounded text-xs">{'{produto}'}</code>
                      <code className="bg-background px-1.5 py-0.5 rounded text-xs">{'{loja}'}</code>
                      <code className="bg-background px-1.5 py-0.5 rounded text-xs">{'{link_loja}'}</code>
                    </div>
                  </div>
                </div>
              </div>
              {newTemplate.content && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </Label>
                  <div className="p-4 bg-muted/30 rounded-lg whitespace-pre-wrap text-sm">
                    {replaceVariables(newTemplate.content)}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createMutation.mutate(newTemplate)}
                disabled={createMutation.isPending || !newTemplate.name || !newTemplate.content}
              >
                {createMutation.isPending ? 'Criando...' : 'Criar Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates da Loja */}
      {storeTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Meus Templates ({filteredStoreTemplates.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStoreTemplates.map(template => (
              <Card key={template.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{template.name}</CardTitle>
                      <Badge variant="outline" className={`mt-1 ${getCategoryInfo(template.category).color}`}>
                        {getCategoryInfo(template.category).label}
                      </Badge>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handlePreview(template.content)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(template.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                    {template.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Templates Globais */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Templates Prontos ({filteredGlobalTemplates.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGlobalTemplates.map(template => (
            <Card key={template.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{template.name}</CardTitle>
                    <Badge variant="outline" className={`mt-1 ${getCategoryInfo(template.category).color}`}>
                      {getCategoryInfo(template.category).label}
                    </Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handlePreview(template.content)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyTemplate(template)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                  {template.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog de Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview da Mensagem
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-muted/30 rounded-lg whitespace-pre-wrap">
            {previewContent}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) setEditingTemplate(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={editingTemplate.category}
                    onValueChange={(v) => setEditingTemplate(prev => prev ? { ...prev, category: v } : null)}
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
                <Label>Mensagem</Label>
                <Textarea
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                  rows={8}
                />
              </div>
              {editingTemplate.content && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview
                  </Label>
                  <div className="p-4 bg-muted/30 rounded-lg whitespace-pre-wrap text-sm">
                    {replaceVariables(editingTemplate.content)}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => editingTemplate && updateMutation.mutate(editingTemplate)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
