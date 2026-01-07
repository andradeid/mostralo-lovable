import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTreatmentPlans } from "@/hooks/dental/useTreatmentPlans";
import { DentalProcedure } from "@/hooks/dental/useDentalProcedures";
import { Patient } from "@/hooks/dental/usePatients";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TreatmentPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: any;
  patients: Patient[];
  procedures: DentalProcedure[];
  storeId: string;
}

interface PlanItem {
  id?: string;
  procedure_id: string;
  tooth_number: string;
  quantity: number;
  unit_price: number;
  notes: string;
}

export default function TreatmentPlanDialog({
  open,
  onOpenChange,
  plan,
  patients,
  procedures,
  storeId,
}: TreatmentPlanDialogProps) {
  const { toast } = useToast();
  const { createPlan, updatePlan } = useTreatmentPlans(storeId);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: "",
    title: "",
    description: "",
    status: "draft",
  });
  
  const [items, setItems] = useState<PlanItem[]>([]);

  useEffect(() => {
    if (plan) {
      setFormData({
        patient_id: plan.patient_id || "",
        title: plan.title || "",
        description: plan.description || "",
        status: plan.status || "draft",
      });
      // TODO: Load items from plan
      setItems([]);
    } else {
      setFormData({
        patient_id: "",
        title: "",
        description: "",
        status: "draft",
      });
      setItems([]);
    }
  }, [plan, open]);

  const addItem = () => {
    setItems([...items, {
      procedure_id: "",
      tooth_number: "",
      quantity: 1,
      unit_price: 0,
      notes: "",
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PlanItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill price from procedure
    if (field === "procedure_id") {
      const proc = procedures.find(p => p.id === value);
      if (proc) {
        newItems[index].unit_price = proc.default_price;
      }
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id) {
      toast({ title: "Selecione um paciente", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const planData = {
        store_id: storeId,
        patient_id: formData.patient_id,
        name: formData.title,
        description: formData.description,
      };

      if (plan) {
        await updatePlan.mutateAsync({ id: plan.id, ...planData });
      } else {
        await createPlan.mutateAsync(planData);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? "Editar Plano de Tratamento" : "Novo Plano de Tratamento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={formData.patient_id}
                onValueChange={(v) => setFormData({ ...formData, patient_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Tratamento ortodôntico"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes do plano de tratamento..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Procedimentos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum procedimento adicionado
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <Select
                        value={item.procedure_id}
                        onValueChange={(v) => updateItem(index, "procedure_id", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Procedimento" />
                        </SelectTrigger>
                        <SelectContent>
                          {procedures.map((proc) => (
                            <SelectItem key={proc.id} value={proc.id}>
                              {proc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Input
                        placeholder="Dente"
                        value={item.tooth_number}
                        onChange={(e) => updateItem(index, "tooth_number", e.target.value)}
                      />
                      
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qtd"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                      
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Preço"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <p className="text-lg font-semibold">
                Total: R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : plan ? "Atualizar" : "Criar Plano"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
