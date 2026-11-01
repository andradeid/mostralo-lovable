// Diálogo do comprovante.
// Comprovante em bucket privado: prévia e link com URL assinada.
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import { PrivateFileLink, PrivateFilePreview } from "@/components/shared/PrivateFile";
import { RECEIPT_BUCKETS, isStorageFile } from "@/lib/privateFiles";
import type { SubscriptionPaymentsPageCtx } from "@/hooks/subscriptionPayments/useSubscriptionPaymentsPage";

export function ProofViewDialog({ ctx }: { ctx: SubscriptionPaymentsPageCtx }) {
  const { showProofDialog, setShowProofDialog, selectedProofUrl } = ctx;

  return (
    <>
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
            <DialogDescription>
              Visualize o comprovante enviado pelo lojista
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex justify-center items-center bg-muted rounded-lg p-4 overflow-auto max-h-[60vh]">
              {/* Faturas: bucket subscription-receipts; aprovações chegam com o bucket na referência. */}
              {selectedProofUrl && (
                <PrivateFilePreview
                  value={selectedProofUrl}
                  bucket={RECEIPT_BUCKETS.subscription}
                  alt="Comprovante de Pagamento"
                  openButton="none"
                />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowProofDialog(false)}>
                Fechar
              </Button>
              {isStorageFile(selectedProofUrl, RECEIPT_BUCKETS.subscription) || /^https?:\/\//.test(selectedProofUrl || "") ? (
                <Button asChild className="gap-2">
                  <PrivateFileLink value={selectedProofUrl} bucket={RECEIPT_BUCKETS.subscription}>
                    <ExternalLink className="w-4 h-4" />
                    Abrir em nova aba
                  </PrivateFileLink>
                </Button>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
