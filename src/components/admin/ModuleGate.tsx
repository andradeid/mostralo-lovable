import { ReactNode } from 'react';
import { useStoreModules } from '@/hooks/useStoreModules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface ModuleGateProps {
  moduleKey: string;
  storeId: string | null;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ModuleGate - Componente para verificar acesso a módulos
 * 
 * IMPORTANTE: Este componente está preparado para uso futuro.
 * Atualmente NÃO está aplicado em nenhuma página do sistema.
 * 
 * Quando aplicado, verifica se a loja tem acesso ao módulo especificado.
 * Se bloqueado, mostra o fallback ou uma mensagem padrão de "módulo indisponível".
 * 
 * @example
 * <ModuleGate moduleKey="scheduled_orders" storeId={storeId}>
 *   <ScheduledOrdersContent />
 * </ModuleGate>
 */
export function ModuleGate({ 
  moduleKey, 
  storeId, 
  children, 
  fallback 
}: ModuleGateProps) {
  const { hasModule, loading } = useStoreModules(storeId);

  // Enquanto carrega OU não tem storeId, mostra o conteúdo (evita flash de bloqueio)
  if (loading || !storeId) {
    return <>{children}</>;
  }

  // Se tem acesso ao módulo, mostra o conteúdo
  if (hasModule(moduleKey)) {
    return <>{children}</>;
  }

  // Se não tem acesso, mostra fallback ou mensagem padrão
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>Módulo Indisponível</CardTitle>
        <CardDescription>
          Este recurso não está disponível no seu plano atual.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          Entre em contato com o suporte para mais informações sobre como 
          habilitar este módulo para sua loja.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Hook helper para verificar módulo em componentes funcionais
 * Útil quando você precisa apenas do status, não do gate completo
 */
export function useModuleAccess(moduleKey: string, storeId: string | null): {
  hasAccess: boolean;
  loading: boolean;
} {
  const { hasModule, loading } = useStoreModules(storeId);
  
  return {
    hasAccess: hasModule(moduleKey),
    loading,
  };
}
