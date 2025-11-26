import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, DollarSign } from "lucide-react";

interface PaymentConfig {
  id: string;
  pix_key: string;
  pix_key_type: string;
  account_holder_name: string;
  payment_instructions: string | null;
  enable_manual_approval: boolean;
  enable_auto_approval: boolean;
  bank_name: string | null;
  agency: string | null;
  account_number: string | null;
  is_active: boolean;
}

export default function SubscriptionPaymentConfigPage() {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('subscription_payment_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (data) {
      setConfig(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);

    const { error } = await supabase
      .from('subscription_payment_config')
      .update({
        pix_key: config.pix_key,
        pix_key_type: config.pix_key_type,
        account_holder_name: config.account_holder_name,
        payment_instructions: config.payment_instructions,
        enable_manual_approval: config.enable_manual_approval,
        enable_auto_approval: config.enable_auto_approval,
        bank_name: config.bank_name,
        agency: config.agency,
        account_number: config.account_number,
      })
      .eq('id', config.id);

    if (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } else {
      toast.success("Configurações salvas com sucesso!");
    }

    setSaving(false);
  };

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!config) {
    return <div className="p-6">Nenhuma configuração encontrada</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Configurações de Pagamento</h1>
        <p className="text-muted-foreground">Configure os métodos de pagamento para assinaturas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Dados para Recebimento via PIX
          </CardTitle>
          <CardDescription>
            Configure a chave PIX que será exibida para os lojistas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Chave PIX</Label>
              <Select
                value={config.pix_key_type}
                onValueChange={(value) => setConfig({ ...config, pix_key_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input
                value={config.pix_key}
                onChange={(e) => setConfig({ ...config, pix_key: e.target.value })}
                placeholder="Digite a chave PIX"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome do Titular</Label>
            <Input
              value={config.account_holder_name}
              onChange={(e) => setConfig({ ...config, account_holder_name: e.target.value })}
              placeholder="Nome completo do titular da conta"
            />
          </div>

          <div className="space-y-2">
            <Label>Instruções de Pagamento</Label>
            <Textarea
              value={config.payment_instructions || ''}
              onChange={(e) => setConfig({ ...config, payment_instructions: e.target.value })}
              placeholder="Instruções adicionais para o pagamento (opcional)"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Estas instruções serão exibidas para o lojista no momento do pagamento
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados Bancários (Opcional)</CardTitle>
          <CardDescription>
            Informações adicionais sobre a conta bancária
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Banco</Label>
            <Input
              value={config.bank_name || ''}
              onChange={(e) => setConfig({ ...config, bank_name: e.target.value })}
              placeholder="Ex: Banco do Brasil"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Agência</Label>
              <Input
                value={config.agency || ''}
                onChange={(e) => setConfig({ ...config, agency: e.target.value })}
                placeholder="0000"
              />
            </div>

            <div className="space-y-2">
              <Label>Número da Conta</Label>
              <Input
                value={config.account_number || ''}
                onChange={(e) => setConfig({ ...config, account_number: e.target.value })}
                placeholder="00000-0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Aprovação</CardTitle>
          <CardDescription>
            Defina como os pagamentos serão aprovados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aprovação Manual</Label>
              <p className="text-sm text-muted-foreground">
                Você precisará aprovar cada pagamento manualmente
              </p>
            </div>
            <Switch
              checked={config.enable_manual_approval}
              onCheckedChange={(checked) => 
                setConfig({ ...config, enable_manual_approval: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Aprovação Automática</Label>
              <p className="text-sm text-muted-foreground">
                Pagamentos serão aprovados automaticamente (requer integração)
              </p>
            </div>
            <Switch
              checked={config.enable_auto_approval}
              onCheckedChange={(checked) => 
                setConfig({ ...config, enable_auto_approval: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
