// Diálogo de detalhes da fatura.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Receipt,
  Check,
  X,
  Eye,
  Copy,
  Ticket,
  Link2,
  ExternalLink,
  FileCheck,
} from "lucide-react";
import { formatInvoiceDueDate } from "@/lib/invoiceDate";
import { brl } from "@/lib/brl";
import { extractTransactionId } from "@/lib/subscriptionPayments/transactionId";
import { copyToClipboard } from "@/lib/subscriptionPayments/clipboard";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function InvoiceDetailDialog({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { selectedInvoice, showDetailDialog, setShowDetailDialog, setShowProofDialog, setSelectedProofUrl, handleApproveInvoice, handleRejectInvoice, getStatusBadge } = ctx;

  return (
    <>
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Fatura</DialogTitle>
            <DialogDescription>
              Revise os detalhes e aprove ou rejeite o pagamento
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Loja</p>
                  <p className="font-medium">{selectedInvoice.stores?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lojista</p>
                  <p className="font-medium">{selectedInvoice.stores?.profiles?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plano</p>
                  <p className="font-medium">{selectedInvoice.plans?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="font-medium">
                    {formatInvoiceDueDate(selectedInvoice.due_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedInvoice.payment_status, selectedInvoice.paid_at)}
                  </div>
                </div>
              </div>

              {/* Seção de Cupom/Desconto Aplicado */}
              {selectedInvoice.coupon_info && (
                <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Ticket className="w-5 h-5 text-purple-500" />
                    <p className="font-semibold text-purple-600 dark:text-purple-400">Desconto Aplicado</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Cupom</p>
                      <p className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {selectedInvoice.coupon_info.coupon_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Nome</p>
                      <p className="font-medium">{selectedInvoice.coupon_info.coupon_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo de Desconto</p>
                      <p className="font-medium">
                        {selectedInvoice.coupon_info.discount_type === 'percentage' 
                          ? `${selectedInvoice.coupon_info.discount_value}% de desconto`
                          : `${brl(selectedInvoice.coupon_info.discount_value)} de desconto`
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Economia</p>
                      <p className="font-bold text-green-500">
                        -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.coupon_info.discount_applied)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Original</p>
                      <p className="line-through text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.coupon_info.original_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Valor Final</p>
                      <p className="text-xl font-bold text-green-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {extractTransactionId(selectedInvoice.notes) && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">ID de Transação (EndToEndId)</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-background px-2 py-1 rounded break-all">
                      {extractTransactionId(selectedInvoice.notes)}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(extractTransactionId(selectedInvoice.notes)!)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </div>
              )}

              {selectedInvoice.payment_proof_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Comprovante de Pagamento</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const proofUrl = selectedInvoice.payment_proof_url!;
                      console.log('📎 Abrindo comprovante:', proofUrl);
                      // Primeiro fechar o dialog de detalhes, depois abrir o de comprovante
                      setShowDetailDialog(false);
                      // Pequeno delay para garantir que o primeiro diálogo fechou
                      setTimeout(() => {
                        setSelectedProofUrl(proofUrl);
                        setShowProofDialog(true);
                      }, 100);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Comprovante
                  </Button>
                </div>
              )}

              {selectedInvoice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Links Úteis - Fatura e Recibo */}
              <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/30">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Links Úteis
                </p>
                <div className="space-y-2">
                  {/* Link da Fatura */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground min-w-[60px]">Fatura:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const invoiceLink = `${window.location.origin}/invoice-payment/${selectedInvoice.id}`;
                        navigator.clipboard.writeText(invoiceLink);
                        toast.success('Link da fatura copiado!');
                      }}
                    >
                      <Receipt className="h-3 w-3 mr-1" />
                      Copiar Link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/invoice-payment/${selectedInvoice.id}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Link do Recibo - apenas se pago */}
                  {selectedInvoice.payment_status === 'paid' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground min-w-[60px]">Recibo:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const receiptLink = `${window.location.origin}/invoice-receipt/${selectedInvoice.id}`;
                          navigator.clipboard.writeText(receiptLink);
                          toast.success('Link do recibo copiado!');
                        }}
                      >
                        <FileCheck className="h-3 w-3 mr-1" />
                        Copiar Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/invoice-receipt/${selectedInvoice.id}`, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedInvoice && selectedInvoice.payment_proof_url && selectedInvoice.payment_status === 'pending' && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => handleRejectInvoice(selectedInvoice.id)}
              >
                <X className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                onClick={() => handleApproveInvoice(selectedInvoice.id)}
              >
                <Check className="h-4 w-4 mr-2" />
                Aprovar Pagamento
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
