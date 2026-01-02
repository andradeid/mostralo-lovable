import { ArrowDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
  threshold?: number;
}

export const PullToRefreshIndicator = ({
  pullDistance,
  isPulling,
  isRefreshing,
  threshold = 80
}: PullToRefreshIndicatorProps) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const isTriggered = pullDistance >= threshold;
  
  // Only show when pulling or refreshing
  if (!isPulling && !isRefreshing && pullDistance === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        "absolute top-0 left-0 right-0 flex items-center justify-center",
        "transition-opacity duration-200",
        (isPulling || isRefreshing) ? "opacity-100" : "opacity-0"
      )}
      style={{ 
        height: `${Math.max(pullDistance, isRefreshing ? threshold : 0)}px`,
        minHeight: isRefreshing ? '60px' : '0px'
      }}
    >
      <div className="flex flex-col items-center gap-1">
        {isRefreshing ? (
          <>
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Atualizando...</span>
          </>
        ) : (
          <>
            <ArrowDown 
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-100",
                isTriggered && "text-primary"
              )}
              style={{ 
                transform: `rotate(${isTriggered ? 180 : progress * 180}deg)`,
                opacity: Math.max(0.3, progress)
              }}
            />
            <span className="text-xs text-muted-foreground">
              {isTriggered ? "Solte para atualizar" : "Puxe para atualizar"}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
