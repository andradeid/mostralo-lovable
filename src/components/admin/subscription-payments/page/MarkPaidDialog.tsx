// Diálogo de marcar fatura como paga.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, CheckCircle2, Loader2 } from "lucide-react";
import { formatInvoiceDueDate } from "@/lib/invoiceDate";
import { Switch } from "@/components/ui/switch";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function MarkPaidDialog({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { showMarkPaidDialog, setShowMarkPaidDialog, markPaidInvoice, markPaidMethod, setMarkPaidMethod, markPaidNotes, setMarkPaidNotes, markPaidExtendSub, setMarkPaidExtendSub, processingMarkPaid, handleMarkInvoiceAsPaid } = ctx;

  return (
    <>
      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Marcar Fatura como Paga
            </DialogTitle>
            <DialogDescription>
              Confirme o método de pagamento utilizado
            </DialogDescription>
          </DialogHeader>

          {markPaidInvoice && (
            <div className="space-y-4">
              {/* Info da fatura */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loja:</span>
                  <span className="font-medium">{markPaidInvoice.stores?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plano:</span>
                  <span>{markPaidInvoice.plans?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-bold text-green-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(markPaidInvoice.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vencimento:</span>
                  <span>{formatInvoiceDueDate(markPaidInvoice.due_date)}</span>
                </div>
              </div>

              {/* Método de pagamento */}
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select value={markPaidMethod} onValueChange={setMarkPaidMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX Manual</SelectItem>
                    <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                    <SelectItem value="card">Cartão de Crédito/Débito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  placeholder="Ex: Pagamento recebido via PIX no dia 05/04..."
                  value={markPaidNotes}
                  onChange={(e) => setMarkPaidNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Estender assinatura */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Estender assinatura</Label>
                  <p className="text-xs text-muted-foreground">
                    Renovar automaticamente o período da loja
                  </p>
                </div>
                <Switch
                  checked={markPaidExtendSub}
                  onCheckedChange={setMarkPaidExtendSub}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleMarkInvoiceAsPaid}
              disabled={processingMarkPaid}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {processingMarkPaid ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
