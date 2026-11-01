import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Lock, Plus, Tags } from 'lucide-react';
import { CustomerLabelBadge } from './CustomerLabelBadge';
import { LABEL_COLORS, canToggleLabel, isHexColor, labelChanges, validateNewLabelName } from '@/lib/customerLabels';
import { cn } from '@/lib/utils';

interface CustomerLabel {
  id: string;
  name: string;
  color: string;
  label_type: string | null;
  is_system: boolean | null;
}

interface ManageCustomerLabelsModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName?: string;
  storeId: string;
  /** Chamado depois de salvar (recarregar as etiquetas da lista) */
  onSuccess?: () => void;
  /** Chamado quando uma etiqueta nova é criada (recarregar o filtro) */
  onLabelsChanged?: () => void;
}

const isPermissionError = (e: unknown) => {
  const err = e as { code?: string; message?: string } | null;
  return err?.code === '42501' || /row-level security|permission denied/i.test(err?.message ?? '');
};

/** Marcar/desmarcar etiquetas da loja em um cliente e criar etiqueta nova (nome + cor). */
export const ManageCustomerLabelsModal = ({
  open,
  onClose,
  customerId,
  customerName,
  storeId,
  onSuccess,
  onLabelsChanged,
}: ManageCustomerLabelsModalProps) => {
  const [labels, setLabels] = useState<CustomerLabel[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(LABEL_COLORS[5]);
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [labelsRes, assignmentsRes] = await Promise.all([
        supabase.from('customer_labels').select('id, name, color, label_type, is_system')
          .eq('store_id', storeId).order('label_type').order('name'),
        supabase.from('customer_label_assignments').select('label_id')
          .eq('customer_id', customerId).eq('store_id', storeId),
      ]);
      if (labelsRes.error) throw labelsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      const ids = new Set((assignmentsRes.data ?? []).map(a => a.label_id));
      setLabels(labelsRes.data ?? []);
      setSavedIds(ids);
      setSelectedIds(new Set(ids));
    } catch (error) {
      console.error('Erro ao carregar etiquetas:', error);
      toast.error('Erro ao carregar etiquetas');
    } finally {
      setLoading(false);
    }
  }, [customerId, storeId]);

  useEffect(() => {
    if (open && customerId && storeId) {
      setNewName('');
      fetchData();
    }
  }, [open, customerId, storeId, fetchData]);

  const toggle = (label: CustomerLabel) => {
    if (!canToggleLabel(label)) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(label.id)) next.delete(label.id);
      else next.add(label.id);
      return next;
    });
  };

  const handleCreate = async () => {
    const problem = validateNewLabelName(newName, labels);
    if (problem) { toast.error(problem); return; }
    if (!isHexColor(newColor)) { toast.error('Escolha uma cor'); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('customer_labels')
        .insert({ store_id: storeId, name: newName.trim(), color: newColor, label_type: 'custom', is_system: false })
        .select('id, name, color, label_type, is_system')
        .single();
      if (error) {
        if (error.code === '23505') toast.error('Já existe uma etiqueta com esse nome');
        else if (isPermissionError(error)) toast.error('Sem permissão para criar etiquetas nesta loja');
        else throw error;
        return;
      }
      setLabels(prev => [...prev, data]);
      setSelectedIds(prev => new Set(prev).add(data.id)); // já marca no cliente (grava ao salvar)
      setNewName('');
      onLabelsChanged?.();
      toast.success('Etiqueta criada');
    } catch (error) {
      console.error('Erro ao criar etiqueta:', error);
      toast.error('Erro ao criar etiqueta');
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    const { toAdd, toRemove } = labelChanges(labels, savedIds, selectedIds);
    if (toAdd.length === 0 && toRemove.length === 0) { onClose(); return; }
    setSaving(true);
    try {
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('customer_label_assignments')
          .delete()
          .eq('customer_id', customerId)
          .eq('store_id', storeId)
          .in('label_id', toRemove);
        if (error) throw error;
      }
      if (toAdd.length > 0) {
        const { error } = await supabase
          .from('customer_label_assignments')
          .upsert(
            toAdd.map(labelId => ({ customer_id: customerId, label_id: labelId, store_id: storeId })),
            { onConflict: 'customer_id,label_id', ignoreDuplicates: true },
          );
        if (error) throw error;
      }
      toast.success('Etiquetas atualizadas');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar etiquetas:', error);
      toast.error(isPermissionError(error) ? 'Sem permissão para alterar etiquetas deste cliente' : 'Erro ao salvar etiquetas');
      fetchData(); // mostra o que ficou gravado de fato
    } finally {
      setSaving(false);
    }
  };

  const groups: { title: string; hint?: string; items: CustomerLabel[] }[] = [
    { title: 'Personalizadas', items: labels.filter(l => l.label_type !== 'channel' && l.label_type !== 'origin') },
    { title: 'Origem', items: labels.filter(l => l.label_type === 'origin') },
    {
      title: 'Canal (automáticas)',
      hint: 'Colocadas pelo sistema quando o cliente compra por esse canal. Não dá para pôr ou tirar à mão.',
      items: labels.filter(l => l.label_type === 'channel'),
    },
  ].filter(g => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Etiquetas do cliente
          </DialogTitle>
          {customerName && <DialogDescription>{customerName}</DialogDescription>}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground">A loja ainda não tem etiquetas. Crie a primeira abaixo.</p>
            )}

            {groups.map(group => (
              <div key={group.title} className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">{group.title}</h4>
                {group.hint && <p className="text-xs text-muted-foreground -mt-1">{group.hint}</p>}
                <div className="space-y-1">
                  {group.items.map(label => {
                    const editable = canToggleLabel(label);
                    const checked = selectedIds.has(label.id);
                    return (
                      <div
                        key={label.id}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg',
                          editable ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-70',
                        )}
                        onClick={() => toggle(label)}
                      >
                        <Checkbox
                          id={`label-${label.id}`}
                          checked={checked}
                          disabled={!editable}
                          onCheckedChange={() => toggle(label)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label htmlFor={`label-${label.id}`} className={cn('flex-1', editable && 'cursor-pointer')}>
                          <CustomerLabelBadge name={label.name} color={label.color} />
                        </Label>
                        {!editable && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Automática" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="space-y-2 border-t pt-4">
              <h4 className="font-medium text-sm">Nova etiqueta</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex.: VIP, Aniversariante"
                  value={newName}
                  maxLength={40}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
                />
                <Button type="button" variant="outline" onClick={handleCreate} disabled={creating || !newName.trim()}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span className="ml-1">Criar</span>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Cor da etiqueta">
                {LABEL_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={newColor === c}
                    aria-label={`Cor ${c}`}
                    className={cn('h-6 w-6 rounded-full border-2', newColor === c ? 'border-foreground' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                    onClick={() => setNewColor(c)}
                  />
                ))}
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-6 w-8 cursor-pointer rounded border bg-transparent p-0"
                  aria-label="Outra cor"
                />
                {newName.trim() && <CustomerLabelBadge name={newName.trim()} color={newColor} />}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
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
