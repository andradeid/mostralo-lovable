import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CommissionConfigFormProps {
  salespersonId: string;
  currentConfig?: {
    commission_type: string;
    commission_value: number;
    applies_to: string;
  };
  onSuccess?: () => void;
}

export function CommissionConfigForm({ 
  salespersonId, 
  currentConfig,
  onSuccess 
}: CommissionConfigFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [commissionType, setCommissionType] = useState(currentConfig?.commission_type || "percentage");
  const [commissionValue, setCommissionValue] = useState(currentConfig?.commission_value?.toString() || "");
  const [appliesTo, setAppliesTo] = useState(currentConfig?.applies_to || "recurring");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const value = parseFloat(commissionValue);
      
      if (isNaN(value) || value <= 0) {
        toast({
          title: "Valor inválido",
          description: "Por favor, insira um valor válido",
          variant: "destructive",
        });
        return;
      }

      if (commissionType === "percentage" && value > 100) {
        toast({
          title: "Percentual inválido",
          description: "O percentual não pode ser maior que 100%",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("salesperson_commission_configs")
        .upsert({
          salesperson_id: salespersonId,
          commission_type: commissionType,
          commission_value: value,
          applies_to: appliesTo,
        }, {
          onConflict: "salesperson_id"
        });

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: "As configurações de comissão foram atualizadas com sucesso",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Comissão</CardTitle>
        <CardDescription>
          Configure como este vendedor receberá comissões pelas vendas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Tipo de Comissão</Label>
            <RadioGroup value={commissionType} onValueChange={setCommissionType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="font-normal cursor-pointer">
                  Percentual sobre o valor da venda
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer">
                  Valor fixo por venda
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission-value">
              {commissionType === "percentage" ? "Percentual (%)" : "Valor Fixo (R$)"}
            </Label>
            <Input
              id="commission-value"
              type="number"
              step="0.01"
              min="0"
              max={commissionType === "percentage" ? "100" : undefined}
              value={commissionValue}
              onChange={(e) => setCommissionValue(e.target.value)}
              placeholder={commissionType === "percentage" ? "Ex: 10" : "Ex: 50.00"}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applies-to">Aplica-se a</Label>
            <Select value={appliesTo} onValueChange={setAppliesTo}>
              <SelectTrigger id="applies-to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_payment">
                  Apenas primeiro pagamento
                </SelectItem>
                <SelectItem value="recurring">
                  Pagamentos recorrentes (mensal)
                </SelectItem>
                <SelectItem value="all">
                  Todos os pagamentos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
