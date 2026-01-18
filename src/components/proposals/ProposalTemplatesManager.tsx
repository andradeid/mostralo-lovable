import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, FileText, Trash2, Save, X, Edit2, 
  Copy, Loader2, Info, MessageSquare 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

const AVAILABLE_VARIABLES = [
  { key: '{nome}', description: 'Nome completo do cliente' },
  { key: '{primeiro_nome}', description: 'Primeiro nome do cliente' },
  { key: '{valor_mensal}', description: 'Valor mensal formatado (R$)' },
  { key: '{valor_total}', description: 'Valor total do período' },
  { key: '{ciclo_cobranca}', description: 'Ciclo de cobrança (Mensal, Trimestral...)' },
  { key: '{link_proposta}', description: 'Link da proposta' },
  { key: '{validade}', description: 'Data de validade da proposta' },
];

const DEFAULT_TEMPLATE = `Olá, {primeiro_nome}! 👋

Preparamos uma proposta comercial exclusiva para você/sua empresa.

💰 Investimento: {valor_mensal}/mês
📅 Ciclo: {ciclo_cobranca}

Acesse sua proposta personalizada:
{link_proposta}

*Válida até: {validade}*

Ficamos à disposição para esclarecer qualquer dúvida! 🚀`;

export function ProposalTemplatesManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    content: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('category', 'proposta')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as Template[]);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      name: '',
      content: DEFAULT_TEMPLATE,
    });
  };

  const handleEdit = (template: Template) => {
    setEditingId(template.id);
    setIsCreating(false);
    setFormData({
      name: template.name,
      content: template.content,
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', content: '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('whatsapp_templates')
          .insert({
            name: formData.name,
            content: formData.content,
            category: 'proposta',
            is_active: true,
          });

        if (error) throw error;
        toast.success('Template criado com sucesso!');
      } else if (editingId) {
        const { error } = await supabase
          .from('whatsapp_templates')
          .update({
            name: formData.name,
            content: formData.content,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Template atualizado!');
      }

      handleCancel();
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast.success('Template excluído!');
      fetchTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    } finally {
      setDeleteId(null);
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast.success(`Variável ${variable} copiada!`);
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + variable,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Templates de WhatsApp para Propostas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crie e gerencie mensagens personalizadas para enviar propostas
          </p>
        </div>
        {!isCreating && !editingId && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        )}
      </div>

      {/* Variables Reference */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="w-4 h-4" />
            Variáveis Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              {AVAILABLE_VARIABLES.map((variable) => (
                <Tooltip key={variable.key}>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => isCreating || editingId ? insertVariable(variable.key) : copyVariable(variable.key)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {variable.key}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{variable.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clique para {isCreating || editingId ? 'inserir' : 'copiar'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="border-primary/50">
          <CardHeader className="py-4">
            <CardTitle className="text-base">
              {isCreating ? 'Criar Novo Template' : 'Editar Template'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                placeholder="Ex: Envio Formal, Envio Descontraído..."
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-content">Conteúdo da Mensagem</Label>
              <Textarea
                id="template-content"
                placeholder="Digite sua mensagem aqui..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use as variáveis acima para personalizar automaticamente a mensagem.
              </p>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Prévia</Label>
              <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm">
                {formData.content
                  .replace(/\{nome\}/g, 'João da Silva')
                  .replace(/\{primeiro_nome\}/g, 'João')
                  .replace(/\{valor_mensal\}/g, 'R$ 497,00')
                  .replace(/\{valor_total\}/g, 'R$ 497,00')
                  .replace(/\{ciclo_cobranca\}/g, 'Mensal')
                  .replace(/\{link_proposta\}/g, 'https://mostralo.com/proposta/abc123')
                  .replace(/\{validade\}/g, '25 de janeiro de 2026')}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="space-y-3">
        {templates.length === 0 && !isCreating ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">Nenhum template criado</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Crie seu primeiro template para agilizar o envio de propostas
              </p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card 
              key={template.id} 
              className={editingId === template.id ? 'opacity-50' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium">{template.name}</span>
                      {template.is_active ? (
                        <Badge variant="outline" className="text-green-600 border-green-500/30">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(template)}
                      disabled={!!editingId || isCreating}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDeleteId(template.id)}
                      className="text-destructive hover:text-destructive"
                      disabled={!!editingId || isCreating}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
