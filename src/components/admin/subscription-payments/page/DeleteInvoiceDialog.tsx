// Diálogo de excluir fatura.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { formatInvoiceDueDate } from "@/lib/invoiceDate";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function DeleteInvoiceDialog({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { selectedInvoice, showDeleteDialog, setShowDeleteDialog, handleDeleteInvoice } = ctx;

  return (
    <>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta fatura? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <p><strong>Loja:</strong> {selectedInvoice.stores?.name}</p>
              <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInvoice.amount)}</p>
              <p><strong>Vencimento:</strong> {formatInvoiceDueDate(selectedInvoice.due_date)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvoice}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Fatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
