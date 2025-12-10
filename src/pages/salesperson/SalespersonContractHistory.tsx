import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Eye, QrCode, Loader2, CheckCircle2 } from "lucide-react";
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

export default function SalespersonContractHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const contractRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSalespersonAndContracts();
    }
  }, [user]);

  const fetchSalespersonAndContracts = async () => {
    try {
      setLoading(true);
      
      // Get salesperson ID
      const { data: salesperson, error: spError } = await supabase
        .from("salespeople")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (spError) throw spError;

      // Get contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from("salesperson_contracts")
        .select("id, version, accepted_at, ip_address, user_agent, verification_hash, salesperson_name, salesperson_cnpj, contract_template_id, contract_text")
        .eq("salesperson_id", salesperson.id)
        .order("accepted_at", { ascending: false });

      if (contractsError) throw contractsError;

      setContracts(contractsData || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = async (contract: Contract) => {
    try {
      // Fetch the template used for this contract
      let templateData: ContractTemplate | null = null;

      if (contract.contract_template_id) {
        const { data, error } = await supabase
          .from("salesperson_contract_templates")
          .select("*")
          .eq("id", contract.contract_template_id)
          .single();

        if (!error) templateData = data;
      }

      // If no specific template, get the active one
      if (!templateData) {
        const { data, error } = await supabase
          .from("salesperson_contract_templates")
          .select("*")
          .eq("is_active", true)
          .single();

        if (!error) templateData = data;
      }

      setTemplate(templateData);
      setSelectedContract(contract);
      setShowViewer(true);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o contrato",
        variant: "destructive",
      });
    }
  };

  const getFormattedContractText = () => {
    if (!selectedContract) return "";

    // Use the contract's stored text if available
    if (selectedContract.contract_text) {
      return selectedContract.contract_text;
    }

    // Fallback to template
    if (!template) return "";

    return template.contract_text
      .replace(/{empresa}/g, template.company_name)
      .replace(/{cnpj}/g, template.company_cnpj)
      .replace(/{cidade}/g, template.company_city)
      .replace(/{estado}/g, template.company_state || "")
      .replace(/{vendedor_nome}/g, selectedContract.salesperson_name || "")
      .replace(/{vendedor_cnpj}/g, selectedContract.salesperson_cnpj || "")
      .replace(/{comissao_percentual}/g, "10")
      .replace(/{tabela_bonus}/g, "Conforme configuração vigente")
      .replace(/{data_aceite}/g, new Date(selectedContract.accepted_at).toLocaleString("pt-BR"))
      .replace(/{ip_aceite}/g, selectedContract.ip_address || "")
      .replace(/{hash_verificacao}/g, selectedContract.verification_hash || "");
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
      <div>
        <h1 className="text-2xl font-bold">Histórico de Contratos</h1>
        <p className="text-muted-foreground">
          Visualize e baixe os contratos que você aceitou
        </p>
      </div>

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
        <div className="space-y-4">
          {contracts.map((contract) => (
            <Card key={contract.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          Contrato v{contract.version}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Aceito
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Aceito em:{" "}
                        {new Date(contract.accepted_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {contract.verification_hash && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={`/verificar-contrato?hash=${contract.verification_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          Verificar
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleViewContract(contract)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>

                {contract.verification_hash && (
                  <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Hash:</span>
                    <code className="bg-muted px-2 py-1 rounded">
                      {contract.verification_hash.substring(0, 24)}...
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contract Viewer Dialog */}
      <Dialog open={showViewer} onOpenChange={setShowViewer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contrato v{selectedContract?.version}
            </DialogTitle>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedContract.verification_hash && (
                    <ContractQRCode
                      verificationHash={selectedContract.verification_hash}
                      size={80}
                    />
                  )}
                </div>
                <ContractPDFDownload
                  contractRef={contractRef}
                  fileName={`contrato-${selectedContract.version}`}
                />
              </div>

              <div ref={contractRef}>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
