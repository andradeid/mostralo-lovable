import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ContractViewer } from "@/components/contract/ContractViewer";

export default function SalespersonContract() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [salesperson, setSalesperson] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Buscar dados do vendedor e template em paralelo
      const [salespersonResult, templateResult] = await Promise.all([
        supabase
          .from('salespeople')
          .select('*')
          .eq('user_id', user?.id)
          .single(),
        supabase
          .from('salesperson_contract_templates')
          .select('*')
          .eq('is_active', true)
          .single()
      ]);

      if (salespersonResult.error) throw salespersonResult.error;
      if (templateResult.error) {
        console.warn('Nenhum template de contrato ativo encontrado');
      }

      setSalesperson(salespersonResult.data);
      setTemplate(templateResult.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do vendedor');
    } finally {
      setLoading(false);
    }
  };

  const getFormattedContractText = () => {
    if (!template) return '';
    
    let text = template.contract_text || '';
    
    // Substituir placeholders da empresa (template)
    text = text.replace(/{empresa}/g, template.company_name || '');
    text = text.replace(/{cnpj}/g, template.company_cnpj || '');
    text = text.replace(/{cidade}/g, template.company_city || '');
    text = text.replace(/{estado}/g, template.company_state || '');
    
    // Substituir placeholders do vendedor
    if (salesperson) {
      text = text.replace(/{vendedor_nome}/g, salesperson.full_name || '');
      text = text.replace(/{vendedor_cnpj}/g, salesperson.cnpj || '');
      text = text.replace(/{vendedor_empresa}/g, salesperson.company_name || '');
      text = text.replace(/{comissao_percentual}/g, '10'); // Comissão padrão
    }
    
    return text;
  };

  const handleAcceptContract = async () => {
    if (!agreed) {
      toast.error('Você precisa concordar com os termos do contrato');
      return;
    }

    setAccepting(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-salesperson-contract');

      if (error) throw error;

      if (data?.success) {
        toast.success('Contrato aceito com sucesso!');
        navigate('/vendedor');
      } else {
        throw new Error(data?.error || 'Erro ao aceitar contrato');
      }
    } catch (error: any) {
      console.error('Erro ao aceitar contrato:', error);
      toast.error(error.message || 'Erro ao aceitar contrato');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const isContractPending = salesperson?.status === 'pending_contract';
  const isContractAccepted = salesperson?.status === 'active' && salesperson?.contract_accepted_at;

  return (
    <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Contrato de Prestação de Serviços</h1>
          <p className="text-muted-foreground">
            {isContractAccepted ? 'Contrato aceito' : 'Leia atentamente antes de aceitar'}
          </p>
        </div>

        {isContractAccepted && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              Contrato aceito em {new Date(salesperson.contract_accepted_at).toLocaleString('pt-BR')}
            </AlertDescription>
          </Alert>
        )}

        {isContractPending && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seu cadastro foi aprovado! Leia e aceite o contrato para ativar sua conta.
            </AlertDescription>
          </Alert>
        )}

        {!template ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum template de contrato ativo encontrado. Entre em contato com o suporte.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Termos do Contrato - Versão {template.version || '1.0'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ContractViewer
                contractText={getFormattedContractText()}
                companyName={template.company_name || ''}
                companyCnpj={template.company_cnpj || ''}
                companyCity={template.company_city || ''}
                companyState={template.company_state || ''}
                version={template.version || '1.0'}
                salespersonName={salesperson?.full_name}
                salespersonCnpj={salesperson?.cnpj}
                acceptedAt={isContractAccepted ? salesperson.contract_accepted_at : undefined}
              />

              {isContractPending && (
                <div className="mt-6 space-y-4 border-t pt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agree"
                      checked={agreed}
                      onCheckedChange={(checked) => setAgreed(checked as boolean)}
                    />
                    <label
                      htmlFor="agree"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Li e concordo com todos os termos deste contrato
                    </label>
                  </div>

                  <Button
                    onClick={handleAcceptContract}
                    disabled={!agreed || accepting}
                    className="w-full md:w-auto"
                    size="lg"
                  >
                    {accepting ? 'Aceitando...' : 'Aceitar Contrato'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
