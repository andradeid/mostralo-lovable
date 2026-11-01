// Aviso do status da conta EFI (ativa, aguardando configuração ou rejeitada).
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { StoreEfiData } from "@/hooks/onlinePayment/useEfiAccount";

interface Props {
  storeData: StoreEfiData | null;
}

export function EfiStatusAlert({ storeData }: Props) {
    if (!storeData) return null;

    switch (storeData.efi_account_status) {
      case 'active':
        return (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-green-800 dark:text-green-300">
                  ✅ PIX Online Ativo!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Sua conta EFI está configurada e pronta para receber pagamentos PIX.
                </p>
                {storeData.efi_account_number && (
                  <p className="text-xs text-muted-foreground">
                    Conta EFI: {storeData.efi_account_number}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'pending_authorization':
        return (
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900">
            <Clock className="h-5 w-5 text-yellow-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                  ⏳ Aguardando Configuração
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Complete a vinculação da sua conta EFI abaixo.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'rejected':
        return (
          <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-800 dark:text-red-300">
                  ❌ Conta Rejeitada
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Houve um problema com a conta informada. Verifique os dados e tente novamente.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        );

      default:
        return null;
    }
}
