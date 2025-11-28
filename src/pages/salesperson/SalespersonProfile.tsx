import { useEffect, useState } from "react";
import { SalespersonLayout } from "@/components/salesperson/SalespersonLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function SalespersonProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salesperson, setSalesperson] = useState<any>(null);
  const [pixKey, setPixKey] = useState("");

  useEffect(() => {
    if (user) {
      loadSalespersonData();
    }
  }, [user]);

  const loadSalespersonData = async () => {
    try {
      const { data, error } = await supabase
        .from('salespeople')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setSalesperson(data);
      setPixKey(data.pix_key || "");
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePixKey = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('salespeople')
        .update({ pix_key: pixKey })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Chave PIX atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar chave PIX:', error);
      toast.error('Erro ao atualizar chave PIX');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SalespersonLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </SalespersonLayout>
    );
  }

  const cnpjData = salesperson?.cnpj_validation_data;

  return (
    <SalespersonLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Seus dados cadastrais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Nome Completo</Label>
              <Input value={salesperson?.full_name || ""} disabled />
            </div>

            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={salesperson?.email || ""} disabled />
            </div>

            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input value={salesperson?.phone || ""} disabled />
            </div>

            <div className="grid gap-2">
              <Label>Código de Referência</Label>
              <Input 
                value={salesperson?.referral_code || ""} 
                disabled 
                className="font-mono"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do CNPJ</CardTitle>
            <CardDescription>Informações da Receita Federal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>CNPJ</Label>
              <Input value={salesperson?.cnpj || ""} disabled />
            </div>

            {cnpjData && (
              <>
                <div className="grid gap-2">
                  <Label>Razão Social</Label>
                  <Input value={cnpjData.razao_social || ""} disabled />
                </div>

                <div className="grid gap-2">
                  <Label>Nome Fantasia</Label>
                  <Input value={cnpjData.nome_fantasia || ""} disabled />
                </div>

                <div className="grid gap-2">
                  <Label>Situação Cadastral</Label>
                  <Input value={cnpjData.situacao_cadastral || ""} disabled />
                </div>

                <div className="grid gap-2">
                  <Label>CNAEs</Label>
                  <Input 
                    value={salesperson?.cnae_codes?.join(', ') || ""} 
                    disabled 
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chave PIX para Pagamentos</CardTitle>
            <CardDescription>
              Informe sua chave PIX para receber as comissões
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pix-key">Chave PIX</Label>
              <Input
                id="pix-key"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Digite sua chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)"
              />
            </div>

            <Button
              onClick={handleSavePixKey}
              disabled={saving || !pixKey}
            >
              {saving ? 'Salvando...' : 'Salvar Chave PIX'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </SalespersonLayout>
  );
}
