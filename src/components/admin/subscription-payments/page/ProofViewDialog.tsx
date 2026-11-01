// Diálogo do comprovante.
// JSX movido da SubscriptionPaymentsManagementPage sem mudança.
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, ExternalLink } from "lucide-react";
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
              {selectedProofUrl && (() => {
                // Verifica se é uma URL válida (http/https)
                const isValidUrl = selectedProofUrl.startsWith('http://') || selectedProofUrl.startsWith('https://');
                
                if (!isValidUrl) {
                  // É apenas texto (ex: "PIX confirmado via webhook...")
                  return (
                    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                      <CheckCircle2 className="w-16 h-16 text-green-500" />
                      <p className="text-sm text-muted-foreground max-w-md">{selectedProofUrl}</p>
                    </div>
                  );
                }
                
                const ext = selectedProofUrl.split(".").pop()?.toLowerCase().split("?")[0];
                const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
                
                if (isImage) {
                  return (
                    <img
                      src={selectedProofUrl}
                      alt="Comprovante de Pagamento"
                      className="max-w-full h-auto rounded-lg"
                    />
                  );
                } else {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <svg
                        className="w-16 h-16 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm text-muted-foreground">Arquivo PDF ou documento</p>
                    </div>
                  );
                }
              })()}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowProofDialog(false)}>
                Fechar
              </Button>
              {selectedProofUrl && (selectedProofUrl.startsWith('http://') || selectedProofUrl.startsWith('https://')) && (
                <Button onClick={() => window.open(selectedProofUrl, "_blank")} className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Abrir em nova aba
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
