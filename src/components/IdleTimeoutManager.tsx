import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { IdleWarningDialog } from '@/components/IdleWarningDialog';
import { useAuth } from '@/hooks/use-auth';

/**
 * Componente que gerencia timeout de inatividade.
 * Só ativa quando o usuário está autenticado.
 * Renderiza o dialog de aviso e executa o hook de monitoramento.
 */
export function IdleTimeoutManager() {
  const { session } = useAuth();

  // Só monitorar inatividade se estiver logado
  if (!session) return null;

  return <IdleTimeoutManagerInner />;
}

function IdleTimeoutManagerInner() {
  useIdleTimeout();
  return <IdleWarningDialog />;
}
