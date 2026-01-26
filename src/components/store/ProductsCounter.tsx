import { Package } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProductsCounterProps {
  loaded: number;
  total: number;
  isSearching?: boolean;
}

export function ProductsCounter({ loaded, total, isSearching }: ProductsCounterProps) {
  if (total === 0 || isSearching) {
    return null;
  }

  const percentage = Math.min((loaded / total) * 100, 100);
  const showProgress = loaded < total;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-muted/50 rounded-lg mb-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Package className="w-4 h-4" />
        <span>
          Exibindo <strong className="text-foreground">{loaded}</strong> de{' '}
          <strong className="text-foreground">{total}</strong> produtos
        </span>
      </div>
      {showProgress && (
        <Progress value={percentage} className="w-24 h-2" />
      )}
    </div>
  );
}
