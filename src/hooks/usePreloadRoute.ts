import { useCallback, useRef } from 'react';
import { routePreloadMap } from '@/config/routePreloads';

// Cache global de rotas já carregadas
const preloadedRoutes = new Set<string>();

/**
 * Hook para preload inteligente de rotas.
 * Retorna uma função que, dado um path, inicia o carregamento da página correspondente.
 */
export function usePreloadRoute() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const preload = useCallback((path: string) => {
    // Evitar preload duplicado
    if (preloadedRoutes.has(path)) {
      return;
    }

    // Buscar função de import para este path
    const importFn = routePreloadMap[path];
    
    if (!importFn) {
      // Rota não mapeada (pode ser rota dinâmica ou não lazy-loaded)
      return;
    }

    // Marcar como preloaded antes de iniciar (evitar race conditions)
    preloadedRoutes.add(path);

    // Iniciar preload silenciosamente
    importFn().catch(() => {
      // Se falhar, remover do cache para permitir retry
      preloadedRoutes.delete(path);
    });
  }, []);

  /**
   * Versão com debounce para uso em hover.
   * Só dispara o preload se o mouse permanecer sobre o elemento por 100ms.
   */
  const preloadWithDebounce = useCallback((path: string) => {
    // Cancelar preload anterior pendente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      preload(path);
    }, 100);
  }, [preload]);

  /**
   * Cancelar preload pendente (para uso no onMouseLeave).
   */
  const cancelPreload = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    preload,
    preloadWithDebounce,
    cancelPreload,
    isPreloaded: (path: string) => preloadedRoutes.has(path),
  };
}
