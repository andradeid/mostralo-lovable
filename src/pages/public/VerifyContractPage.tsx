import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Shield, Home, Loader2, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ContractVerification {
  id: string;
  version: string;
  accepted_at: string;
  holder_name: string | null;
  holder_document: string | null;
  ip_address: string | null;
  contract_type: 'merchant' | 'salesperson';
}

export default function VerifyContractPage() {
  const [searchParams] = useSearchParams();
  const hash = searchParams.get("hash");
  
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<ContractVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hash) {
      verifyContract();
    } else {
      setLoading(false);
      setError("Hash de verificação não fornecido");
    }
  }, [hash]);

  const verifyContract = async () => {
    try {
      setLoading(true);
      
      // Primeiro, buscar em merchant_contract_acceptance (lojistas)
      const { data: merchantData, error: merchantError } = await supabase
        .from("merchant_contract_acceptance")
        .select("id, contract_version, accepted_at, ip_address, user_id")
        .eq("verification_hash", hash)
        .maybeSingle();

      if (merchantData) {
        // Buscar dados do profile para exibir nome
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", merchantData.user_id)
          .maybeSingle();

        // Buscar dados da loja se existir
        const { data: storeData } = await supabase
          .from("stores")
          .select("responsible_cpf, name")
          .eq("owner_id", merchantData.user_id)
          .maybeSingle();

        setContract({
          id: merchantData.id,
          version: merchantData.contract_version,
          accepted_at: merchantData.accepted_at,
          holder_name: profileData?.full_name || storeData?.name || null,
          holder_document: storeData?.responsible_cpf || null,
          ip_address: merchantData.ip_address,
          contract_type: 'merchant'
        });
        return;
      }

      // Se não encontrou em merchant, buscar em salesperson_contracts
      const { data: salespersonData, error: salespersonError } = await supabase
        .from("salesperson_contracts")
        .select("id, version, accepted_at, salesperson_name, salesperson_cnpj, ip_address")
        .eq("verification_hash", hash)
        .maybeSingle();

      if (salespersonData) {
        setContract({
          id: salespersonData.id,
          version: salespersonData.version,
          accepted_at: salespersonData.accepted_at,
          holder_name: salespersonData.salesperson_name,
          holder_document: salespersonData.salesperson_cnpj,
          ip_address: salespersonData.ip_address,
          contract_type: 'salesperson'
        });
        return;
      }

      // Não encontrou em nenhuma tabela
      setError("Contrato não encontrado ou hash inválido");
    } catch (err: any) {
      console.error("Erro ao verificar:", err);
      setError(err.message || "Erro ao verificar contrato");
    } finally {
      setLoading(false);
    }
  };

  const maskDocument = (doc: string | null) => {
    if (!doc) return "***";
    // Tentar mascarar como CNPJ
    if (doc.length >= 14) {
      return doc.replace(/^(\d{2})[\d.\/\-]+(\d{2})$/, "$1.***.***/**** -$2");
    }
    // CPF ou outro documento
    return doc.substring(0, 3) + "***" + doc.substring(doc.length - 2);
  };

  const maskName = (name: string | null) => {
    if (!name) return "***";
    const parts = name.split(" ");
    if (parts.length === 1) return `${parts[0].charAt(0)}***`;
    return `${parts[0]} ***`;
  };

  const getContractTypeLabel = (type: 'merchant' | 'salesperson') => {
    return type === 'merchant' ? 'Lojista' : 'Vendedor PJ';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Store className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Mostralo</h1>
          <p className="text-muted-foreground">Verificação de Contrato</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>Verificação de Autenticidade</CardTitle>
            <CardDescription>
              Confirme se o contrato é válido e autêntico
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Verificando contrato...</p>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Contrato Não Verificado</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : contract ? (
              <div className="space-y-6">
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700 dark:text-green-400">
                    Contrato Autêntico
                  </AlertTitle>
                  <AlertDescription className="text-green-600 dark:text-green-300">
                    Este contrato foi verificado com sucesso e é válido.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Versão</span>
                    <Badge variant="secondary">{contract.version}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Data do Aceite</span>
                    <span className="font-medium">
                      {new Date(contract.accepted_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Tipo</span>
                    <Badge variant="outline">
                      {getContractTypeLabel(contract.contract_type)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Contratado</span>
                    <span className="font-medium">
                      {maskName(contract.holder_name)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Documento</span>
                    <span className="font-mono text-sm">
                      {maskDocument(contract.holder_document)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Hash</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {hash?.substring(0, 12)}...
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t">
              <Button asChild variant="outline" className="w-full">
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar ao Início
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Este sistema de verificação garante a autenticidade dos contratos
          firmados eletronicamente através da plataforma Mostralo.
        </p>
      </div>
    </div>
  );
}
