import { useRef, useState, useCallback, useEffect } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

interface UsePullToRefreshReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  pullDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPull = 120
}: UsePullToRefreshOptions): UsePullToRefreshReturn => {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPullingRef = useRef(false);
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only activate if scrolled to top
    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPullingRef.current = true;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isPullingRef.current = false;
      setIsPulling(false);
      setPullDistance(0);
      return;
    }
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    
    // Only pull down
    if (deltaY > 0) {
      // Apply resistance for natural feel
      const resistance = deltaY / 2.5;
      const distance = Math.min(resistance, maxPull);
      setPullDistance(distance);
      
      // Haptic feedback when reaching threshold
      if (distance >= threshold && pullDistance < threshold) {
        navigator.vibrate?.(10);
      }
      
      e.preventDefault();
    } else {
      setPullDistance(0);
    }
  }, [isRefreshing, maxPull, threshold, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    
    isPullingRef.current = false;
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Hold at threshold during refresh
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    pullDistance,
    isPulling,
    isRefreshing
  };
};
