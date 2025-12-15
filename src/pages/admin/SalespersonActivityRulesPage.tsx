import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Users, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Shield,
  Percent
} from "lucide-react";

interface ActivityRule {
  id: string;
  evaluation_period: string;
  tier_full_commission: number;
  tier_reduced_commission: number;
  tier_minimum_commission: number;
  full_commission_percentage: number;
  reduced_commission_percentage: number;
  minimum_commission_percentage: number;
  grace_period_days: number;
  notify_days_before: number;
  allow_reactivation: boolean;
  reactivation_requires_new_sale: boolean;
  is_active: boolean;
}

export default function SalespersonActivityRulesPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<ActivityRule>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Buscar regras ativas
  const { data: rules, isLoading } = useQuery({
    queryKey: ["salesperson-activity-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salesperson_activity_rules")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as ActivityRule;
    },
  });

  // Preencher formulário quando dados carregarem
  useEffect(() => {
    if (rules) {
      setFormData(rules);
    }
  }, [rules]);

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<ActivityRule>) => {
      const { error } = await supabase
        .from("salesperson_activity_rules")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rules?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["salesperson-activity-rules"] });
      setHasChanges(false);
    },
    onError: (error) => {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    },
  });

  const handleChange = (field: keyof ActivityRule, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "full": return "bg-green-500";
      case "reduced": return "bg-yellow-500";
      case "minimum": return "bg-orange-500";
      case "suspended": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Regras de Atividade
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure as regras de manutenção de carteira para vendedores
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || saveMutation.isPending}
          className="w-full sm:w-auto"
        >
          {saveMutation.isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>

      {/* Preview das Faixas */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Preview das Faixas de Comissão
          </CardTitle>
          <CardDescription>
            Visualização de como as faixas funcionarão com a configuração atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-500 text-white">INTEGRAL</Badge>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formData.full_commission_percentage || 100}%
              </p>
              <p className="text-xs text-muted-foreground">
                ≥ {formData.tier_full_commission || 10} clientes ativos
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-yellow-500 text-white">REDUZIDA</Badge>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {formData.reduced_commission_percentage || 80}%
              </p>
              <p className="text-xs text-muted-foreground">
                ≥ {formData.tier_reduced_commission || 5} clientes ativos
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-orange-500 text-white">MÍNIMA</Badge>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {formData.minimum_commission_percentage || 50}%
              </p>
              <p className="text-xs text-muted-foreground">
                ≥ {formData.tier_minimum_commission || 1} cliente ativo
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-red-500 text-white">SUSPENSA</Badge>
              </div>
              <p className="text-2xl font-bold text-red-600">0%</p>
              <p className="text-xs text-muted-foreground">
                0 clientes ativos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Período de Avaliação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Período de Avaliação
            </CardTitle>
            <CardDescription>
              Define quando as carteiras serão avaliadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ciclo de Avaliação</Label>
              <Select
                value={formData.evaluation_period || "quarterly"}
                onValueChange={(value) => handleChange("evaluation_period", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral (Recomendado)</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Trimestral sincroniza com o sistema de bônus existente
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Período de Graça (dias)</Label>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  value={formData.grace_period_days || 30}
                  onChange={(e) => handleChange("grace_period_days", parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Tempo extra após avaliação
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Notificar Antes (dias)</Label>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={formData.notify_days_before || 15}
                  onChange={(e) => handleChange("notify_days_before", parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Aviso antes do rebaixamento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Faixas de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Faixas de Clientes Ativos
            </CardTitle>
            <CardDescription>
              Quantidade mínima de clientes para cada faixa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge className="bg-green-500 text-white text-xs">INTEGRAL</Badge>
                Clientes para Comissão Integral
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.tier_full_commission || 10}
                onChange={(e) => handleChange("tier_full_commission", parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge className="bg-yellow-500 text-white text-xs">REDUZIDA</Badge>
                Clientes para Comissão Reduzida
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.tier_reduced_commission || 5}
                onChange={(e) => handleChange("tier_reduced_commission", parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge className="bg-orange-500 text-white text-xs">MÍNIMA</Badge>
                Clientes para Comissão Mínima
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.tier_minimum_commission || 1}
                onChange={(e) => handleChange("tier_minimum_commission", parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Percentuais de Comissão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Percentuais de Comissão
            </CardTitle>
            <CardDescription>
              Quanto do valor original o vendedor recebe em cada faixa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge className="bg-green-500 text-white text-xs">INTEGRAL</Badge>
                Percentual (%)
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.full_commission_percentage || 100}
                onChange={(e) => handleChange("full_commission_percentage", parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge className="bg-yellow-500 text-white text-xs">REDUZIDA</Badge>
                Percentual (%)
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.reduced_commission_percentage || 80}
                onChange={(e) => handleChange("reduced_commission_percentage", parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge className="bg-orange-500 text-white text-xs">MÍNIMA</Badge>
                Percentual (%)
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.minimum_commission_percentage || 50}
                onChange={(e) => handleChange("minimum_commission_percentage", parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reativação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Reativação
            </CardTitle>
            <CardDescription>
              Regras para vendedores recuperarem suas comissões
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir Reativação</Label>
                <p className="text-xs text-muted-foreground">
                  Vendedores podem recuperar comissão adquirindo novos clientes
                </p>
              </div>
              <Switch
                checked={formData.allow_reactivation ?? true}
                onCheckedChange={(checked) => handleChange("allow_reactivation", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exigir Nova Venda</Label>
                <p className="text-xs text-muted-foreground">
                  Reativação exige pelo menos uma nova venda no período
                </p>
              </div>
              <Switch
                checked={formData.reactivation_requires_new_sale ?? false}
                onCheckedChange={(checked) => handleChange("reactivation_requires_new_sale", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Explicação do Sistema */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <p>
              <strong>Manutenção de Carteira:</strong> A comissão é baseada em quantos clientes 
              ativos (com assinatura ativa) o vendedor mantém, não apenas em novas vendas.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <p>
              <strong>Avaliação Trimestral:</strong> Sincronizado com o sistema de bônus, 
              avaliamos a carteira no fim de cada trimestre.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <p>
              <strong>Proteção Regional:</strong> Se o vendedor já esgotou sua região, 
              ele mantém comissão integral enquanto seus clientes permanecem ativos.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <p>
              <strong>Período de Graça:</strong> Antes de rebaixar, o vendedor recebe 
              notificação e tem tempo para recuperar clientes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
