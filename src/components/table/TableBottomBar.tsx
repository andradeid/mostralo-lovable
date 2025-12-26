import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface TableBottomBarProps {
  total: number;
  itemsCount: number;
  onViewComanda: () => void;
}

export function TableBottomBar({ total, itemsCount, onViewComanda }: TableBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Total consumido</p>
        <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
      </div>
      <Button variant="outline" onClick={onViewComanda}>
        Ver Comanda ({itemsCount})
      </Button>
    </div>
  );
}
