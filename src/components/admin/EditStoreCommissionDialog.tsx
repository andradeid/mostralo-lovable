import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Percent, Calculator, Store } from "lucide-react";

interface EditStoreCommissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: {
    id: string;
    name: string;
    online_payment_commission: number | null;
  } | null;
  onSuccess: () => void;
}

export function EditStoreCommissionDialog({
  open,
  onOpenChange,
  store,
  onSuccess
}: EditStoreCommissionDialogProps) {
  const [commission, setCommission] = useState<string>("7.00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) {
      setCommission((store.online_payment_commission ?? 7).toFixed(2));
    }
  }, [store]);

  const commissionValue = parseFloat(commission) || 0;
  const sampleOrder = 100;
  const mostraloReceives = (sampleOrder * commissionValue) / 100;
  const storeReceives = sampleOrder - mostraloReceives;

  const handleSave = async () => {
    if (!store) return;
    
    const value = parseFloat(commission);
    if (isNaN(value) || value < 0 || value > 100) {
      toast.error("Taxa deve ser entre 0% e 100%");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("stores")
        .update({ online_payment_commission: value })
        .eq("id", store.id);

      if (error) throw error;

      toast.success(`Comissão atualizada para ${value.toFixed(2)}%`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao atualizar comissão:", error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Configurar Comissão
          </DialogTitle>
        </DialogHeader>

        {store && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{store.name}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission">Taxa de Comissão Mostralo</Label>
              <div className="relative">
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
            </div>

            <div className="p-4 bg-accent/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calculator className="h-4 w-4" />
                Simulação (Pedido de R$ {sampleOrder.toFixed(2)})
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-background rounded">
                  <span className="text-muted-foreground">Mostralo:</span>
                  <span className="ml-2 font-medium text-primary">
                    R$ {mostraloReceives.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 bg-background rounded">
                  <span className="text-muted-foreground">Lojista:</span>
                  <span className="ml-2 font-medium text-green-600">
                    R$ {storeReceives.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              ⚠️ Taxa padrão do sistema: 7%. Esta taxa será aplicada automaticamente em todas as cobranças PIX desta loja.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
