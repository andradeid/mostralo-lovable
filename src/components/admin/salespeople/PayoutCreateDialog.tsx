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
import { Plus, User, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Salesperson {
  id: string;
  full_name: string;
  email: string;
  salesperson_type: string;
  pix_key: string | null;
  pix_key_type: string | null;
}

interface PayoutCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'requested', label: 'Solicitado' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'paid', label: 'Pago' },
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

export function PayoutCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: PayoutCreateDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [loadingSalespeople, setLoadingSalespeople] = useState(true);

  const currentDate = new Date();
  const [formData, setFormData] = useState({
    salesperson_id: '',
    status: 'pending',
    cycle_month: currentDate.getMonth() + 1,
    cycle_year: currentDate.getFullYear(),
    total_sales: 1,
    commission_total: 0,
    bonus_total: 0,
  });

  useEffect(() => {
    if (open) {
      fetchSalespeople();
      // Reset form
      setFormData({
        salesperson_id: '',
        status: 'pending',
        cycle_month: currentDate.getMonth() + 1,
        cycle_year: currentDate.getFullYear(),
        total_sales: 1,
        commission_total: 0,
        bonus_total: 0,
      });
    }
  }, [open]);

  const fetchSalespeople = async () => {
    setLoadingSalespeople(true);
    try {
      const { data, error } = await supabase
        .from('salespeople')
        .select('id, full_name, email, salesperson_type, pix_key, pix_key_type')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      setSalespeople(data || []);
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
    } finally {
      setLoadingSalespeople(false);
    }
  };

  const selectedSalesperson = salespeople.find(s => s.id === formData.salesperson_id);
  const grandTotal = formData.commission_total + formData.bonus_total;

  const handleCreate = async () => {
    if (!formData.salesperson_id) {
      toast({
        title: "Vendedor obrigatório",
        description: "Selecione um vendedor",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const salesperson = salespeople.find(s => s.id === formData.salesperson_id);
      
      const insertData = {
        salesperson_id: formData.salesperson_id,
        status: formData.status,
        cycle_month: formData.cycle_month,
        cycle_year: formData.cycle_year,
        total_sales: formData.total_sales,
        commission_total: formData.commission_total,
        bonus_total: formData.bonus_total,
        grand_total: grandTotal,
        pix_key: salesperson?.pix_key || null,
        pix_key_type: salesperson?.pix_key_type || null,
        requested_at: formData.status !== 'pending' ? new Date().toISOString() : null,
        paid_at: formData.status === 'paid' ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('salesperson_payouts')
        .insert([insertData]);

      if (error) throw error;

      toast({
        title: "Payout criado!",
        description: `Payout para ${salesperson?.full_name} criado com sucesso`,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar:', error);
      
      // Verifica se é erro de duplicata
      if (error.code === '23505') {
        toast({
          title: "Período já existe",
          description: "Já existe um payout para este vendedor neste período",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar",
          description: "Tente novamente",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Payout Manual</DialogTitle>
          <DialogDescription>
            Crie um payout manualmente para testes ou ajustes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Vendedor */}
          <div className="space-y-2">
            <Label>Vendedor *</Label>
            {loadingSalespeople ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : (
              <Select
                value={formData.salesperson_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, salesperson_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {salespeople.map(sp => (
                    <SelectItem key={sp.id} value={sp.id}>
                      <div className="flex items-center gap-2">
                        {sp.salesperson_type === 'affiliate' ? (
                          <User className="w-3 h-3 text-blue-500" />
                        ) : (
                          <Building2 className="w-3 h-3 text-orange-500" />
                        )}
                        {sp.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedSalesperson && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={
                  selectedSalesperson.salesperson_type === 'affiliate'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-orange-500 text-orange-600'
                }>
                  {selectedSalesperson.salesperson_type === 'affiliate' ? 'Afiliado' : 'Parceiro PJ'}
                </Badge>
                <span className="text-xs text-muted-foreground">{selectedSalesperson.email}</span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status Inicial</Label>
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
            <p className="text-xs text-muted-foreground">
              {formData.status === 'pending' && "Vendedor poderá ver e solicitar pagamento"}
              {formData.status === 'requested' && "Payout já aparecerá como solicitado para análise"}
              {formData.status === 'approved' && "Payout já aprovado, aguardando pagamento"}
              {formData.status === 'paid' && "Payout já finalizado como pago"}
            </p>
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
              <span className="text-muted-foreground">Total:</span>
              <span className="text-xl font-bold text-green-600">
                R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading || !formData.salesperson_id}>
            <Plus className="w-4 h-4 mr-2" />
            {loading ? "Criando..." : "Criar Payout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
