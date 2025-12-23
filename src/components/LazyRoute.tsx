import { Suspense, ComponentType, lazy } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingFallback } from './LoadingFallback';

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
    
    throw lastError;
  });
}
