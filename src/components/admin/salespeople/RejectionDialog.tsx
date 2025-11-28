import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  salespersonName: string;
}

export function RejectionDialog({
  open,
  onOpenChange,
  onConfirm,
  salespersonName,
}: RejectionDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
      setReason("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rejeitar Vendedor?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Você está prestes a rejeitar <strong>{salespersonName}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Por favor, explique o motivo da rejeição. Esta informação será
                registrada no sistema.
              </p>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Ex: CNPJ com situação cadastral irregular, CNAEs incompatíveis, documentação inconsistente..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason("")}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirmar Rejeição
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
