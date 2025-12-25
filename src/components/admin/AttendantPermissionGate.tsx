import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useAttendantPermissions, type PermissionKey } from '@/hooks/useAttendantPermissions';
import { Loader2, ShieldX } from 'lucide-react';
import { useStoreAccess } from '@/hooks/useStoreAccess';

interface AttendantPermissionGateProps {
  children: ReactNode;
  permissionKey: PermissionKey;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Componente que verifica se o atendente tem permissão para acessar uma funcionalidade.
 * - Se não for atendente, permite acesso (admins têm acesso total)
 * - Se for atendente e tiver permissão, permite acesso
 * - Se for atendente e NÃO tiver permissão, mostra fallback ou redireciona
 */
export function AttendantPermissionGate({ 
  children, 
  permissionKey,
  fallback,
  redirectTo = '/dashboard'
}: AttendantPermissionGateProps) {
  const { user, userRole } = useAuth();
  const { storeId } = useStoreAccess();
  
  // Se não for atendente, permite acesso (admins têm acesso total)
  if (userRole !== 'attendant') {
    return <>{children}</>;
  }

  // Se não tiver user ou storeId, mostra loading
  if (!user?.id || !storeId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AttendantPermissionCheck
      userId={user.id}
      storeId={storeId}
      permissionKey={permissionKey}
      fallback={fallback}
      redirectTo={redirectTo}
    >
      {children}
    </AttendantPermissionCheck>
  );
}

// Componente interno que faz a verificação
function AttendantPermissionCheck({
  children,
  userId,
  storeId,
  permissionKey,
  fallback,
  redirectTo,
}: {
  children: ReactNode;
  userId: string;
  storeId: string;
  permissionKey: PermissionKey;
  fallback?: ReactNode;
  redirectTo: string;
}) {
  const { loading, hasPermission } = useAttendantPermissions({ userId, storeId });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasAccess = hasPermission(permissionKey);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Fallback padrão: mensagem de acesso negado
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <ShieldX className="w-12 h-12 text-destructive" />
        <div className="text-center">
          <h3 className="font-semibold text-lg">Acesso Restrito</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Você não tem permissão para acessar esta funcionalidade.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Entre em contato com o administrador da loja.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
