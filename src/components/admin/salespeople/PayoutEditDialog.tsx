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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Trash2 } from "lucide-react";

interface PayoutWithSalesperson {
  id: string;
  cycle_month: number;
  cycle_year: number;
  total_sales: number;
  commission_total: number;
  bonus_total: number;
  grand_total: number;
  requested_at: string | null;
  invoice_url: string | null;
  invoice_number: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  status: string;
  rejection_reason: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  created_at: string;
  salesperson: {
    id: string;
    full_name: string;
    email: string;
    salesperson_type: string;
    cpf: string | null;
    cnpj: string | null;
    company_name: string | null;
  };
}

interface PayoutEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payout: PayoutWithSalesperson;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'requested', label: 'Solicitado' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'paid', label: 'Pago' },
  { value: 'rejected', label: 'Rejeitado' },
];

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export function PayoutEditDialog({
  open,
  onOpenChange,
  payout,
  onSuccess,
}: PayoutEditDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [formData, setFormData] = useState({
    status: payout.status,
    cycle_month: payout.cycle_month,
    cycle_year: payout.cycle_year,
    total_sales: payout.total_sales,
    commission_total: Number(payout.commission_total),
    bonus_total: Number(payout.bonus_total),
    grand_total: Number(payout.grand_total),
    rejection_reason: payout.rejection_reason || '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        status: payout.status,
        cycle_month: payout.cycle_month,
        cycle_year: payout.cycle_year,
        total_sales: payout.total_sales,
        commission_total: Number(payout.commission_total),
        bonus_total: Number(payout.bonus_total),
        grand_total: Number(payout.grand_total),
        rejection_reason: payout.rejection_reason || '',
      });
      setConfirmDelete(false);
    }
  }, [open, payout]);

  // Recalcula grand_total quando comissão ou bônus mudam
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      grand_total: prev.commission_total + prev.bonus_total
    }));
  }, [formData.commission_total, formData.bonus_total]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData: Record<string, any> = {
        status: formData.status,
        cycle_month: formData.cycle_month,
        cycle_year: formData.cycle_year,
        total_sales: formData.total_sales,
        commission_total: formData.commission_total,
        bonus_total: formData.bonus_total,
        grand_total: formData.grand_total,
      };

      // Gerencia datas baseado no status
      if (formData.status === 'pending') {
        updateData.requested_at = null;
        updateData.paid_at = null;
        updateData.rejection_reason = null;
      } else if (formData.status === 'requested' && !payout.requested_at) {
        updateData.requested_at = new Date().toISOString();
        updateData.paid_at = null;
      } else if (formData.status === 'rejected') {
        updateData.rejection_reason = formData.rejection_reason || 'Rejeitado pelo admin';
        updateData.paid_at = null;
      } else if (formData.status === 'paid' && !payout.paid_at) {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('salesperson_payouts')
        .update(updateData)
        .eq('id', payout.id);

      if (error) throw error;

      toast({
        title: "Payout atualizado!",
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
        .from('salesperson_payouts')
        .delete()
        .eq('id', payout.id);

      if (error) throw error;

      toast({
        title: "Payout excluído!",
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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Payout</DialogTitle>
          <DialogDescription>
            {payout.salesperson?.full_name} - Edição completa para testes
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

          {/* Período */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select
                value={String(formData.cycle_month)}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cycle_month: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select
                value={String(formData.cycle_year)}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cycle_year: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vendas */}
          <div className="space-y-2">
            <Label>Quantidade de Vendas</Label>
            <Input
              type="number"
              min="0"
              value={formData.total_sales}
              onChange={(e) => setFormData(prev => ({ ...prev, total_sales: Number(e.target.value) }))}
            />
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Comissão (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.commission_total}
                onChange={(e) => setFormData(prev => ({ ...prev, commission_total: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Bônus (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.bonus_total}
                onChange={(e) => setFormData(prev => ({ ...prev, bonus_total: Number(e.target.value) }))}
              />
            </div>
          </div>

          {/* Total calculado */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Calculado:</span>
              <span className="text-xl font-bold text-green-600">
                R$ {formData.grand_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Motivo de rejeição (se status = rejected) */}
          {formData.status === 'rejected' && (
            <div className="space-y-2">
              <Label>Motivo da Rejeição</Label>
              <Textarea
                value={formData.rejection_reason}
                onChange={(e) => setFormData(prev => ({ ...prev, rejection_reason: e.target.value }))}
                placeholder="Informe o motivo da rejeição..."
                rows={2}
              />
            </div>
          )}

          {/* Zona de perigo */}
          <div className="border border-destructive/50 rounded-lg p-4 mt-6">
            <h4 className="font-medium text-destructive mb-2">⚠️ Zona de Perigo</h4>
            {!confirmDelete ? (
              <Button
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir este Payout
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
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
                    {deleting ? "Excluindo..." : "Confirmar Exclusão"}
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
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
