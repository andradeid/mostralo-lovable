import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, FileText, Check, Download, ExternalLink, Shield, Calendar, Globe, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContractAcceptance {
  id: string;
  contract_version: string;
  accepted_at: string;
  ip_address: string | null;
  user_agent: string | null;
  verification_hash: string | null;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  cookies_accepted: boolean;
  marketing_accepted: boolean;
  business_info_declaration: boolean;
  company_authorization: boolean;
  compliance_commitment: boolean;
}

interface ContractTemplate {
  id: string;
  version: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

const MerchantContractHistoryPage = () => {
  const { user } = useAuth();
  const [acceptances, setAcceptances] = useState<ContractAcceptance[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAcceptance, setSelectedAcceptance] = useState<ContractAcceptance | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch user's contract acceptances
      const { data: acceptancesData, error: acceptancesError } = await supabase
        .from('merchant_contract_acceptance')
        .select('*')
        .eq('user_id', user?.id)
        .order('accepted_at', { ascending: false });

      if (acceptancesError) throw acceptancesError;
      setAcceptances(acceptancesData || []);

      // Fetch active contract template
      const { data: templateData, error: templateError } = await supabase
        .from('merchant_contract_templates')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!templateError && templateData) {
        setActiveTemplate(templateData);
      }

      if (acceptancesData && acceptancesData.length > 0) {
        setSelectedAcceptance(acceptancesData[0]);
      }
    } catch (error) {
      console.error('Error fetching contract data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationUrl = (hash: string | null) => {
    if (!hash) return null;
    return `${window.location.origin}/verificar-contrato?hash=${hash}&type=merchant`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Contratos</h1>
        <p className="text-muted-foreground">
          Histórico de contratos e termos aceitos
        </p>
      </div>

      {acceptances.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum contrato encontrado</h3>
            <p className="text-muted-foreground">
              Você ainda não possui contratos aceitos registrados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de contratos */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Contratos Aceitos</CardTitle>
              <CardDescription>
                {acceptances.length} contrato(s) registrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {acceptances.map((acceptance) => (
                    <div
                      key={acceptance.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAcceptance?.id === acceptance.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedAcceptance(acceptance)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            Versão {acceptance.contract_version}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(acceptance.accepted_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Aceito
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Detalhes do contrato selecionado */}
          {selectedAcceptance && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>
                      Contrato v{selectedAcceptance.contract_version}
                    </CardTitle>
                    <CardDescription>
                      Detalhes do aceite e verificação
                    </CardDescription>
                  </div>
                  {selectedAcceptance.verification_hash && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = getVerificationUrl(selectedAcceptance.verification_hash);
                        if (url) window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Verificar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informações do aceite */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data do Aceite</p>
                      <p className="font-medium">
                        {format(new Date(selectedAcceptance.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Endereço IP</p>
                      <p className="font-medium font-mono text-sm">
                        {selectedAcceptance.ip_address || 'Não registrado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Agent */}
                {selectedAcceptance.user_agent && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Monitor className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Navegador/Dispositivo</p>
                      <p className="text-sm font-mono break-all">
                        {selectedAcceptance.user_agent}
                      </p>
                    </div>
                  </div>
                )}

                {/* Hash de verificação */}
                {selectedAcceptance.verification_hash && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800 dark:text-green-300">
                        Hash de Verificação
                      </span>
                    </div>
                    <p className="font-mono text-xs break-all text-green-700 dark:text-green-400">
                      {selectedAcceptance.verification_hash}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                      Este hash garante a autenticidade e integridade do aceite.
                    </p>
                  </div>
                )}

                <Separator />

                {/* Termos aceitos */}
                <div>
                  <h4 className="font-semibold mb-3">Termos Aceitos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <AcceptanceBadge 
                      accepted={selectedAcceptance.terms_accepted} 
                      label="Termos de Serviço" 
                    />
                    <AcceptanceBadge 
                      accepted={selectedAcceptance.privacy_accepted} 
                      label="Política de Privacidade" 
                    />
                    <AcceptanceBadge 
                      accepted={selectedAcceptance.cookies_accepted} 
                      label="Política de Cookies" 
                    />
                    <AcceptanceBadge 
                      accepted={selectedAcceptance.marketing_accepted} 
                      label="Comunicações de Marketing" 
                      optional 
                    />
                    <AcceptanceBadge 
                      accepted={selectedAcceptance.business_info_declaration} 
                      label="Declaração de Informações" 
                    />
                    <AcceptanceBadge 
                      accepted={selectedAcceptance.company_authorization} 
                      label="Autorização Empresarial" 
                    />
                    <AcceptanceBadge 
                      accepted={selectedAcceptance.compliance_commitment} 
                      label="Compromisso de Conformidade" 
                    />
                  </div>
                </div>

                {/* Contrato atual */}
                {activeTemplate && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3">Contrato Atual</h4>
                      <Card>
                        <CardContent className="p-4">
                          <ScrollArea className="h-[300px]">
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                              {activeTemplate.content}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// Componente para badges de aceite
const AcceptanceBadge = ({ accepted, label, optional = false }: { accepted: boolean; label: string; optional?: boolean }) => (
  <div className={`flex items-center gap-2 p-2 rounded-lg ${
    accepted 
      ? 'bg-green-50 dark:bg-green-950/20' 
      : optional 
        ? 'bg-muted/50' 
        : 'bg-red-50 dark:bg-red-950/20'
  }`}>
    <Check className={`h-4 w-4 ${
      accepted 
        ? 'text-green-600' 
        : optional 
          ? 'text-muted-foreground' 
          : 'text-red-600'
    }`} />
    <span className={`text-sm ${
      accepted 
        ? 'text-green-800 dark:text-green-300' 
        : optional 
          ? 'text-muted-foreground' 
          : 'text-red-800 dark:text-red-300'
    }`}>
      {label}
      {optional && !accepted && ' (opcional)'}
    </span>
  </div>
);

export default MerchantContractHistoryPage;
