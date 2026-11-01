import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { depositBadgeState } from '@/lib/bookingDeposit';
import type { DepositBookingLike } from '../../../../supabase/functions/_shared/booking-deposit';

/** Selo "Sinal pendente" / "Sinal pago" das reservas com sinal (não aparece nas demais). */
export function DepositBadge({ booking, className }: { booking: DepositBookingLike; className?: string }) {
  const state = depositBadgeState(booking);
  if (!state) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] h-5 px-1.5 font-medium whitespace-nowrap',
        state === 'pending'
          ? 'border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300'
          : 'border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300',
        className,
      )}
    >
      {state === 'pending' ? 'Sinal pendente' : 'Sinal pago'}
    </Badge>
  );
}
