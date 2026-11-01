// Criar fatura: envio por WhatsApp.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Phone } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { formatInvoiceDueDate } from "@/lib/invoiceDate";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function CreateInvoiceWhatsAppSection({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { formData, selectedStoreData, markAsPaid, sendWhatsApp, setSendWhatsApp, whatsappPhone, setWhatsappPhone, masterWhatsAppStatus } = ctx;

  return (
    <>
      {/* Seção de Envio por WhatsApp (apenas para faturas pendentes) */}
      {!markAsPaid && (
        <Card className={`border-2 transition-all ${sendWhatsApp ? 'border-green-500 bg-green-500/5' : 'border-dashed border-muted-foreground/30'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="send-whatsapp"
                checked={sendWhatsApp}
                onChange={(e) => setSendWhatsApp(e.target.checked)}
                className="h-5 w-5 accent-green-500"
                disabled={masterWhatsAppStatus !== 'connected'}
              />
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className={`w-5 h-5 ${sendWhatsApp ? 'text-green-500' : 'text-muted-foreground'}`} />
                  Enviar Link por WhatsApp
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Enviar link de pagamento automaticamente via WhatsApp Master
                </CardDescription>
              </div>
              {masterWhatsAppStatus === 'connected' ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  ✅ Conectado
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                  ❌ Desconectado
                </Badge>
              )}
            </div>
          </CardHeader>
          
          {sendWhatsApp && masterWhatsAppStatus === 'connected' && (
            <CardContent className="space-y-4 pt-0">
              <div>
                <Label htmlFor="whatsapp-phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Número do WhatsApp *
                </Label>
                <Input
                  id="whatsapp-phone"
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Preenchido automaticamente com o telefone do dono da loja
                </p>
              </div>

              {/* Preview da mensagem */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs font-medium text-muted-foreground mb-2">📝 Preview da mensagem:</p>
                <div className="text-xs bg-background rounded-lg p-3 whitespace-pre-wrap border-l-4 border-green-500">
                  {`Olá ${selectedStoreData?.name ? 'Lojista' : ''}! 👋

      Sua fatura do Mostralo está disponível:

      🏪 Loja: ${selectedStoreData?.name || '[Nome da Loja]'}
      💰 Valor: ${formData.amount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(formData.amount)) : 'R$ 0,00'}
      📅 Vencimento: ${formData.due_date ? formatInvoiceDueDate(formData.due_date) : '[Data]'}

      💳 Pague agora pelo link:
      [Link será gerado automaticamente]

      O QR Code PIX será gerado quando você acessar! 🚀`}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                <p className="font-medium text-green-700 dark:text-green-400">
                  📱 Após criar a fatura, o link será enviado automaticamente
                </p>
              </div>
            </CardContent>
          )}

          {sendWhatsApp && masterWhatsAppStatus !== 'connected' && (
            <CardContent className="pt-0">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm">
                <p className="font-medium text-red-700 dark:text-red-400">
                  ⚠️ WhatsApp Master não está conectado
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Conecte o WhatsApp Master nas configurações antes de enviar mensagens.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </>
  );
}
