import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Tags } from 'lucide-react';
import { CustomerLabelBadge } from './CustomerLabelBadge';

interface CustomerLabel {
  id: string;
  name: string;
  color: string;
  label_type: string;
  is_system: boolean;
}

interface ManageCustomerLabelsModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  storeId: string;
  onSuccess?: () => void;
}

export const ManageCustomerLabelsModal = ({
  open,
  onClose,
  customerId,
  storeId,
  onSuccess
}: ManageCustomerLabelsModalProps) => {
  const [labels, setLabels] = useState<CustomerLabel[]>([]);
  const [assignedLabelIds, setAssignedLabelIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && customerId && storeId) {
      fetchData();
    }
  }, [open, customerId, storeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar todas as etiquetas da loja
      const { data: labelsData, error: labelsError } = await supabase
        .from('customer_labels')
        .select('*')
        .eq('store_id', storeId)
        .order('label_type')
        .order('name');

      if (labelsError) throw labelsError;

      // Buscar etiquetas atribuídas ao cliente
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('customer_label_assignments')
        .select('label_id')
        .eq('customer_id', customerId);

      if (assignmentsError) throw assignmentsError;

      setLabels(labelsData || []);
      setAssignedLabelIds(new Set(assignmentsData?.map(a => a.label_id) || []));
    } catch (error) {
      console.error('Error fetching labels:', error);
      toast.error('Erro ao carregar etiquetas');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLabel = (labelId: string) => {
    setAssignedLabelIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(labelId)) {
        newSet.delete(labelId);
      } else {
        newSet.add(labelId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Buscar atribuições atuais
      const { data: currentAssignments } = await supabase
        .from('customer_label_assignments')
        .select('id, label_id')
        .eq('customer_id', customerId);

      const currentIds = new Set(currentAssignments?.map(a => a.label_id) || []);
      
      // Determinar o que adicionar e remover
      const toAdd = [...assignedLabelIds].filter(id => !currentIds.has(id));
      const toRemove = currentAssignments?.filter(a => !assignedLabelIds.has(a.label_id)).map(a => a.id) || [];

      // Remover etiquetas
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('customer_label_assignments')
          .delete()
          .in('id', toRemove);

        if (deleteError) throw deleteError;
      }

      // Adicionar etiquetas
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('customer_label_assignments')
          .insert(toAdd.map(labelId => ({
            customer_id: customerId,
            label_id: labelId,
            store_id: storeId
          })));

        if (insertError) throw insertError;
      }

      toast.success('Etiquetas atualizadas com sucesso!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving labels:', error);
      toast.error('Erro ao salvar etiquetas');
    } finally {
      setSaving(false);
    }
  };

  // Agrupar etiquetas por tipo
  const groupedLabels = labels.reduce((acc, label) => {
    const type = label.label_type === 'origin' ? 'Origem' : 
                 label.label_type === 'channel' ? 'Canal' : 'Personalizadas';
    if (!acc[type]) acc[type] = [];
    acc[type].push(label);
    return acc;
  }, {} as Record<string, CustomerLabel[]>);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Gerenciar Etiquetas
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedLabels).map(([type, typeLabels]) => (
              <div key={type} className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">{type}</h4>
                <div className="space-y-2">
                  {typeLabels.map((label) => (
                    <div
                      key={label.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleToggleLabel(label.id)}
                    >
                      <Checkbox
                        id={label.id}
                        checked={assignedLabelIds.has(label.id)}
                        onCheckedChange={() => handleToggleLabel(label.id)}
                      />
                      <Label htmlFor={label.id} className="flex-1 cursor-pointer">
                        <CustomerLabelBadge name={label.name} color={label.color} />
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
