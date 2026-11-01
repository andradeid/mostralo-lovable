// Tela Pagamento Online com a conta EFI já ativa: chave do checkout, dados da
// conta, atualizar status, PIX de teste e guia do split.
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EfiSplitSetupGuide } from "@/components/store/EfiSplitSetupGuide";
import { Smartphone, Info, RefreshCw, AlertTriangle } from 'lucide-react';
import type { EfiAccount, StoreEfiData } from "@/hooks/onlinePayment/useEfiAccount";
import type { PixTestCharge } from "@/hooks/onlinePayment/usePixTestCharge";
import { EfiStatusAlert } from "./EfiStatusAlert";
import { OnlinePaymentToggleCard } from "./OnlinePaymentToggleCard";
import { EfiAccountInfoCard } from "./EfiAccountInfoCard";
import { PixTestCard } from "./PixTestCard";

interface Props {
  storeData: StoreEfiData;
  account: EfiAccount;
  pixTest: PixTestCharge;
}

export function EfiActiveAccountView({ storeData, account, pixTest }: Props) {
  const { fetchStoreData } = account;
  const { showSplitGuide, setShowSplitGuide, handleCreateTestCharge, testResult } = pixTest;

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            Pagamento Online
          </h1>
          <p className="text-muted-foreground">
            Receba pagamentos PIX diretamente na plataforma
          </p>
        </div>

        <EfiStatusAlert storeData={storeData} />

        {/* Grid 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            {/* Switch para ativar/desativar */}
            <OnlinePaymentToggleCard storeData={storeData} account={account} />

            {/* Card Informações da Conta */}
            <EfiAccountInfoCard storeData={storeData} account={account} />

            {/* Botão Atualizar Status */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={fetchStoreData}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Status
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {/* Card de Teste PIX */}
            <PixTestCard pixTest={pixTest} />

            {/* Info Card */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Os pagamentos PIX dos seus clientes serão depositados automaticamente
                na sua conta EFI vinculada, já com a taxa descontada.
              </AlertDescription>
            </Alert>

            {/* Split Setup Guide - shows when split fails */}
            {showSplitGuide && (
              <EfiSplitSetupGuide
                onTestAgain={handleCreateTestCharge}
                showTestButton={true}
                defaultOpen={true}
              />
            )}
          </div>
        </div>

        {/* Split warning alert at bottom */}
        {testResult && !testResult.splitApplied && (
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <div className="space-y-1">
                <p className="font-medium">⚠️ Split de pagamento não configurado</p>
                <p className="text-sm">
                  A cobrança PIX foi criada, mas o split não foi aplicado.
                  Isso significa que todo o valor vai direto para a plataforma.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowSplitGuide(true)}
                >
                  Ver como configurar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
  );
}
