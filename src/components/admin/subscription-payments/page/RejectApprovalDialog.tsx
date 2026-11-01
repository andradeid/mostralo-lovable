// Diálogo de rejeitar assinante.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Clock, AlertCircle } from "lucide-react";
import { brl } from "@/lib/brl";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function RejectApprovalDialog({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { selectedApproval, showRejectDialog, setShowRejectDialog, rejectionReason, setRejectionReason, processingApproval, handleRejectPayment } = ctx;

  return (
    <>
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>Rejeitar Pagamento</span>
            </DialogTitle>
            <DialogDescription>
              Informe o motivo detalhado da rejeição (obrigatório - mínimo 10 caracteres)
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p><strong>Usuário:</strong> {selectedApproval.profiles?.full_name}</p>
                <p><strong>Email:</strong> {selectedApproval.profiles?.email}</p>
                <p><strong>Empresa:</strong> {selectedApproval.company_name}</p>
                <p><strong>Valor:</strong> {brl(selectedApproval.payment_amount)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Comprovante ilegível, valor incorreto, dados bancários não conferem, etc."
                  rows={4}
                  required
                  className={rejectionReason.length > 0 && rejectionReason.length < 10 ? 'border-red-500' : ''}
                />
                {rejectionReason.length > 0 && rejectionReason.length < 10 && (
                  <p className="text-sm text-red-500">Mínimo 10 caracteres ({rejectionReason.length}/10)</p>
                )}
              </div>
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  ⚠️ O usuário será notificado sobre a rejeição e poderá enviar um novo comprovante.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              disabled={processingApproval}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectPayment}
              disabled={processingApproval}
            >
              {processingApproval ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Rejeitar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
