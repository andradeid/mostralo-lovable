import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDentalQuotes } from "@/hooks/dental/useDentalQuotes";
import { DentalProcedure } from "@/hooks/dental/useDentalProcedures";
import { Patient } from "@/hooks/dental/usePatients";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DentalQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: any;
  patients: Patient[];
  procedures: DentalProcedure[];
  storeId: string;
}

interface QuoteItem {
  id?: string;
  procedure_id: string;
  tooth_number: string;
  quantity: number;
  unit_price: number;
  notes: string;
}

export default function DentalQuoteDialog({
  open,
  onOpenChange,
  quote,
  patients,
  procedures,
  storeId,
}: DentalQuoteDialogProps) {
  const { toast } = useToast();
  const { createQuote, updateQuote } = useDentalQuotes(storeId);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: "",
    status: "draft",
    valid_until: "",
    notes: "",
    discount_amount: 0,
    discount_percentage: 0,
  });
  
  const [items, setItems] = useState<QuoteItem[]>([]);

  useEffect(() => {
    if (quote) {
      setFormData({
        patient_id: quote.patient_id || "",
        status: quote.status || "draft",
        valid_until: quote.valid_until?.split('T')[0] || "",
        notes: quote.notes || "",
        discount_amount: quote.discount_amount || 0,
        discount_percentage: quote.discount_percentage || 0,
      });
      setItems([]);
    } else {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      setFormData({
        patient_id: "",
        status: "draft",
        valid_until: futureDate.toISOString().split('T')[0],
        notes: "",
        discount_amount: 0,
        discount_percentage: 0,
      });
      setItems([]);
    }
  }, [quote, open]);

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

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "procedure_id") {
      const proc = procedures.find(p => p.id === value);
      if (proc) {
        newItems[index].unit_price = proc.default_price;
      }
    }
    
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    let discount = formData.discount_amount;
    
    if (formData.discount_percentage > 0) {
      discount = subtotal * (formData.discount_percentage / 100);
    }
    
    return Math.max(0, subtotal - discount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id) {
      toast({ title: "Selecione um paciente", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const subtotal = calculateSubtotal();
      let discountAmt = formData.discount_amount;
      
      if (formData.discount_percentage > 0) {
        discountAmt = subtotal * (formData.discount_percentage / 100);
      }

      const quoteData = {
        store_id: storeId,
        patient_id: formData.patient_id,
        quote_number: `ORC-${Date.now()}`,
        subtotal: subtotal,
        discount_percentage: formData.discount_percentage,
        discount_value: discountAmt,
        total_value: calculateTotal(),
        valid_until: formData.valid_until || undefined,
        notes: formData.notes,
      };

      if (quote) {
        await updateQuote.mutateAsync({ id: quote.id, ...quoteData });
      } else {
        await createQuote.mutateAsync(quoteData);
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
            {quote ? `Editar Orçamento #${quote.quote_number}` : "Novo Orçamento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select
                value={formData.patient_id}
                onValueChange={(v) => setFormData({ ...formData, patient_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
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
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="viewed">Visualizado</SelectItem>
                  <SelectItem value="accepted">Aceito</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Válido até</Label>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Desconto (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  discount_percentage: parseFloat(e.target.value) || 0,
                  discount_amount: 0 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Desconto (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  discount_amount: parseFloat(e.target.value) || 0,
                  discount_percentage: 0 
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-between items-center border-t pt-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Subtotal: R$ {calculateSubtotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-lg font-semibold">
                Total: R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : quote ? "Atualizar" : "Criar Orçamento"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
