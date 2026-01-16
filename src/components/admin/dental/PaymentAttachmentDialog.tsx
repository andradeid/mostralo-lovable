import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

interface PaymentAttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachmentUrl: string | null;
  paymentAmount: number;
  paymentDate: string;
}

export function PaymentAttachmentDialog({
  open,
  onOpenChange,
  attachmentUrl,
  paymentAmount,
  paymentDate,
}: PaymentAttachmentDialogProps) {
  if (!attachmentUrl) return null;

  const isImage = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  const handleDownload = () => {
    window.open(attachmentUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Comprovante de Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valor:</span>
            <span className="font-medium">
              R$ {Number(paymentAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Data:</span>
            <span className="font-medium">{paymentDate}</span>
          </div>

          <div className="border rounded-lg overflow-hidden bg-muted/30">
            {isImage(attachmentUrl) ? (
              <img
                src={attachmentUrl}
                alt="Comprovante de pagamento"
                className="w-full h-auto max-h-96 object-contain"
              />
            ) : (
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
                <p className="text-sm text-muted-foreground">Arquivo PDF</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={handleDownload} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Abrir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}