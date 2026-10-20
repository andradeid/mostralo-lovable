import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { IdleWarningDialog } from '@/components/IdleWarningDialog';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'react-router-dom';

// Só as áreas logadas (painéis). Na vitrine, no acompanhamento e nas páginas
// públicas a inatividade não pode mandar o visitante para a tela de login.
const PANEL_PREFIXES = ['/dashboard', '/vendedor', '/profissional', '/painel-cliente'];

/**
 * Componente que gerencia timeout de inatividade.
 * Só ativa quando o usuário está autenticado.
 * Renderiza o dialog de aviso e executa o hook de monitoramento.
 */
export function IdleTimeoutManager() {
  const { session } = useAuth();
  const { pathname } = useLocation();
  const inPanel = PANEL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Só monitorar inatividade se estiver logado e dentro de um painel
  if (!session || !inPanel) return null;

  return <IdleTimeoutManagerInner />;
}

function IdleTimeoutManagerInner() {
  useIdleTimeout();
  return <IdleWarningDialog />;
}
