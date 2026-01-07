import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDentalProcedures, PROCEDURE_CATEGORIES, DentalProcedure } from "@/hooks/dental/useDentalProcedures";

interface DentalProcedureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure: DentalProcedure | null;
  storeId: string;
}

export default function DentalProcedureDialog({
  open,
  onOpenChange,
  procedure,
  storeId,
}: DentalProcedureDialogProps) {
  const { createProcedure, updateProcedure } = useDentalProcedures(storeId);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    category: "other",
    default_price: 0,
    estimated_duration_minutes: 30,
  });

  useEffect(() => {
    if (procedure) {
      setFormData({
        code: procedure.code || "",
        name: procedure.name,
        description: procedure.description || "",
        category: procedure.category || "other",
        default_price: procedure.default_price,
        estimated_duration_minutes: procedure.estimated_duration_minutes,
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        category: "other",
        default_price: 0,
        estimated_duration_minutes: 30,
      });
    }
  }, [procedure, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const data = {
        store_id: storeId,
        code: formData.code || undefined,
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        default_price: formData.default_price,
        estimated_duration_minutes: formData.estimated_duration_minutes,
      };

      if (procedure) {
        await updateProcedure.mutateAsync({ id: procedure.id, ...data });
      } else {
        await createProcedure.mutateAsync(data);
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {procedure ? "Editar Procedimento" : "Novo Procedimento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: REST01"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROCEDURE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do procedimento"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do procedimento..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preço Padrão (R$) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.default_price}
                onChange={(e) => setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Duração (minutos)</Label>
              <Input
                type="number"
                min="5"
                step="5"
                value={formData.estimated_duration_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) || 30 })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? "Salvando..." : procedure ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
