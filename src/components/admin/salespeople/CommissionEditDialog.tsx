import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Trash2 } from "lucide-react";

interface Commission {
  id: string;
  salesperson_id: string;
  payment_approval_id: string | null;
  store_name: string | null;
  plan_name: string | null;
  payment_amount: number;
  commission_amount: number;
  commission_percentage: number | null;
  commission_type: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

interface CommissionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commission: Commission;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
];

export function CommissionEditDialog({
  open,
  onOpenChange,
  commission,
  onSuccess,
}: CommissionEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [formData, setFormData] = useState({
    status: commission.status,
    commission_amount: Number(commission.commission_amount),
    payment_amount: Number(commission.payment_amount),
  });

  useEffect(() => {
    if (open) {
      setFormData({
        status: commission.status,
        commission_amount: Number(commission.commission_amount),
        payment_amount: Number(commission.payment_amount),
      });
      setConfirmDelete(false);
    }
  }, [open, commission]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData: Record<string, unknown> = {
        status: formData.status,
        commission_amount: formData.commission_amount,
        payment_amount: formData.payment_amount,
      };

      // Gerencia paid_at baseado no status
      if (formData.status === 'paid' && commission.status !== 'paid') {
        updateData.paid_at = new Date().toISOString();
      } else if (formData.status === 'pending') {
        updateData.paid_at = null;
      }

      const { error } = await supabase
        .from('salesperson_commissions')
        .update(updateData)
        .eq('id', commission.id);

      if (error) throw error;

      toast({
        title: "Comissão atualizada!",
        description: "As alterações foram salvas",
      });
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('salesperson_commissions')
        .delete()
        .eq('id', commission.id);

      if (error) throw error;

      toast({
        title: "Comissão excluída!",
        description: "O registro foi removido",
      });
      onSuccess();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Editar Comissão</DialogTitle>
          <DialogDescription>
            {commission.store_name || "Comissão"} - {commission.plan_name || ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor do Pagamento */}
          <div className="space-y-2">
            <Label>Valor do Pagamento (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.payment_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_amount: Number(e.target.value) }))}
            />
          </div>

          {/* Valor da Comissão */}
          <div className="space-y-2">
            <Label>Valor da Comissão (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.commission_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, commission_amount: Number(e.target.value) }))}
            />
          </div>

          {/* Zona de perigo */}
          <div className="border border-destructive/50 rounded-lg p-4 mt-4">
            <h4 className="font-medium text-destructive mb-2 text-sm">⚠️ Zona de Perigo</h4>
            {!confirmDelete ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Comissão
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Tem certeza? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Excluindo..." : "Confirmar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
