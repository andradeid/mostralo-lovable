import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Ban, CheckCircle } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';

interface UserBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    full_name: string;
    email: string;
    is_blocked: boolean;
  } | null;
  onSuccess: () => void;
}

export function UserBlockDialog({ open, onOpenChange, user, onSuccess }: UserBlockDialogProps) {
  const [reason, setReason] = useState('');
  const { blockUser, unblockUser, loading } = useUserManagement();

  const handleSubmit = async () => {
    if (!user) return;

    try {
      if (user.is_blocked) {
        await unblockUser(user.id);
      } else {
        if (!reason.trim()) {
          return;
        }
        await blockUser(user.id, reason);
      }
      onSuccess();
      onOpenChange(false);
      setReason('');
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  if (!user) return null;

  const isBlocking = !user.is_blocked;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBlocking ? (
              <>
                <Ban className="h-5 w-5 text-destructive" />
                Bloquear Usuário
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-success" />
                Desbloquear Usuário
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isBlocking ? (
              <>
                Bloqueie <strong>{user.full_name}</strong> ({user.email}).
                O usuário perderá acesso imediatamente ao sistema.
              </>
            ) : (
              <>
                Desbloquear <strong>{user.full_name}</strong> ({user.email}).
                O usuário recuperará o acesso ao sistema.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isBlocking && (
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do bloqueio *</Label>
            <Textarea
              id="reason"
              placeholder="Digite o motivo do bloqueio..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant={isBlocking ? 'destructive' : 'default'}
            onClick={handleSubmit}
            disabled={loading || (isBlocking && !reason.trim())}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isBlocking ? 'Bloquear' : 'Desbloquear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
