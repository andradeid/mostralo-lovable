import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { Smartphone, Loader2 } from 'lucide-react';
import { useEfiAccount } from "@/hooks/onlinePayment/useEfiAccount";
import { usePixTestCharge } from "@/hooks/onlinePayment/usePixTestCharge";
import { EfiStatusAlert } from "@/components/admin/online-payment/page/EfiStatusAlert";
import { EfiActiveAccountView } from "@/components/admin/online-payment/page/EfiActiveAccountView";
import { EfiSignupGuide } from "@/components/admin/online-payment/page/EfiSignupGuide";
import { EfiLinkAccountForm } from "@/components/admin/online-payment/page/EfiLinkAccountForm";

// Tela Pagamento Online da loja (PIX via conta EFI). Só orquestra: lógica em
// src/hooks/onlinePayment/, formatação em src/lib/onlinePayment/ e telas em
// src/components/admin/online-payment/page/.
export default function StoreOnlinePaymentPage() {
  const { toast } = useToast();
  const { storeId, isLoading: storeLoading } = useStoreAccess();

  const [guideOpen, setGuideOpen] = useState(true);

  const account = useEfiAccount({ storeId, toast });
  const pixTest = usePixTestCharge({ storeId, toast });
  const { loading, storeData } = account;

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se já tem conta ativa
  if (storeData?.efi_account_status === 'active' && storeData?.efi_account_number) {
    return <EfiActiveAccountView storeData={storeData} account={account} pixTest={pixTest} />;
  }

  // Formulário de vinculação
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-primary" />
          Pagamento Online
        </h1>
        <p className="text-muted-foreground">
          Ative o recebimento de pagamentos PIX diretamente na plataforma
        </p>
      </div>

      <EfiStatusAlert storeData={storeData} />

      <EfiSignupGuide guideOpen={guideOpen} setGuideOpen={setGuideOpen} />

      {/* Formulário de vinculação */}
      <EfiLinkAccountForm account={account} />
    </div>
  );
}
