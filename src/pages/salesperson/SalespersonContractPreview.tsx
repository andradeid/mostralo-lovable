import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ContractViewer } from "@/components/contract/ContractViewer";
import { Loader2, Building2, User, Percent, Trophy, FileText, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SalespersonLayout } from "@/components/salesperson/SalespersonLayout";

interface BonusTier {
  tier_name: string;
  min_sales: number;
  bonus_amount: number;
}

interface ContractTemplate {
  id: string;
  version: string;
  contract_text: string;
  company_name: string;
  company_cnpj: string;
  company_address: string | null;
  company_city: string;
  company_state: string | null;
}

interface Salesperson {
  id: string;
  full_name: string;
  cnpj: string | null;
  company_name: string | null;
  status: string;
}

export default function SalespersonContractPreview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [salesperson, setSalesperson] = useState<Salesperson | null>(null);
  const [bonusTiers, setBonusTiers] = useState<BonusTier[]>([]);
  const [commissionValue, setCommissionValue] = useState<number>(10);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch salesperson data
      const { data: spData, error: spError } = await supabase
        .from("salespeople")
        .select("id, full_name, cnpj, company_name, status")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (spError) throw spError;
      if (!spData) {
        toast.error("Vendedor não encontrado");
        return;
      }
      setSalesperson(spData);

      // Fetch active template
      const { data: templateData, error: templateError } = await supabase
        .from("salesperson_contract_templates")
        .select("id, version, contract_text, company_name, company_cnpj, company_address, company_city, company_state")
        .eq("is_active", true)
        .maybeSingle();

      if (templateError) throw templateError;
      setTemplate(templateData);

      // Fetch bonus tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from("salesperson_bonus_tiers")
        .select("tier_name, min_sales, bonus_amount")
        .eq("is_active", true)
        .order("min_sales", { ascending: true });

      if (tiersError) throw tiersError;
      setBonusTiers(tiersData || []);

      // Fetch commission config for this salesperson
      if (spData) {
        const { data: commissionData } = await supabase
          .from("salesperson_commission_configs")
          .select("commission_value")
          .eq("salesperson_id", spData.id)
          .eq("is_active", true)
          .maybeSingle();

        if (commissionData) {
          setCommissionValue(commissionData.commission_value);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do contrato");
    } finally {
      setLoading(false);
    }
  };

  const getFormattedContractText = () => {
    if (!template?.contract_text) return "";

    const bronzeTier = bonusTiers.find(t => t.tier_name.toLowerCase().includes("bronze"));
    const prataTier = bonusTiers.find(t => t.tier_name.toLowerCase().includes("prata"));
    const ouroTier = bonusTiers.find(t => t.tier_name.toLowerCase().includes("ouro"));
    const diamanteTier = bonusTiers.find(t => t.tier_name.toLowerCase().includes("diamante"));

    return template.contract_text
      .replace(/{empresa}/g, template.company_name || "")
      .replace(/{cnpj}/g, template.company_cnpj || "")
      .replace(/{endereco}/g, template.company_address || "")
      .replace(/{cidade}/g, template.company_city || "")
      .replace(/{estado}/g, template.company_state || "")
      .replace(/{vendedor_nome}/g, salesperson?.full_name || "")
      .replace(/{vendedor_cnpj}/g, salesperson?.cnpj || "")
      .replace(/{comissao_percentual}/g, String(commissionValue))
      .replace(/{bonus_bronze}/g, bronzeTier ? bronzeTier.bonus_amount.toLocaleString("pt-BR") : "500")
      .replace(/{bonus_bronze_meta}/g, bronzeTier ? String(bronzeTier.min_sales) : "10")
      .replace(/{bonus_prata}/g, prataTier ? prataTier.bonus_amount.toLocaleString("pt-BR") : "1.000")
      .replace(/{bonus_prata_meta}/g, prataTier ? String(prataTier.min_sales) : "20")
      .replace(/{bonus_ouro}/g, ouroTier ? ouroTier.bonus_amount.toLocaleString("pt-BR") : "2.000")
      .replace(/{bonus_ouro_meta}/g, ouroTier ? String(ouroTier.min_sales) : "30")
      .replace(/{bonus_diamante}/g, diamanteTier ? diamanteTier.bonus_amount.toLocaleString("pt-BR") : "5.000")
      .replace(/{bonus_diamante_meta}/g, diamanteTier ? String(diamanteTier.min_sales) : "50")
      .replace(/{data_aceite}/g, new Date().toLocaleString("pt-BR"))
      .replace(/{ip_aceite}/g, "[será registrado ao aceitar]")
      .replace(/{hash_verificacao}/g, "[será gerado ao aceitar]");
  };

  const handleAcceptContract = async () => {
    if (!agreed) {
      toast.error("Você precisa concordar com os termos para continuar");
      return;
    }

    setAccepting(true);
    try {
      const { data, error } = await supabase.functions.invoke("accept-salesperson-contract", {
        body: {}
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Contrato aceito com sucesso!");
        navigate("/vendedor/contratos");
      } else {
        throw new Error(data?.error || "Erro ao aceitar contrato");
      }
    } catch (error: any) {
      console.error("Erro ao aceitar contrato:", error);
      toast.error(error.message || "Erro ao aceitar contrato");
    } finally {
      setAccepting(false);
    }
  };

  const getTierColor = (tierName: string) => {
    const name = tierName.toLowerCase();
    if (name.includes("bronze")) return "bg-amber-600";
    if (name.includes("prata")) return "bg-slate-400";
    if (name.includes("ouro")) return "bg-yellow-500";
    if (name.includes("diamante")) return "bg-cyan-400";
    return "bg-primary";
  };

  if (loading) {
    return (
      <SalespersonLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SalespersonLayout>
    );
  }

  if (!template) {
    return (
      <SalespersonLayout>
        <div className="container max-w-4xl mx-auto p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Nenhum contrato disponível</h2>
              <p className="text-muted-foreground">
                Não há modelo de contrato ativo no momento.
              </p>
            </CardContent>
          </Card>
        </div>
      </SalespersonLayout>
    );
  }

  const canAccept = salesperson?.status === "pending_contract" || salesperson?.status === "active";

  return (
    <SalespersonLayout>
      <div className="container max-w-5xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Prévia do Contrato
            </h1>
            <p className="text-muted-foreground">
              Revise todos os dados antes de aceitar o contrato versão {template.version}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Company Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Contratante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Empresa:</span>
                <p className="font-medium">{template.company_name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">CNPJ:</span>
                <p className="font-medium">{template.company_cnpj || "Não informado"}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Localização:</span>
                <p className="font-medium">
                  {template.company_city}{template.company_state ? `/${template.company_state}` : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Salesperson Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Você (Contratado)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Nome:</span>
                <p className="font-medium">{salesperson?.full_name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">CNPJ:</span>
                <p className="font-medium">{salesperson?.cnpj || "Não informado"}</p>
              </div>
              {salesperson?.company_name && (
                <div>
                  <span className="text-sm text-muted-foreground">Empresa:</span>
                  <p className="font-medium">{salesperson.company_name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Commission Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="h-5 w-5 text-green-500" />
              Remuneração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-green-500">{commissionValue}%</div>
              <div className="text-muted-foreground">
                Comissão sobre cada assinatura recorrente dos clientes que você indicar
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bonus Tiers Card */}
        {bonusTiers.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Bônus Trimestrais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {bonusTiers.map((tier) => (
                  <div
                    key={tier.tier_name}
                    className="text-center p-4 rounded-lg border bg-card"
                  >
                    <div className={`w-12 h-12 mx-auto rounded-full ${getTierColor(tier.tier_name)} flex items-center justify-center mb-2`}>
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold">{tier.tier_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {tier.min_sales} vendas
                    </p>
                    <p className="text-lg font-bold text-green-500">
                      R$ {tier.bonus_amount.toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full Contract */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contrato Completo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContractViewer
              contractText={getFormattedContractText()}
              companyName={template.company_name}
              companyCnpj={template.company_cnpj || ""}
              companyCity={template.company_city}
              companyState={template.company_state || ""}
              version={template.version}
              salespersonName={salesperson?.full_name}
              salespersonCnpj={salesperson?.cnpj || undefined}
            />
          </CardContent>
        </Card>

        {/* Accept Section */}
        {canAccept && (
          <Card className="border-primary">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                />
                <label htmlFor="agree" className="text-sm cursor-pointer">
                  Li e concordo com todos os termos e condições descritos neste contrato.
                  Declaro que as informações fornecidas são verdadeiras e que possuo
                  CNPJ ativo com CNAE compatível conforme exigido.
                </label>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleAcceptContract}
                disabled={!agreed || accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aceitar Contrato
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                Ao aceitar, seu IP, data/hora e agente do navegador serão registrados
                para fins de auditoria e validade jurídica.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </SalespersonLayout>
  );
}
