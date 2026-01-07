import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DollarSign, BarChart3, Loader2 } from 'lucide-react';

interface Module {
  id: string;
  name: string;
  suggested_price: number | null;
  price_reference: string | null;
}

interface ModulePriceEditModalProps {
  module: Module | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ModulePriceEditModal({ module, open, onOpenChange, onSuccess }: ModulePriceEditModalProps) {
  const [suggestedPrice, setSuggestedPrice] = useState('');
  const [priceReference, setPriceReference] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (module) {
      setSuggestedPrice(module.suggested_price?.toString() || '0');
      setPriceReference(module.price_reference || '');
    }
  }, [module]);

  const handleSave = async () => {
    if (!module) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('modules')
        .update({
          suggested_price: parseFloat(suggestedPrice) || 0,
          price_reference: priceReference || null
        })
        .eq('id', module.id);

      if (error) throw error;

      toast.success('Preço atualizado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar preço:', error);
      toast.error('Erro ao atualizar preço');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Editar Preço - {module?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="suggestedPrice" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Preço Sugerido (R$/mês)
            </Label>
            <Input
              id="suggestedPrice"
              type="number"
              min="0"
              step="0.01"
              value={suggestedPrice}
              onChange={(e) => setSuggestedPrice(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Preço se o módulo fosse vendido individualmente
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceReference" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Referência de Mercado
            </Label>
            <Textarea
              id="priceReference"
              value={priceReference}
              onChange={(e) => setPriceReference(e.target.value)}
              placeholder="Ex: iFood Gestor cobra R$ 99/mês por recurso similar"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Comparação com concorrentes ou justificativa do preço
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
