import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SalespersonLayout } from "@/components/salesperson/SalespersonLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, ExternalLink, Loader2, Building2, User, Sparkles } from "lucide-react";

export default function SalespersonUpgrade() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cnpj, setCnpj] = useState("");
  const [validating, setValidating] = useState(false);
  const [cnpjData, setCnpjData] = useState<any>(null);

  const { data: salesperson, isLoading } = useQuery({
    queryKey: ["salesperson-upgrade", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  const handleValidateCNPJ = async () => {
    const cleanCNPJ = cnpj.replace(/\D/g, "");
    if (cleanCNPJ.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }

    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-cnpj", {
        body: { cnpj: cleanCNPJ },
      });

      if (error) throw error;

      if (!data.valid) {
        toast.error(data.message || "CNPJ inválido");
        return;
      }

      setCnpjData(data.data);
      toast.success("CNPJ validado com sucesso!");
    } catch (error) {
      console.error("Erro ao validar CNPJ:", error);
      toast.error("Erro ao validar CNPJ");
    } finally {
      setValidating(false);
    }
  };

  const handleUpgrade = async () => {
    if (!cnpjData || !salesperson) return;

    try {
      const cleanCNPJ = cnpj.replace(/\D/g, "");
      
      const { error } = await supabase
        .from("salespeople")
        .update({
          salesperson_type: "partner",
          cnpj: cleanCNPJ,
          company_name: cnpjData.razao_social,
          company_trade_name: cnpjData.nome_fantasia,
          cnpj_validation_data: cnpjData,
          cnae_codes: [
            cnpjData.cnae_fiscal?.toString(),
            ...(cnpjData.cnaes_secundarios?.map((c: any) => c.codigo?.toString()) || []),
          ].filter(Boolean),
          monthly_earnings_limit: null,
          bonus_eligible: true,
        })
        .eq("id", salesperson.id);

      if (error) throw error;

      toast.success("Upgrade realizado com sucesso! Agora você é Parceiro PJ.");
      navigate("/vendedor");
    } catch (error) {
      console.error("Erro ao fazer upgrade:", error);
      toast.error("Erro ao realizar upgrade");
    }
  };

  if (isLoading) {
    return (
      <SalespersonLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </SalespersonLayout>
    );
  }

  // Já é parceiro PJ
  if (salesperson?.salesperson_type === "partner") {
    return (
      <SalespersonLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle>Você já é Parceiro PJ!</CardTitle>
              <CardDescription>
                Você já possui todos os benefícios do programa de parceiros.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate("/vendedor")}>
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </SalespersonLayout>
    );
  }

  return (
    <SalespersonLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Upgrade para Parceiro PJ</h1>
          <p className="text-muted-foreground">
            Aumente seus ganhos com comissões maiores e bônus trimestrais
          </p>
        </div>

        {/* Comparativo */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-muted">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary">Atual</Badge>
              </div>
              <CardTitle>Afiliado (CPF)</CardTitle>
              <CardDescription>Seu plano atual</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Comissão de 5-7%
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Pagamento via PIX
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  ⚠️ Limite: R$ 1.900/mês
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  ❌ Sem bônus trimestral
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-orange-500 text-white px-4 py-1 text-xs font-bold">
              RECOMENDADO
            </div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <Badge className="bg-gradient-to-r from-primary to-orange-500">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Upgrade
                </Badge>
              </div>
              <CardTitle>Parceiro PJ (CNPJ)</CardTitle>
              <CardDescription>Ganhe muito mais</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <strong>Comissão de 10%</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <strong>Ganhos ilimitados</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Bônus até R$ 8.500/trimestre
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Contrato formal
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de CNPJ */}
        <Card>
          <CardHeader>
            <CardTitle>Informe seu CNPJ</CardTitle>
            <CardDescription>
              Se você já tem MEI ou empresa, informe o CNPJ para fazer o upgrade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  maxLength={18}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleValidateCNPJ} 
                  disabled={validating || cnpj.replace(/\D/g, "").length !== 14}
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Validar"
                  )}
                </Button>
              </div>
            </div>

            {cnpjData && (
              <Alert className="bg-green-500/10 border-green-500">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <strong>CNPJ Válido!</strong>
                  <br />
                  Razão Social: {cnpjData.razao_social}
                  <br />
                  Situação: {cnpjData.situacao_cadastral}
                </AlertDescription>
              </Alert>
            )}

            {cnpjData && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleUpgrade}
              >
                Confirmar Upgrade para Parceiro PJ
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* CTA para abrir MEI */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="font-semibold">Ainda não tem CNPJ?</h3>
              <p className="text-sm text-muted-foreground">
                Abrir um MEI é gratuito e leva apenas alguns minutos. 
                Com o MEI você pode ganhar até R$ 81.000 por ano.
              </p>
              <Button variant="outline" asChild>
                <a 
                  href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor" 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir MEI Gratuitamente
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SalespersonLayout>
  );
}