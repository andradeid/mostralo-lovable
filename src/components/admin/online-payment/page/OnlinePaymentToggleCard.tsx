// Chave para ligar/desligar o pagamento online no checkout (conta EFI ativa).
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, XCircle } from 'lucide-react';
import type { EfiAccount, StoreEfiData } from "@/hooks/onlinePayment/useEfiAccount";

interface Props {
  storeData: StoreEfiData;
  account: EfiAccount;
}

export function OnlinePaymentToggleCard({ storeData, account }: Props) {
  const { handleToggleOnlinePayment, togglingPayment } = account;

  return (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium flex items-center gap-2">
                      {storeData.wants_online_payment ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      Pagamento Online no Checkout
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {storeData.wants_online_payment
                        ? "Clientes podem pagar via PIX no checkout"
                        : "Clientes só podem pagar na entrega"}
                    </p>
                  </div>
                  <Switch
                    checked={storeData.wants_online_payment}
                    onCheckedChange={handleToggleOnlinePayment}
                    disabled={togglingPayment}
                  />
                </div>
              </CardContent>
            </Card>
  );
}
