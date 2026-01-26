import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '100px',
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<HTMLDivElement>(null);
  const observerInstance = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    // Disconnect previous observer
    if (observerInstance.current) {
      observerInstance.current.disconnect();
    }

    // Create new observer
    observerInstance.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    // Observe element
    if (observerRef.current) {
      observerInstance.current.observe(observerRef.current);
    }

    return () => {
      if (observerInstance.current) {
        observerInstance.current.disconnect();
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  return observerRef;
}
