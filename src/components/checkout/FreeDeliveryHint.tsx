import { Truck } from 'lucide-react';
import type { FreeDeliveryProgress } from '@/lib/freeDeliveryProgress';
import { cn } from '@/lib/utils';

interface Props {
  progress: FreeDeliveryProgress;
  message: string | null;
  className?: string;
}

/** Faixa discreta de frete grátis (carrinho e resumo do checkout). */
export function FreeDeliveryHint({ progress, message, className }: Props) {
  if (!message || progress.state === 'none') return null;
  const reached = progress.state === 'reached';
  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium',
        reached
          ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
          : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <Truck className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
