import { CalendarClock, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PAYOUT_STATUS_LABEL, type PayoutStatus } from '@/lib/partnerPayout';

const STYLE: Record<PayoutStatus, { className: string; variant: 'secondary' | 'outline' | 'default' | 'destructive'; Icon: typeof Clock }> = {
  open: { variant: 'outline', className: 'border-slate-400 text-slate-600 dark:text-slate-300', Icon: CalendarClock },
  pending: { variant: 'secondary', className: '', Icon: Clock },
  requested: { variant: 'outline', className: 'border-amber-500 text-amber-600', Icon: Clock },
  approved: { variant: 'outline', className: 'border-blue-500 text-blue-600', Icon: CheckCircle },
  paid: { variant: 'default', className: 'bg-green-500', Icon: CheckCircle },
  rejected: { variant: 'destructive', className: '', Icon: XCircle },
};

/** Situação de um ciclo de pagamento do parceiro (mesmo visual no painel do parceiro e no master). */
export function PayoutStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STYLE[status as PayoutStatus];
  if (!s) return <Badge variant="secondary" className={className}>{status}</Badge>;
  const { Icon } = s;
  return (
    <Badge variant={s.variant} className={cn(s.className, className)}>
      <Icon className="w-3 h-3 mr-1" />
      {PAYOUT_STATUS_LABEL[status as PayoutStatus]}
    </Badge>
  );
}
