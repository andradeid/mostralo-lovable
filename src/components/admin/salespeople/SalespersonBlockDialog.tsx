import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSalespersonManagement } from "@/hooks/useSalespersonManagement";
import { Ban, CheckCircle } from "lucide-react";

interface SalespersonBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesperson: {
    id: string;
    full_name: string;
    is_blocked?: boolean;
    blocked_reason?: string | null;
  } | null;
  onSuccess: () => void;
}

export function SalespersonBlockDialog({
  open,
  onOpenChange,
  salesperson,
  onSuccess,
}: SalespersonBlockDialogProps) {
  const [reason, setReason] = useState("");
  const { loading, blockSalesperson, unblockSalesperson } = useSalespersonManagement();

  if (!salesperson) return null;

  const isBlocked = salesperson.is_blocked;

  const handleSubmit = async () => {
    let success = false;
    if (isBlocked) {
      success = await unblockSalesperson(salesperson.id);
    } else {
      if (!reason.trim()) {
        return;
      }
      success = await blockSalesperson(salesperson.id, reason);
    }

    if (success) {
      setReason("");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBlocked ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Desbloquear Vendedor
              </>
            ) : (
              <>
                <Ban className="h-5 w-5 text-destructive" />
                Bloquear Vendedor
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isBlocked
              ? `Deseja desbloquear ${salesperson.full_name}? O vendedor poderá acessar novamente o painel.`
              : `Bloquear ${salesperson.full_name} impedirá o acesso ao painel de vendedor. O vendedor verá uma tela com o motivo do bloqueio e formas de contato.`}
          </DialogDescription>
        </DialogHeader>

        {!isBlocked && (
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do bloqueio *</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo do bloqueio..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Este motivo será exibido ao vendedor quando ele tentar acessar o painel.
            </p>
          </div>
        )}

        {isBlocked && salesperson.blocked_reason && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">Motivo do bloqueio atual:</p>
            <p className="text-sm mt-1">{salesperson.blocked_reason}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (!isBlocked && !reason.trim())}
            variant={isBlocked ? "default" : "destructive"}
          >
            {loading ? "Processando..." : isBlocked ? "Desbloquear" : "Bloquear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
