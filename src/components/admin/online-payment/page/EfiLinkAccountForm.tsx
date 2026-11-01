// PASSO 2 da tela Pagamento Online: formulário para vincular a conta EFI.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Info, Loader2, Link2, Building2, User } from 'lucide-react';
import { formatAccountNumber } from "@/lib/onlinePayment/efiFormat";
import type { EfiAccount } from "@/hooks/onlinePayment/useEfiAccount";

interface Props {
  account: EfiAccount;
}

export function EfiLinkAccountForm({ account }: Props) {
  const {
    efiDocumentType,
    setEfiDocumentType,
    efiDocumentNumber,
    setEfiDocumentNumber,
    efiAccountNumber,
    setEfiAccountNumber,
    formatDocument,
    handleLinkAccount,
    saving,
  } = account;

  return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            PASSO 2: Vincular sua Conta
          </CardTitle>
          <CardDescription>
            Informe o número da sua conta EFI para começar a receber pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de documento */}
          <div className="space-y-3">
            <Label>Tipo de Documento do Titular *</Label>
            <RadioGroup
              value={efiDocumentType}
              onValueChange={(v) => {
                setEfiDocumentType(v as 'cpf' | 'cnpj');
                setEfiDocumentNumber('');
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cpf" id="cpf" />
                <Label htmlFor="cpf" className="flex items-center gap-1 cursor-pointer font-normal">
                  <User className="h-4 w-4" /> CPF (Pessoa Física)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cnpj" id="cnpj" />
                <Label htmlFor="cnpj" className="flex items-center gap-1 cursor-pointer font-normal">
                  <Building2 className="h-4 w-4" /> CNPJ (Empresa)
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Use o mesmo tipo de documento que você cadastrou na conta EFI
            </p>
          </div>

          {/* Número do documento */}
          <div className="space-y-2">
            <Label htmlFor="efiDocument">{efiDocumentType.toUpperCase()} do Titular *</Label>
            <Input
              id="efiDocument"
              value={efiDocumentNumber}
              onChange={(e) => setEfiDocumentNumber(formatDocument(e.target.value))}
              placeholder={efiDocumentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              maxLength={efiDocumentType === 'cpf' ? 14 : 18}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              O documento deve ser o mesmo cadastrado como titular da conta EFI
            </p>
          </div>

          {/* Número da conta */}
          <div className="space-y-2">
            <Label htmlFor="efiAccount">Número da Conta EFI *</Label>
            <Input
              id="efiAccount"
              value={efiAccountNumber}
              onChange={(e) => setEfiAccountNumber(formatAccountNumber(e.target.value))}
              placeholder="Ex: 1234567"
              maxLength={10}
              className="font-mono text-lg"
            />
            <p className="text-xs text-muted-foreground">
              O número está no app Efí → Menu → Minha Conta
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Importante:</strong> O CPF ou CNPJ informado deve ser exatamente o mesmo cadastrado
              na sua conta EFI. Isso garante que o split de pagamento funcione corretamente.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleLinkAccount}
            disabled={saving || efiAccountNumber.length < 6 || efiDocumentNumber.replace(/\D/g, '').length < (efiDocumentType === 'cpf' ? 11 : 14)}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Vinculando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Vincular e Ativar Pagamento Online
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Ao vincular, você concorda com os termos de uso do serviço de pagamentos.
            Os valores recebidos serão depositados diretamente na sua conta EFI.
          </p>
        </CardContent>
      </Card>
  );
}
