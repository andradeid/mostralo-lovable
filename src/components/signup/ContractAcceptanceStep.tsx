import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, Shield, AlertTriangle, ChevronDown } from 'lucide-react';

interface ContractAcceptances {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  cookiesAccepted: boolean;
  marketingAccepted: boolean;
  businessInfoDeclaration: boolean;
  companyAuthorization: boolean;
  complianceCommitment: boolean;
}

interface ContractAcceptanceStepProps {
  acceptances: ContractAcceptances;
  onAcceptancesChange: (acceptances: ContractAcceptances) => void;
  // Dados do CONTRATANTE (cliente)
  companyName: string;
  companyDocument?: string;
  representanteName?: string;
  street?: string;
  number?: string;
  complement?: string;
  city?: string;
  state?: string;
}

interface ContractTemplate {
  id: string;
  version: string;
  title: string;
  content: string;
}

interface ContractorInfo {
  company_name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  full_address: string;
}

const ContractAcceptanceStep = ({ 
  acceptances, 
  onAcceptancesChange,
  companyName,
  companyDocument = '',
  representanteName = '',
  street = '',
  number = '',
  complement = '',
  city = '',
  state = '',
}: ContractAcceptanceStepProps) => {
  const [contract, setContract] = useState<ContractTemplate | null>(null);
  const [contractorInfo, setContractorInfo] = useState<ContractorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Buscar contrato e dados da contratada em paralelo
      const [contractResult, contractorResult] = await Promise.all([
        supabase
          .from('merchant_contract_templates')
          .select('*')
          .eq('is_active', true)
          .single(),
        supabase
          .from('company_settings')
          .select('value')
          .eq('key', 'contractor_info')
          .single()
      ]);

      if (!contractResult.error && contractResult.data) {
        setContract(contractResult.data);
      }

      if (!contractorResult.error && contractorResult.data) {
        setContractorInfo(contractorResult.data.value as unknown as ContractorInfo);
      }
    } catch (error) {
      console.error('Error fetching contract data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para substituir placeholders no contrato
  const formatContractContent = (content: string): string => {
    if (!content) return '';

    // Determinar tipo de pessoa e documento baseado no tamanho
    const cleanDocument = companyDocument.replace(/\D/g, '');
    const isCompany = cleanDocument.length > 11;
    const tipoPessoa = isCompany ? 'jurídica' : 'física';
    const tipoDocumento = isCompany ? 'CNPJ' : 'CPF';

    // Montar endereço completo do contratante
    const enderecoContratante = [
      street,
      number,
      complement,
      city,
      state
    ].filter(Boolean).join(', ') || 'Não informado';

    // Substituições da CONTRATADA (Mostralo)
    let formattedContent = content
      .replace(/{cnpj_contratada}/g, contractorInfo?.cnpj || '51.691.995/0001-15')
      .replace(/{endereco_contratada}/g, contractorInfo?.full_address || 'SGCV LOTE 11, 121, BRASILIA - DF, CEP 70714-900');

    // Substituições do CONTRATANTE (cliente)
    formattedContent = formattedContent
      .replace(/{nome_empresa}/g, companyName || 'Não informado')
      .replace(/{tipo_pessoa}/g, tipoPessoa)
      .replace(/{tipo_documento}/g, tipoDocumento)
      .replace(/{documento}/g, companyDocument || 'Não informado')
      .replace(/{endereco_contratante}/g, enderecoContratante)
      .replace(/{nome_representante}/g, representanteName || companyName || 'Não informado');

    return formattedContent;
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;
    // Threshold reduzido para 85% para facilitar detecção no mobile
    if (scrollPercentage > 0.85) {
      setHasScrolledToEnd(true);
    }
  };

  const scrollToEnd = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const updateAcceptance = (field: keyof ContractAcceptances, value: boolean) => {
    onAcceptancesChange({ ...acceptances, [field]: value });
  };

  const allRequiredAccepted = 
    acceptances.termsAccepted &&
    acceptances.privacyAccepted &&
    acceptances.cookiesAccepted &&
    acceptances.businessInfoDeclaration &&
    acceptances.companyAuthorization &&
    acceptances.complianceCommitment;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h3 className="font-semibold text-lg">Contrato de Prestação de Serviços</h3>
          <p className="text-sm text-muted-foreground">
            Versão {contract?.version || '1.0'} - Leia atentamente antes de aceitar
          </p>
        </div>
      </div>

      {/* Contract Content */}
      {contract && (
        <Card>
          <CardContent className="p-0">
            {/* Usando div nativa em vez de ScrollArea para melhor compatibilidade mobile */}
            <div 
              ref={scrollAreaRef}
              onScroll={handleScroll}
              className="h-[180px] sm:h-[250px] md:h-[320px] overflow-y-auto p-4 scroll-smooth"
            >
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm pb-8">
                {formatContractContent(contract.content)}
              </div>
            </div>
            {!hasScrolledToEnd && (
              <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-900 flex items-center justify-between gap-2">
                <p className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Role até o final para habilitar os aceites</span>
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={scrollToEnd}
                  className="text-xs whitespace-nowrap flex-shrink-0 h-7 px-2"
                >
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Ir ao final
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Required Acceptances */}
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Termos Obrigatórios
        </h4>

        <div className="space-y-3">
          <CheckboxField
            id="terms"
            checked={acceptances.termsAccepted}
            onCheckedChange={(checked) => updateAcceptance('termsAccepted', checked as boolean)}
            disabled={!hasScrolledToEnd}
            required
          >
            Li e aceito os <strong>Termos de Serviço</strong> *
          </CheckboxField>

          <CheckboxField
            id="privacy"
            checked={acceptances.privacyAccepted}
            onCheckedChange={(checked) => updateAcceptance('privacyAccepted', checked as boolean)}
            disabled={!hasScrolledToEnd}
            required
          >
            Li e aceito a <strong>Política de Privacidade</strong> (LGPD) *
          </CheckboxField>

          <CheckboxField
            id="cookies"
            checked={acceptances.cookiesAccepted}
            onCheckedChange={(checked) => updateAcceptance('cookiesAccepted', checked as boolean)}
            disabled={!hasScrolledToEnd}
            required
          >
            Aceito o uso de <strong>Cookies</strong> essenciais *
          </CheckboxField>
        </div>
      </div>

      <Separator />

      {/* Business Declarations */}
      <div className="space-y-4">
        <h4 className="font-semibold">Declarações Empresariais</h4>
        
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
            As declarações abaixo são necessárias para estabelecimentos comerciais e confirmam 
            sua capacidade de contratar em nome de <strong>{companyName || 'sua empresa'}</strong>.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <CheckboxField
            id="businessInfo"
            checked={acceptances.businessInfoDeclaration}
            onCheckedChange={(checked) => updateAcceptance('businessInfoDeclaration', checked as boolean)}
            disabled={!hasScrolledToEnd}
            required
          >
            Declaro que todas as <strong>informações fornecidas são verdadeiras</strong> e me responsabilizo por sua veracidade *
          </CheckboxField>

          <CheckboxField
            id="companyAuth"
            checked={acceptances.companyAuthorization}
            onCheckedChange={(checked) => updateAcceptance('companyAuthorization', checked as boolean)}
            disabled={!hasScrolledToEnd}
            required
          >
            Declaro ter <strong>autorização para representar</strong> a empresa e contratar serviços em seu nome *
          </CheckboxField>

          <CheckboxField
            id="compliance"
            checked={acceptances.complianceCommitment}
            onCheckedChange={(checked) => updateAcceptance('complianceCommitment', checked as boolean)}
            disabled={!hasScrolledToEnd}
            required
          >
            Comprometo-me a cumprir todas as <strong>normas sanitárias, fiscais e trabalhistas</strong> aplicáveis ao meu estabelecimento *
          </CheckboxField>
        </div>
      </div>

      <Separator />

      {/* Optional */}
      <div className="space-y-3">
        <h4 className="font-semibold text-muted-foreground">Opcional</h4>
        
        <CheckboxField
          id="marketing"
          checked={acceptances.marketingAccepted}
          onCheckedChange={(checked) => updateAcceptance('marketingAccepted', checked as boolean)}
          disabled={!hasScrolledToEnd}
        >
          Aceito receber comunicações de marketing, novidades e promoções (opcional)
        </CheckboxField>
      </div>

      {/* Summary */}
      {allRequiredAccepted && (
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            ✓ Todos os termos obrigatórios foram aceitos. Você pode prosseguir com a criação da conta.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Reusable checkbox field component
const CheckboxField = ({ 
  id, 
  checked, 
  onCheckedChange, 
  disabled = false,
  required = false,
  children 
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean | 'indeterminate') => void;
  disabled?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
    checked 
      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
      : disabled
        ? 'bg-muted/30 border-muted'
        : 'hover:bg-muted/50'
  }`}>
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={checked ? 'border-green-600 data-[state=checked]:bg-green-600' : ''}
    />
    <Label 
      htmlFor={id} 
      className={`text-sm cursor-pointer leading-relaxed ${
        disabled ? 'text-muted-foreground' : ''
      }`}
    >
      {children}
    </Label>
  </div>
);

export default ContractAcceptanceStep;