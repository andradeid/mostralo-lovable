// Diálogo de pago por fora.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, FileCheck } from "lucide-react";
import { brl } from "@/lib/brl";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function PaidExternallyDialog({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { selectedApproval, processingApproval, showPaidExternallyDialog, setShowPaidExternallyDialog, paidExternallyAmount, setPaidExternallyAmount, paidExternallyNotes, setPaidExternallyNotes, handlePaidExternally } = ctx;

  return (
    <>
      <Dialog open={showPaidExternallyDialog} onOpenChange={setShowPaidExternallyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-green-500" />
              <span>Marcar como Pago por Fora</span>
            </DialogTitle>
            <DialogDescription>
              Aprove este pagamento confirmando que foi recebido por fora do sistema (transferência manual, dinheiro, etc.)
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p><strong>Usuário:</strong> {selectedApproval.profiles?.full_name}</p>
                <p><strong>Email:</strong> {selectedApproval.profiles?.email}</p>
                <p><strong>Empresa:</strong> {selectedApproval.company_name}</p>
                <p><strong>Plano:</strong> {selectedApproval.plans?.name}</p>
                <p><strong>Valor Original:</strong> {brl(selectedApproval.payment_amount)}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paid-externally-amount">Valor Pago (pode alterar se houve desconto)</Label>
                <Input
                  id="paid-externally-amount"
                  type="number"
                  step="0.01"
                  value={paidExternallyAmount}
                  onChange={(e) => setPaidExternallyAmount(e.target.value)}
                  placeholder="Ex: 147.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paid-externally-notes">Observações (opcional)</Label>
                <Textarea
                  id="paid-externally-notes"
                  value={paidExternallyNotes}
                  onChange={(e) => setPaidExternallyNotes(e.target.value)}
                  placeholder="Ex: Pago via PIX manual, transferência bancária, etc."
                  rows={3}
                />
              </div>
              
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✅ A loja será ativada e uma fatura será registrada como paga no sistema.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaidExternallyDialog(false);
                setPaidExternallyAmount("");
                setPaidExternallyNotes("");
              }}
              disabled={processingApproval}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePaidExternally}
              disabled={processingApproval}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingApproval ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
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
