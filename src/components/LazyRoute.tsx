import { Suspense, ComponentType, lazy } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingFallback } from './LoadingFallback';
import { isChunkLoadError, reloadOnceForChunkError } from '@/lib/chunk/chunkReload';

interface LazyRouteProps {
  children: React.ReactNode;
  loadingMessage?: string;
}

/**
 * Wrapper component that provides ErrorBoundary + Suspense for lazy-loaded routes
 */
export function LazyRoute({ children, loadingMessage }: LazyRouteProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Helper function to create a lazy component with retry logic
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: Error | undefined;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error as Error;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    
    // Versão antiga aberta depois de um deploy: recarrega uma vez em vez de mostrar erro
    if (isChunkLoadError(lastError) && reloadOnceForChunkError()) {
      return new Promise<{ default: T }>(() => {});
    }
    throw lastError;
  });
}
