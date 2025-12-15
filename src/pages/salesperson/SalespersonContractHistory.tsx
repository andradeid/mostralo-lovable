import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  FileText, 
  Loader2, 
  CheckCircle2, 
  Calendar, 
  Globe, 
  Monitor,
  Shield,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ContractViewer } from "@/components/contract/ContractViewer";
import { ContractQRCode } from "@/components/contract/ContractQRCode";
import { ContractPDFDownload } from "@/components/contract/ContractPDFDownload";

interface Contract {
  id: string;
  version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  verification_hash: string | null;
  salesperson_name: string | null;
  salesperson_cnpj: string | null;
  contract_template_id: string | null;
  contract_text: string;
}

interface ContractTemplate {
  id: string;
  version: string;
  company_name: string;
  company_cnpj: string;
  company_address: string | null;
  company_city: string;
  company_state: string | null;
  contract_text: string;
}

interface BonusTier {
  tier_name: string;
  min_sales: number;
  bonus_amount: number;
}

interface ActivityRules {
  tier_full_commission: number;
  tier_reduced_commission: number;
  tier_minimum_commission: number;
  full_commission_percentage: number;
  reduced_commission_percentage: number;
  minimum_commission_percentage: number;
  grace_period_days: number;
  evaluation_period: string;
}

export default function SalespersonContractHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const contractRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [activeTemplateVersion, setActiveTemplateVersion] = useState<string | null>(null);
  const [acceptingContract, setAcceptingContract] = useState(false);
  const [bonusTiers, setBonusTiers] = useState<BonusTier[]>([]);
  const [commissionValue, setCommissionValue] = useState<number>(10);
  const [activityRules, setActivityRules] = useState<ActivityRules | null>(null);

  useEffect(() => {
    if (user) {
      fetchSalespersonAndContracts();
    }
  }, [user]);

  // Auto-select first contract when loaded
  useEffect(() => {
    if (contracts.length > 0 && !selectedContract) {
      handleSelectContract(contracts[0]);
    }
  }, [contracts]);

  const fetchSalespersonAndContracts = async () => {
    try {
      setLoading(true);
      
      // Buscar versão ativa do template
      const { data: activeTemplate } = await supabase
        .from("salesperson_contract_templates")
        .select("version")
        .eq("is_active", true)
        .single();
      
      setActiveTemplateVersion(activeTemplate?.version || null);
      
      const { data: salesperson, error: spError } = await supabase
        .from("salespeople")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (spError) throw spError;

      // Buscar contratos
      const { data: contractsData, error: contractsError } = await supabase
        .from("salesperson_contracts")
        .select("id, version, accepted_at, ip_address, user_agent, verification_hash, salesperson_name, salesperson_cnpj, contract_template_id, contract_text")
        .eq("salesperson_id", salesperson.id)
        .order("accepted_at", { ascending: false });

      if (contractsError) throw contractsError;

      setContracts(contractsData || []);

      // Buscar bonus tiers
      const { data: tiersData } = await supabase
        .from("salesperson_bonus_tiers")
        .select("tier_name, min_sales, bonus_amount")
        .eq("is_active", true)
        .order("min_sales", { ascending: true });
      setBonusTiers(tiersData || []);

      // Buscar comissão do vendedor (se configurada)
      const { data: commissionData } = await supabase
        .from("salesperson_commission_configs")
        .select("commission_value")
        .eq("salesperson_id", salesperson.id)
        .eq("is_active", true)
        .maybeSingle();
      if (commissionData) setCommissionValue(commissionData.commission_value);

      // Buscar regras de manutenção de carteira
      const { data: rulesData } = await supabase
        .from("salesperson_activity_rules")
        .select("tier_full_commission, tier_reduced_commission, tier_minimum_commission, full_commission_percentage, reduced_commission_percentage, minimum_commission_percentage, grace_period_days, evaluation_period")
        .eq("is_active", true)
        .maybeSingle();
      setActivityRules(rulesData);

    } catch (error: any) {
      console.error("Erro ao buscar contratos:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasNewVersionAvailable = () => {
    if (!activeTemplateVersion || contracts.length === 0) return false;
    return !contracts.some(c => c.version === activeTemplateVersion);
  };

  const handleAcceptNewVersion = async () => {
    try {
      setAcceptingContract(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const response = await supabase.functions.invoke("accept-salesperson-contract", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      if (!response.data?.success) throw new Error(response.data?.error || "Erro ao aceitar contrato");

      toast({
        title: "Sucesso!",
        description: "Nova versão do contrato aceita com sucesso",
      });

      // Recarregar contratos
      fetchSalespersonAndContracts();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAcceptingContract(false);
    }
  };

  const handleSelectContract = async (contract: Contract) => {
    setSelectedContract(contract);
    setLoadingTemplate(true);
    
    try {
      let templateData: ContractTemplate | null = null;

      if (contract.contract_template_id) {
        const { data, error } = await supabase
          .from("salesperson_contract_templates")
          .select("*")
          .eq("id", contract.contract_template_id)
          .single();

        if (!error) templateData = data;
      }

      if (!templateData) {
        const { data, error } = await supabase
          .from("salesperson_contract_templates")
          .select("*")
          .eq("is_active", true)
          .single();

        if (!error) templateData = data;
      }

      setTemplate(templateData);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o template do contrato",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplate(false);
    }
  };

  const generateBonusTable = () => {
    if (bonusTiers.length === 0) return "";
    let table = "| Faixa | Meta de Vendas | Bônus |\n|-------|----------------|-------|\n";
    bonusTiers.forEach(tier => {
      table += `| ${tier.tier_name} | ${tier.min_sales} vendas | R$ ${tier.bonus_amount.toLocaleString("pt-BR")} |\n`;
    });
    return table;
  };

  const generateMaintenanceTable = () => {
    if (!activityRules) return "";
    const r = activityRules;
    let table = "| Clientes Ativos | Comissão |\n|-----------------|----------|\n";
    table += `| ${r.tier_full_commission}+ clientes | ${r.full_commission_percentage}% (integral) |\n`;
    table += `| ${r.tier_reduced_commission}-${r.tier_full_commission - 1} clientes | ${r.reduced_commission_percentage}% (reduzida) |\n`;
    table += `| ${r.tier_minimum_commission}-${r.tier_reduced_commission - 1} clientes | ${r.minimum_commission_percentage}% (mínima) |\n`;
    table += `| 0 clientes | 0% (suspensa) |\n`;
    return table;
  };

  const getFormattedContractText = () => {
    if (!selectedContract) return "";

    // Pegar texto do contrato salvo OU do template
    let text = selectedContract.contract_text || template?.contract_text || "";
    
    if (!text) return "";

    // Buscar valores dos tiers de bônus
    const bronzeTier = bonusTiers.find(t => t.tier_name.toLowerCase().includes("bronze"));
    const prataTier = bonusTiers.find(t => t.tier_name.toLowerCase().includes("prata"));
    const ouroTier = bonusTiers.find(t => t.tier_name.toLowerCase().includes("ouro"));
    const diamanteTier = bonusTiers.find(t => t.tier_name.toLowerCase().includes("diamante"));

    // SEMPRE substituir placeholders pelos dados reais
    return text
      .replace(/{empresa}/g, template?.company_name || "Mostralo Tecnologia LTDA")
      .replace(/{cnpj}/g, template?.company_cnpj || "51.691.995/0001-15")
      .replace(/{endereco}/g, template?.company_address || "")
      .replace(/{cidade}/g, template?.company_city || "São Paulo")
      .replace(/{estado}/g, template?.company_state || "SP")
      .replace(/{vendedor_nome}/g, selectedContract.salesperson_name || "")
      .replace(/{vendedor_cnpj}/g, selectedContract.salesperson_cnpj || "")
      .replace(/{comissao_percentual}/g, String(commissionValue))
      .replace(/{bonus_bronze}/g, bronzeTier?.bonus_amount?.toLocaleString("pt-BR") || "500")
      .replace(/{bonus_bronze_meta}/g, String(bronzeTier?.min_sales || 10))
      .replace(/{bonus_prata}/g, prataTier?.bonus_amount?.toLocaleString("pt-BR") || "1.000")
      .replace(/{bonus_prata_meta}/g, String(prataTier?.min_sales || 20))
      .replace(/{bonus_ouro}/g, ouroTier?.bonus_amount?.toLocaleString("pt-BR") || "2.000")
      .replace(/{bonus_ouro_meta}/g, String(ouroTier?.min_sales || 30))
      .replace(/{bonus_diamante}/g, diamanteTier?.bonus_amount?.toLocaleString("pt-BR") || "5.000")
      .replace(/{bonus_diamante_meta}/g, String(diamanteTier?.min_sales || 50))
      .replace(/{tabela_bonus}/g, generateBonusTable())
      .replace(/{faixas_manutencao}/g, generateMaintenanceTable())
      .replace(/{data_aceite}/g, new Date(selectedContract.accepted_at).toLocaleString("pt-BR"))
      .replace(/{ip_aceite}/g, selectedContract.ip_address || "")
      .replace(/{hash_verificacao}/g, selectedContract.verification_hash || "");
  };

  const formatUserAgent = (userAgent: string | null) => {
    if (!userAgent) return "Não disponível";
    
    // Simplified browser/OS detection
    let browser = "Navegador desconhecido";
    let os = "Sistema desconhecido";
    
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";
    
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
    
    return `${browser} / ${os}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico de Contratos</h1>
          <p className="text-muted-foreground">
            Visualize e baixe os contratos que você aceitou
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSalespersonAndContracts}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Alerta de nova versão disponível */}
      {hasNewVersionAvailable() && (
        <Alert className="border-primary/50 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Nova versão disponível!</AlertTitle>
          <AlertDescription className="mt-2">
            <span className="block mb-3">
              Uma nova versão do contrato (v{activeTemplateVersion}) está disponível para aceite.
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/vendedor/contrato/previa")}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Prévia
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptNewVersion}
                disabled={acceptingContract}
              >
                {acceptingContract ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Aceitar Nova Versão
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium">Nenhum contrato encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Você ainda não aceitou nenhum contrato
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Contratos (1/3) */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                Contratos Aceitos ({contracts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-1 p-3">
                  {contracts.map((contract) => (
                    <button
                      key={contract.id}
                      onClick={() => handleSelectContract(contract)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedContract?.id === contract.id
                          ? "bg-primary/10 border border-primary"
                          : "hover:bg-muted border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">
                            v{contract.version}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs h-5">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                          Aceito
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 pl-6">
                        {new Date(contract.accepted_at).toLocaleDateString("pt-BR")}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Detalhes do Contrato (2/3) */}
          <Card className="lg:col-span-2">
            {selectedContract ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Contrato v{selectedContract.version}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {selectedContract.verification_hash && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`/verificar-contrato?hash=${selectedContract.verification_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Verificar
                          </a>
                        </Button>
                      )}
                      <ContractPDFDownload
                        contractRef={contractRef}
                        fileName={`contrato-${selectedContract.version}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Informações do Aceite */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Data do Aceite</p>
                        <p className="text-sm font-medium">
                          {new Date(selectedContract.accepted_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          às {new Date(selectedContract.accepted_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Endereço IP</p>
                        <p className="text-sm font-medium font-mono">
                          {selectedContract.ip_address || "Não disponível"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Monitor className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Navegador / Dispositivo</p>
                        <p className="text-sm font-medium">
                          {formatUserAgent(selectedContract.user_agent)}
                        </p>
                      </div>
                    </div>

                    {selectedContract.verification_hash && (
                      <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-green-700 dark:text-green-400 font-medium">Hash de Verificação</p>
                          <p className="text-xs font-mono text-green-800 dark:text-green-300 break-all">
                            {selectedContract.verification_hash}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR Code */}
                  {selectedContract.verification_hash && (
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <ContractQRCode
                        verificationHash={selectedContract.verification_hash}
                        size={80}
                      />
                      <div>
                        <p className="text-sm font-medium">QR Code de Verificação</p>
                        <p className="text-xs text-muted-foreground">
                          Escaneie para verificar a autenticidade do contrato
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Visualização do Contrato */}
                  <div className="border rounded-lg">
                    <div className="p-3 bg-muted/50 border-b">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Conteúdo do Contrato
                      </h4>
                    </div>
                    {loadingTemplate ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div ref={contractRef} className="max-h-[400px] overflow-y-auto">
                        <ContractViewer
                          contractText={getFormattedContractText()}
                          companyName={template?.company_name || "Mostralo"}
                          companyCnpj={template?.company_cnpj || ""}
                          companyCity={template?.company_city || ""}
                          companyState={template?.company_state || ""}
                          version={selectedContract.version}
                          salespersonName={selectedContract.salesperson_name || undefined}
                          salespersonCnpj={selectedContract.salesperson_cnpj || undefined}
                          acceptedAt={new Date(selectedContract.accepted_at).toLocaleString("pt-BR")}
                          verificationHash={selectedContract.verification_hash || undefined}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="py-20 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Selecione um contrato para ver os detalhes
                </p>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
