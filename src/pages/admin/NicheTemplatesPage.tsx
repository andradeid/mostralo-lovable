import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Layers, Plus, Edit, Trash2, Star, Package, Loader2
} from 'lucide-react';
import { useNicheTemplates, useCreateNicheTemplate, useUpdateNicheTemplate, useDeleteNicheTemplate } from '@/hooks/useNicheTemplates';
import { useNiches } from '@/hooks/useNiches';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

interface Module {
  id: string;
  name: string;
  key: string | null;
  suggested_price: number | null;
}

export default function NicheTemplatesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    niche_id: '',
    description: '',
    module_ids: [] as string[],
    is_default: false
  });

  const { data: templates = [], isLoading } = useNicheTemplates();
  const { data: niches = [] } = useNiches();
  const { data: modules = [] } = useQuery({
    queryKey: ['modules-for-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('id, name, key, suggested_price')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Module[];
    }
  });

  const createTemplate = useCreateNicheTemplate();
  const updateTemplate = useUpdateNicheTemplate();
  const deleteTemplate = useDeleteNicheTemplate();

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: '', niche_id: '', description: '', module_ids: [], is_default: false });
    setIsFormOpen(true);
  };

  const openEdit = (template: typeof templates[0]) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      niche_id: template.niche_id || '',
      description: template.description || '',
      module_ids: template.module_ids || [],
      is_default: template.is_default || false
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.niche_id) return;

    if (editingId) {
      await updateTemplate.mutateAsync({ id: editingId, data: formData });
    } else {
      await createTemplate.mutateAsync(formData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTemplate.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const toggleModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      module_ids: prev.module_ids.includes(moduleId)
        ? prev.module_ids.filter(id => id !== moduleId)
        : [...prev.module_ids, moduleId]
    }));
  };

  const getModuleNames = (moduleIds: string[]) => {
    return moduleIds
      .map(id => modules.find(m => m.id === id)?.name)
      .filter(Boolean)
      .slice(0, 3);
  };

  const getModulesTotal = (moduleIds: string[]) => {
    return moduleIds.reduce((sum, id) => {
      const module = modules.find(m => m.id === id);
      return sum + (module?.suggested_price || 0);
    }, 0);
  };

  // Agrupar templates por nicho
  const groupedTemplates = templates.reduce((acc, template) => {
    const nicheName = template.niche?.name || 'Sem nicho';
    if (!acc[nicheName]) acc[nicheName] = [];
    acc[nicheName].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-7 h-7 text-primary" />
            Templates por Nicho
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure templates de módulos pré-definidos para cada nicho
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Templates agrupados */}
      {Object.entries(groupedTemplates).map(([nicheName, nicheTemplates]) => (
        <div key={nicheName} className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {nicheName}
            <Badge variant="secondary">{nicheTemplates.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {nicheTemplates.map((template) => (
              <Card key={template.id} className={template.is_default ? 'border-primary/50 bg-primary/5' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {template.name}
                        {template.is_default && (
                          <Badge className="bg-primary text-primary-foreground">
                            <Star className="w-3 h-3 mr-1" />
                            Padrão
                          </Badge>
                        )}
                      </CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1">{template.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(template)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDeleteId(template.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {getModuleNames(template.module_ids).map((name, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                    {template.module_ids.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.module_ids.length - 3} mais
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {template.module_ids.length} módulos selecionados
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      R$ {getModulesTotal(template.module_ids).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {templates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              Nenhum template criado ainda.
            </p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Template *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Barbearia Premium"
                />
              </div>
              <div className="space-y-2">
                <Label>Nicho *</Label>
                <Select 
                  value={formData.niche_id} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, niche_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {niches.map(niche => (
                      <SelectItem key={niche.id} value={niche.id}>
                        {niche.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional do template..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_default: checked as boolean }))
                }
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Definir como template padrão do nicho
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Módulos ({formData.module_ids.length} selecionados)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
                {modules.map(module => (
                  <div
                    key={module.id}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                      formData.module_ids.includes(module.id) 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleModule(module.id)}
                  >
                    <Checkbox
                      checked={formData.module_ids.includes(module.id)}
                      onCheckedChange={() => toggleModule(module.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{module.name}</p>
                      {module.suggested_price ? (
                        <p className="text-xs text-muted-foreground">
                          R$ {module.suggested_price}/mês
                        </p>
                      ) : (
                        <p className="text-xs text-green-600">Incluso</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.name || !formData.niche_id || createTemplate.isPending || updateTemplate.isPending}
            >
              {(createTemplate.isPending || updateTemplate.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
