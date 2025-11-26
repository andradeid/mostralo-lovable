import { useImpersonation } from '@/hooks/useImpersonation';
import { Button } from '@/components/ui/button';
import { UserCheck, X } from 'lucide-react';

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUser, stopImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonatedUser) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning text-warning-foreground px-4 py-2 shadow-lg">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          <span className="text-sm font-medium">
            Modo Admin: Visualizando como <strong>{impersonatedUser.full_name}</strong> ({impersonatedUser.email})
          </span>
        </div>
        <Button
          onClick={stopImpersonation}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          <X className="h-4 w-4 mr-2" />
          Voltar ao Admin
        </Button>
      </div>
    </div>
  );
}
