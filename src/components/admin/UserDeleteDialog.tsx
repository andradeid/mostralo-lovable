import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  onSuccess: () => void;
}

export function UserDeleteDialog({ open, onOpenChange, user, onSuccess }: UserDeleteDialogProps) {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const { deleteUser, loading } = useUserManagement();

  const handleSubmit = async () => {
    if (!user || !confirmed) return;

    try {
      await deleteUser(user.id, reason);
      onSuccess();
      onOpenChange(false);
      setReason('');
      setConfirmed(false);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setReason('');
    setConfirmed(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Usuário
          </DialogTitle>
          <DialogDescription>
            Excluir <strong>{user.full_name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p><strong>Importante:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Esta ação pode ser revertida</li>
              <li>O usuário perderá acesso ao sistema</li>
              <li>Dados serão preservados para auditoria</li>
              <li>Pedidos e histórico não serão afetados</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da exclusão (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Digite o motivo da exclusão..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <label
              htmlFor="confirm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Confirmo que desejo excluir este usuário
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading || !confirmed}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Excluir Usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
