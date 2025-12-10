import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Tags, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LabelData {
  id: string;
  name: string;
  color: string;
  description: string | null;
  contacts_count: number;
}

interface LabelsTabProps {
  storeId: string;
  onRefresh: () => void;
}

const PRESET_COLORS = [
  '#f97316', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16'
];

export function LabelsTab({ storeId, onRefresh }: LabelsTabProps) {
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<LabelData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#f97316',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLabels();
  }, [storeId]);

  const fetchLabels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_contact_labels')
        .select('*')
        .eq('store_id', storeId)
        .order('name', { ascending: true });

      if (error) throw error;
      setLabels(data || []);
    } catch (error) {
      console.error('Erro ao buscar etiquetas:', error);
      toast.error('Erro ao carregar etiquetas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedLabel(null);
    setFormData({ name: '', color: '#f97316', description: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (label: LabelData) => {
    setSelectedLabel(label);
    setFormData({
      name: label.name,
      color: label.color,
      description: label.description || '',
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (label: LabelData) => {
    setSelectedLabel(label);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      if (selectedLabel) {
        // Editar
        const { error } = await supabase
          .from('whatsapp_contact_labels')
          .update({
            name: formData.name.trim(),
            color: formData.color,
            description: formData.description.trim() || null,
          })
          .eq('id', selectedLabel.id);

        if (error) throw error;
        toast.success('Etiqueta atualizada!');
      } else {
        // Criar
        const { error } = await supabase
          .from('whatsapp_contact_labels')
          .insert({
            store_id: storeId,
            name: formData.name.trim(),
            color: formData.color,
            description: formData.description.trim() || null,
          });

        if (error) throw error;
        toast.success('Etiqueta criada!');
      }

      setDialogOpen(false);
      fetchLabels();
      onRefresh();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Já existe uma etiqueta com esse nome');
      } else {
        toast.error('Erro ao salvar etiqueta');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLabel) return;

    try {
      const { error } = await supabase
        .from('whatsapp_contact_labels')
        .delete()
        .eq('id', selectedLabel.id);

      if (error) throw error;

      toast.success('Etiqueta removida!');
      setDeleteDialogOpen(false);
      fetchLabels();
      onRefresh();
    } catch (error) {
      toast.error('Erro ao remover etiqueta');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Etiquetas ({labels.length})</CardTitle>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Etiqueta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : labels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tags className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma etiqueta criada</p>
            <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
              Criar Primeira Etiqueta
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {labels.map(label => (
              <div 
                key={label.id} 
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: label.color }} 
                    />
                    <div>
                      <p className="font-medium">{label.name}</p>
                      {label.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {label.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {label.contacts_count}
                  </Badge>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleOpenEdit(label)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleOpenDelete(label)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog de criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedLabel ? 'Editar Etiqueta' : 'Nova Etiqueta'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Ex: Clientes VIP"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color 
                        ? 'border-foreground scale-110' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Descrição da etiqueta..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : selectedLabel ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert de deletar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir etiqueta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a etiqueta "{selectedLabel?.name}"?
              {selectedLabel && selectedLabel.contacts_count > 0 && (
                <span className="block mt-2 text-destructive">
                  Esta etiqueta está atribuída a {selectedLabel.contacts_count} contato(s).
                </span>
              )}
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
    </Card>
  );
}
