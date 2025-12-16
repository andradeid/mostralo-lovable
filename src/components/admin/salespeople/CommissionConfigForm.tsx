import { useState, useEffect } from "react";
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
  } | null;
  onSuccess?: () => void;
}

export function CommissionConfigForm({ 
  salespersonId, 
  currentConfig,
  onSuccess 
}: CommissionConfigFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [commissionType, setCommissionType] = useState("percentage");
  const [commissionValue, setCommissionValue] = useState("");
  const [appliesTo, setAppliesTo] = useState("recurring");

  // Sincronizar estados quando currentConfig mudar
  useEffect(() => {
    if (currentConfig) {
      setCommissionType(currentConfig.commission_type || "percentage");
      setCommissionValue(currentConfig.commission_value?.toString() || "");
      setAppliesTo(currentConfig.applies_to || "recurring");
    }
  }, [currentConfig]);

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
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-base md:text-lg">Configuração de Comissão</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Configure como este vendedor receberá comissões
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-2 md:space-y-3">
            <Label className="text-sm">Tipo de Comissão</Label>
            <RadioGroup value={commissionType} onValueChange={setCommissionType} className="space-y-2">
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="percentage" id="percentage" className="mt-0.5" />
                <Label htmlFor="percentage" className="font-normal cursor-pointer text-xs md:text-sm leading-tight">
                  <span className="md:hidden">% sobre o valor</span>
                  <span className="hidden md:inline">Percentual sobre o valor da venda</span>
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="fixed" id="fixed" className="mt-0.5" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer text-xs md:text-sm leading-tight">
                  <span className="md:hidden">Valor fixo</span>
                  <span className="hidden md:inline">Valor fixo por venda</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="commission-value" className="text-sm">
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
              className="h-9 md:h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="applies-to" className="text-sm">Aplica-se a</Label>
            <Select value={appliesTo} onValueChange={setAppliesTo}>
              <SelectTrigger id="applies-to" className="h-9 md:h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_payment" className="text-xs md:text-sm">
                  <span className="md:hidden">1º pagamento</span>
                  <span className="hidden md:inline">Apenas primeiro pagamento</span>
                </SelectItem>
                <SelectItem value="recurring" className="text-xs md:text-sm">
                  <span className="md:hidden">Recorrente</span>
                  <span className="hidden md:inline">Pagamentos recorrentes (mensal)</span>
                </SelectItem>
                <SelectItem value="all" className="text-xs md:text-sm">
                  <span className="md:hidden">Todos</span>
                  <span className="hidden md:inline">Todos os pagamentos</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-9 md:h-10 text-sm">
            {loading ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
