// Diálogo de criar fatura.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Loader2 } from "lucide-react";
import { CreateInvoiceFields } from "./CreateInvoiceFields";
import { CreateInvoicePaymentSection } from "./CreateInvoicePaymentSection";
import { CreateInvoiceWhatsAppSection } from "./CreateInvoiceWhatsAppSection";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function CreateInvoiceDialog({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { showCreateDialog, setShowCreateDialog, markAsPaid, creatingInvoice, sendingWhatsApp, handleCreateInvoice } = ctx;
  const busy = creatingInvoice || sendingWhatsApp;

  return (
    <>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Criar Nova Fatura</DialogTitle>
            <DialogDescription>
              Crie uma nova fatura de assinatura manualmente
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-2">
            <CreateInvoiceFields ctx={ctx} />

            <CreateInvoicePaymentSection ctx={ctx} />

            <CreateInvoiceWhatsAppSection ctx={ctx} />
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateInvoice} 
              disabled={busy}
              className={markAsPaid ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {sendingWhatsApp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando WhatsApp...
                </>
              ) : creatingInvoice ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : markAsPaid ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Criar Fatura Paga
                </>
              ) : (
                "Criar Fatura"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
