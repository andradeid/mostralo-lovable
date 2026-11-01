import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { RECEIPT_BUCKETS } from "@/lib/privateFiles";
import { PrivateFileLink, PrivateFilePreview } from "@/components/shared/PrivateFile";

// Comprovante em bucket privado (dental-payment-receipts): link assinado gerado na hora.

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
            <PrivateFilePreview
              value={attachmentUrl}
              bucket={RECEIPT_BUCKETS.dental}
              alt="Comprovante de pagamento"
              imageClassName="w-full h-auto max-h-96 object-contain"
              documentLabel="Arquivo PDF"
              openButton="none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button asChild className="gap-2">
              <PrivateFileLink value={attachmentUrl} bucket={RECEIPT_BUCKETS.dental}>
                <ExternalLink className="w-4 h-4" />
                Abrir
              </PrivateFileLink>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}