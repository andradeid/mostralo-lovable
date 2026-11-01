// Criar fatura: pagamento direto.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function CreateInvoicePaymentSection({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { markAsPaid, setMarkAsPaid, paymentDate, setPaymentDate, paymentMethod, setPaymentMethod, pixTransactionId, setPixTransactionId, extendSubscription, setExtendSubscription, monthsToExtend, setMonthsToExtend } = ctx;

  return (
    <>
      {/* Seção de Pagamento Direto (Master Admin) */}
      <Card className={`border-2 transition-all ${markAsPaid ? 'border-green-500 bg-green-500/5' : 'border-dashed border-muted-foreground/30'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="mark-as-paid"
              checked={markAsPaid}
              onChange={(e) => setMarkAsPaid(e.target.checked)}
              className="h-5 w-5 accent-green-500"
            />
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className={`w-5 h-5 ${markAsPaid ? 'text-green-500' : 'text-muted-foreground'}`} />
                Pagamento Direto (Master Admin)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Marcar como já paga (sem comprovante do lojista)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        {markAsPaid && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="payment-date">Data do Pagamento</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="payment-method">Método</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="other">Outro (Dinheiro, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="pix-id">ID da Transação PIX (opcional)</Label>
              <Input
                id="pix-id"
                value={pixTransactionId}
                onChange={(e) => setPixTransactionId(e.target.value)}
                placeholder="Ex: E12345678901234567890123456789012"
                className="font-mono text-sm"
              />
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="extend-subscription"
                  checked={extendSubscription}
                  onChange={(e) => setExtendSubscription(e.target.checked)}
                  className="h-4 w-4 accent-blue-500"
                />
                <div className="flex-1">
                  <Label htmlFor="extend-subscription" className="text-sm font-medium cursor-pointer">
                    Estender assinatura automaticamente
                  </Label>
                </div>
                {extendSubscription && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">+</span>
                    <Select 
                      value={monthsToExtend.toString()} 
                      onValueChange={(v) => setMonthsToExtend(Number(v))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">mês(es)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
              <p className="font-medium text-green-700 dark:text-green-400">
                ✓ A fatura será criada como PAGA automaticamente
              </p>
              {extendSubscription && (
                <p className="text-muted-foreground mt-1">
                  A assinatura será estendida em {monthsToExtend} mês(es)
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </>
  );
}
