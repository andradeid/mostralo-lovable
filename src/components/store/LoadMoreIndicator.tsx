import { Loader2 } from 'lucide-react';

interface LoadMoreIndicatorProps {
  isLoading: boolean;
  hasMore: boolean;
}

export function LoadMoreIndicator({ isLoading, hasMore }: LoadMoreIndicatorProps) {
  if (!hasMore && !isLoading) {
    return null;
  }

  return (
    <div className="flex justify-center items-center py-8">
      {isLoading ? (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Carregando mais produtos...</span>
        </div>
      ) : null}
    </div>
  );
}
