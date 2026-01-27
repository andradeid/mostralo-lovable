import { Package } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PDVProductsCounterProps {
  loaded: number;
  total: number;
  isSearching?: boolean;
}

export function PDVProductsCounter({ loaded, total, isSearching }: PDVProductsCounterProps) {
  if (total === 0 || isSearching) {
    return null;
  }

  const percentage = Math.min((loaded / total) * 100, 100);
  const showProgress = loaded < total;

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1.5 bg-muted/50 rounded-lg text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Package className="w-3.5 h-3.5" />
        <span>
          <strong className="text-foreground">{loaded}</strong> de{' '}
          <strong className="text-foreground">{total}</strong>
        </span>
      </div>
      {showProgress && (
        <Progress value={percentage} className="w-16 h-1.5" />
      )}
    </div>
  );
}
