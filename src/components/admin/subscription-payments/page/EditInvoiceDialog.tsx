// Diálogo de editar fatura.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function EditInvoiceDialog({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { selectedInvoice, showEditDialog, setShowEditDialog, formData, setFormData, handleEditInvoice } = ctx;

  return (
    <>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Fatura</DialogTitle>
            <DialogDescription>
              Edite as informações da fatura
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Loja</Label>
              <Input value={selectedInvoice?.stores?.name || ""} disabled />
            </div>
            <div>
              <Label>Plano</Label>
              <Input value={selectedInvoice?.plans?.name || ""} disabled />
            </div>
            <div>
              <Label htmlFor="edit_amount">Valor *</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_due_date">Data de Vencimento *</Label>
              <Input
                id="edit_due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit_notes">Observações</Label>
              <Input
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditInvoice}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
