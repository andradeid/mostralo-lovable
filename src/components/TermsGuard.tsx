import { ReactNode } from 'react';
import { useTermsReAccept } from '@/hooks/useTermsReAccept';
import { TermsReAcceptModal } from './TermsReAcceptModal';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface TermsGuardProps {
  children: ReactNode;
}

export const TermsGuard = ({ children }: TermsGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { needsReAccept, isLoading, currentVersion, changelog, acceptTerms } = useTermsReAccept();

  // Não mostrar nada enquanto carrega auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não está autenticado, apenas renderiza children (deixa rotas públicas passarem)
  if (!user) {
    return <>{children}</>;
  }

  // Enquanto verifica versão dos termos
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verificando termos de uso...</p>
        </div>
      </div>
    );
  }

  // Se precisa re-aceitar, mostra modal bloqueante
  if (needsReAccept && currentVersion) {
    return (
      <>
        {/* Fundo escurecido bloqueando a interface */}
        <div className="min-h-screen bg-background/80 backdrop-blur-sm">
          {children}
        </div>
        <TermsReAcceptModal
          open={true}
          currentVersion={currentVersion}
          changelog={changelog}
          onAccept={acceptTerms}
        />
      </>
    );
  }

  // Termos aceitos, renderiza normalmente
  return <>{children}</>;
};
