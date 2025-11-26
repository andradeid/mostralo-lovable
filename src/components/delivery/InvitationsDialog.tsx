import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDriverInvitations } from '@/hooks/useDriverInvitations';
import { InvitationCard } from './InvitationCard';
import { Loader2, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InvitationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvitationsDialog({ open, onOpenChange }: InvitationsDialogProps) {
  const { invitations, loading } = useDriverInvitations();
  const navigate = useNavigate();

  const handleViewDetails = (token: string) => {
    onOpenChange(false);
    navigate(`/aceitar-convite/${token}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Convites Pendentes</DialogTitle>
          <DialogDescription>
            Você tem {invitations.length} convite{invitations.length !== 1 ? 's' : ''} de loja
            {invitations.length !== 1 ? 's' : ''} para trabalhar
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum convite pendente no momento</p>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {invitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onViewDetails={() => handleViewDetails(invitation.token)}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
