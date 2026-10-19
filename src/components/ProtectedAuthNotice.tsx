import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export interface ProtectedAuthNoticeProps {
  error?: string | null;
  onSignOut: () => Promise<void>;
}

// Session failures belong only to protected panels, never to the public shop.
export function ProtectedAuthNotice({ error, onSignOut }: ProtectedAuthNoticeProps) {
  return (
    <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-background text-foreground">
      <p className="max-w-md text-center text-sm">{error || 'Sua conta não tem acesso ao painel'}</p>
      {error ? (
        <Button variant="outline" onClick={() => window.location.reload()}>Recarregar</Button>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => void onSignOut()}>Sair</Button>
          <Button asChild><Link to="/auth">Ir para o login</Link></Button>
        </div>
      )}
    </div>
  );
}