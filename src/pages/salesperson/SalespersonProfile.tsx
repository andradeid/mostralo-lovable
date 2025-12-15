import { useEffect, useState } from "react";
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
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const cnpjData = salesperson?.cnpj_validation_data;

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Meu Perfil</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie suas informações pessoais
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">Informações Pessoais</CardTitle>
            <CardDescription className="text-xs md:text-sm">Seus dados cadastrais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="grid gap-1 md:gap-2">
              <Label className="text-xs md:text-sm">Nome Completo</Label>
              <Input value={salesperson?.full_name || ""} disabled className="h-9 md:h-10 text-sm" />
            </div>

            <div className="grid gap-1 md:gap-2">
              <Label className="text-xs md:text-sm">Email</Label>
              <Input value={salesperson?.email || ""} disabled className="h-9 md:h-10 text-sm" />
            </div>

            <div className="grid gap-1 md:gap-2">
              <Label className="text-xs md:text-sm">Telefone</Label>
              <Input value={salesperson?.phone || ""} disabled className="h-9 md:h-10 text-sm" />
            </div>

            <div className="grid gap-1 md:gap-2">
              <Label className="text-xs md:text-sm">Código de Referência</Label>
              <Input 
                value={salesperson?.referral_code || ""} 
                disabled 
                className="font-mono h-9 md:h-10 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">Dados do CNPJ</CardTitle>
            <CardDescription className="text-xs md:text-sm">Informações da Receita Federal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="grid gap-1 md:gap-2">
              <Label className="text-xs md:text-sm">CNPJ</Label>
              <Input value={salesperson?.cnpj || ""} disabled className="h-9 md:h-10 text-sm" />
            </div>

            {cnpjData && (
              <>
                <div className="grid gap-1 md:gap-2">
                  <Label className="text-xs md:text-sm">Razão Social</Label>
                  <Input value={cnpjData.razao_social || ""} disabled className="h-9 md:h-10 text-sm" />
                </div>

                <div className="grid gap-1 md:gap-2">
                  <Label className="text-xs md:text-sm">Nome Fantasia</Label>
                  <Input value={cnpjData.nome_fantasia || ""} disabled className="h-9 md:h-10 text-sm" />
                </div>

                <div className="grid gap-1 md:gap-2">
                  <Label className="text-xs md:text-sm">Situação Cadastral</Label>
                  <Input value={cnpjData.situacao_cadastral || ""} disabled className="h-9 md:h-10 text-sm" />
                </div>

                <div className="grid gap-1 md:gap-2">
                  <Label className="text-xs md:text-sm">CNAEs</Label>
                  <Input 
                    value={salesperson?.cnae_codes?.join(', ') || ""} 
                    disabled 
                    className="h-9 md:h-10 text-sm"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">Chave PIX para Pagamentos</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Informe sua chave PIX para receber as comissões
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="grid gap-1 md:gap-2">
              <Label htmlFor="pix-key" className="text-xs md:text-sm">Chave PIX</Label>
              <Input
                id="pix-key"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
                className="h-9 md:h-10 text-sm"
              />
            </div>

            <Button
              onClick={handleSavePixKey}
              disabled={saving || !pixKey}
              className="w-full md:w-auto"
            >
              {saving ? 'Salvando...' : 'Salvar Chave PIX'}
            </Button>
          </CardContent>
        </Card>
    </div>
  );
}
