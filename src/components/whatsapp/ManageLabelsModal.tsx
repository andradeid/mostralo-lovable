import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface ManageLabelsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  contactId: string;
  contactName: string;
  currentLabels: Label[];
  onSuccess: () => void;
}

export function ManageLabelsModal({
  open,
  onOpenChange,
  storeId,
  contactId,
  contactName,
  currentLabels,
  onSuccess,
}: ManageLabelsModalProps) {
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLabels();
      setSelectedLabelIds(currentLabels.map(l => l.id));
    }
  }, [open, storeId, currentLabels]);

  const fetchLabels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_contact_labels')
        .select('id, name, color')
        .eq('store_id', storeId)
        .order('name');

      if (error) throw error;
      setAllLabels(data || []);
    } catch (error) {
      console.error('Erro ao buscar etiquetas:', error);
      toast.error('Erro ao carregar etiquetas');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLabel = (labelId: string) => {
    setSelectedLabelIds(prev => {
      if (prev.includes(labelId)) {
        return prev.filter(id => id !== labelId);
      } else {
        return [...prev, labelId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentLabelIds = currentLabels.map(l => l.id);
      
      // Etiquetas a adicionar
      const labelsToAdd = selectedLabelIds.filter(id => !currentLabelIds.includes(id));
      
      // Etiquetas a remover
      const labelsToRemove = currentLabelIds.filter(id => !selectedLabelIds.includes(id));

      // Adicionar novas etiquetas
      if (labelsToAdd.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        
        for (const labelId of labelsToAdd) {
          const { error } = await supabase
            .from('whatsapp_contact_label_assignments')
            .upsert({
              contact_id: contactId,
              label_id: labelId,
              assigned_by: session?.user?.id,
            }, {
              onConflict: 'contact_id,label_id',
            });

          if (error) {
            console.error('Erro ao adicionar etiqueta:', error);
          }
        }
      }

      // Remover etiquetas desmarcadas
      if (labelsToRemove.length > 0) {
        for (const labelId of labelsToRemove) {
          const { error } = await supabase
            .from('whatsapp_contact_label_assignments')
            .delete()
            .eq('contact_id', contactId)
            .eq('label_id', labelId);

          if (error) {
            console.error('Erro ao remover etiqueta:', error);
          }
        }
      }

      toast.success('Etiquetas atualizadas!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar etiquetas:', error);
      toast.error('Erro ao salvar etiquetas');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Gerenciar Etiquetas
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Contato: <span className="font-medium">{contactName}</span>
          </p>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : allLabels.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Tags className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma etiqueta disponível.</p>
              <p className="text-xs">Crie etiquetas na aba de configuração.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {allLabels.map(label => (
                <div
                  key={label.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleToggleLabel(label.id)}
                >
                  <Checkbox
                    checked={selectedLabelIds.includes(label.id)}
                    onCheckedChange={() => handleToggleLabel(label.id)}
                  />
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1 font-medium">{label.name}</span>
                  {selectedLabelIds.includes(label.id) && (
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${label.color}20`,
                        color: label.color,
                        borderColor: label.color,
                      }}
                      className="text-xs border"
                    >
                      Selecionada
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
