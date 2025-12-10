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
  salesperson_name: string | null;
  salesperson_cnpj: string | null;
  ip_address: string | null;
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
      
      const { data, error: fetchError } = await supabase
        .from("salesperson_contracts")
        .select("id, version, accepted_at, salesperson_name, salesperson_cnpj, ip_address")
        .eq("verification_hash", hash)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          setError("Contrato não encontrado ou hash inválido");
        } else {
          throw fetchError;
        }
        return;
      }

      setContract(data);
    } catch (err: any) {
      console.error("Erro ao verificar:", err);
      setError(err.message || "Erro ao verificar contrato");
    } finally {
      setLoading(false);
    }
  };

  const maskCnpj = (cnpj: string | null) => {
    if (!cnpj) return "***";
    return cnpj.replace(/^(\d{2})\.\d{3}\.\d{3}\/\d{4}-(\d{2})$/, "$1.***.***/**** -$2");
  };

  const maskName = (name: string | null) => {
    if (!name) return "***";
    const parts = name.split(" ");
    if (parts.length === 1) return `${parts[0].charAt(0)}***`;
    return `${parts[0]} ***`;
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
                    <span className="text-sm text-muted-foreground">Contratado</span>
                    <span className="font-medium">
                      {maskName(contract.salesperson_name)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">CNPJ</span>
                    <span className="font-mono text-sm">
                      {maskCnpj(contract.salesperson_cnpj)}
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
