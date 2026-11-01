// Diálogo de aprovar assinante.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, Clock, CheckCircle2 } from "lucide-react";
import { brl } from "@/lib/brl";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function ApprovalDialog({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { selectedApproval, showApprovalDialog, setShowApprovalDialog, processingApproval, handleApprovePayment } = ctx;

  return (
    <>
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Aprovar Pagamento</span>
            </DialogTitle>
            <DialogDescription>
              Confirme a aprovação deste pagamento e ativação da conta
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p><strong>Usuário:</strong> {selectedApproval.profiles?.full_name}</p>
                <p><strong>Email:</strong> {selectedApproval.profiles?.email}</p>
                <p><strong>Empresa:</strong> {selectedApproval.company_name}</p>
                <p><strong>Documento:</strong> {selectedApproval.company_document}</p>
                <p><strong>Telefone:</strong> {selectedApproval.phone}</p>
                <p><strong>Plano:</strong> {selectedApproval.plans?.name}</p>
                <p><strong>Valor:</strong> {brl(selectedApproval.payment_amount)}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✓ Ao aprovar, a conta do usuário será ativada imediatamente e ele terá acesso completo ao sistema.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={processingApproval}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleApprovePayment}
              disabled={processingApproval}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingApproval ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Aprovando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
