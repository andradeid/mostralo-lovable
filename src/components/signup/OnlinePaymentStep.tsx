import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Smartphone, 
  Building2, 
  User, 
  Zap, 
  Shield, 
  Check, 
  Info,
  CreditCard,
  Percent
} from 'lucide-react';

export interface OnlinePaymentConfig {
  wantsOnlinePayment: boolean;
  personType: 'pf' | 'pj' | null;
  // Dados PF
  birthDate: string;
  motherName: string;
}

interface OnlinePaymentStepProps {
  config: OnlinePaymentConfig;
  onConfigChange: (config: OnlinePaymentConfig) => void;
  companyDocument: string; // CPF ou CNPJ já informado
  companyName: string;
  email: string;
  phone: string;
}

export function OnlinePaymentStep({
  config,
  onConfigChange,
  companyDocument,
  companyName,
  email,
  phone,
}: OnlinePaymentStepProps) {
  const documentNumbers = companyDocument.replace(/\D/g, '');
  const isPJ = documentNumbers.length === 14;
  
  // Se já é PJ, automaticamente define o personType
  const effectivePersonType = isPJ ? 'pj' : config.personType;

  const handleWantsOnlinePayment = (wants: boolean) => {
    onConfigChange({
      ...config,
      wantsOnlinePayment: wants,
      personType: wants && isPJ ? 'pj' : (wants ? config.personType : null),
    });
  };

  const handlePersonTypeChange = (type: 'pf' | 'pj') => {
    onConfigChange({
      ...config,
      personType: type,
    });
  };

  // Formatador de data
  const formatBirthDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 8);
    
    if (limited.length <= 2) return limited;
    if (limited.length <= 4) return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Pergunta Principal */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Smartphone className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Pagamento Online (Opcional)</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Deseja receber pagamentos PIX diretamente na plataforma?
        </p>
      </div>

      {/* Opções SIM/NÃO */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            config.wantsOnlinePayment === true
              ? 'ring-2 ring-primary bg-primary/5'
              : 'hover:bg-muted/50'
          }`}
          onClick={() => handleWantsOnlinePayment(true)}
        >
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-full ${
                config.wantsOnlinePayment === true ? 'bg-primary' : 'bg-muted'
              }`}>
                <Check className={`w-6 h-6 ${
                  config.wantsOnlinePayment === true ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} />
              </div>
              <span className="font-semibold">SIM</span>
              <span className="text-xs text-muted-foreground">Habilitar PIX Online</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            config.wantsOnlinePayment === false
              ? 'ring-2 ring-primary bg-primary/5'
              : 'hover:bg-muted/50'
          }`}
          onClick={() => handleWantsOnlinePayment(false)}
        >
          <CardContent className="p-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-full ${
                config.wantsOnlinePayment === false ? 'bg-primary' : 'bg-muted'
              }`}>
                <CreditCard className={`w-6 h-6 ${
                  config.wantsOnlinePayment === false ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} />
              </div>
              <span className="font-semibold">NÃO</span>
              <span className="text-xs text-muted-foreground">Receber na entrega</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info sobre taxas */}
      {config.wantsOnlinePayment === true && (
        <>
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
            <Percent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              <div className="space-y-1">
                <p className="font-semibold">Taxa por transação: 8,19%</p>
                <p className="text-xs">7% Mostralo + 1,19% processamento EFI</p>
                <p className="text-xs flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Recebimento instantâneo na sua conta
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Se for CPF, precisa escolher PF ou PJ */}
          {!isPJ && (
            <div className="space-y-3">
              <Label>Tipo de conta para recebimento:</Label>
              <RadioGroup
                value={config.personType || ''}
                onValueChange={(value) => handlePersonTypeChange(value as 'pf' | 'pj')}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="pf" id="pf" className="peer sr-only" />
                  <Label
                    htmlFor="pf"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <User className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Pessoa Física</span>
                    <span className="text-xs text-muted-foreground">CPF</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="pj" id="pj" className="peer sr-only" />
                  <Label
                    htmlFor="pj"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Building2 className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Pessoa Jurídica</span>
                    <span className="text-xs text-muted-foreground">CNPJ</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Formulário para PF */}
          {(effectivePersonType === 'pf' || (!isPJ && config.personType === 'pf')) && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-4 h-4 text-primary" />
                Dados para verificação de identidade
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                <Input
                  id="birthDate"
                  value={config.birthDate}
                  onChange={(e) => onConfigChange({
                    ...config,
                    birthDate: formatBirthDate(e.target.value),
                  })}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motherName">Nome Completo da Mãe *</Label>
                <Input
                  id="motherName"
                  value={config.motherName}
                  onChange={(e) => onConfigChange({
                    ...config,
                    motherName: e.target.value,
                  })}
                  placeholder="Nome completo da mãe"
                />
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Dados protegidos pela LGPD, usados apenas para verificação na EFI Pay
              </p>
            </div>
          )}

          {/* Confirmação para PJ */}
          {(effectivePersonType === 'pj' || isPJ) && config.wantsOnlinePayment && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
              <Building2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                <div className="font-semibold mb-2">Dados da empresa confirmados:</div>
                <div className="text-sm space-y-1">
                  <p>📄 {isPJ ? 'CNPJ' : 'Documento'}: {companyDocument}</p>
                  <p>🏢 Razão Social: {companyName}</p>
                  <p>📧 Email: {email}</p>
                  <p>📱 Celular: {phone}</p>
                </div>
                <p className="text-xs mt-2 opacity-70">
                  ⚠️ A EFI validará automaticamente com a Receita Federal
                </p>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Info quando escolhe NÃO */}
      {config.wantsOnlinePayment === false && (
        <Alert className="bg-muted border-border">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Você pode ativar o pagamento online depois!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse as configurações do seu painel para habilitar a qualquer momento.
              Por enquanto, seus clientes pagarão na entrega (dinheiro, cartão físico, PIX manual).
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default OnlinePaymentStep;
