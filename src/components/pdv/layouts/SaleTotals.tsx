// Lado direito dos modos Lista e Misto: itens, subtotal, desconto, TOTAL, formas de pagamento
// e "Finalizar venda (F4)". O desconto é dado no pagamento (o mesmo diálogo do PDV de sempre).
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { paymentMethods } from '@/components/pdv/PDVPaymentModal';
import type { CartItem } from '@/hooks/usePDV';
import { Kbd } from './HotkeyHints';

interface Props {
  items: CartItem[];
  subtotal: number;
  onPay: (method?: string) => void;
  canPay: boolean;
  payBlockedReason?: string;
  isProcessing: boolean;
  className?: string;
}

export function SaleTotals({ items, subtotal, onPay, canPay, payBlockedReason, isProcessing, className }: Props) {
  const units = items.reduce((acc, i) => acc + i.quantity, 0);
  return (
    <div className={cn('flex flex-col gap-4 rounded-xl border bg-card p-4', className)}>
      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Itens</dt>
          <dd className="tabular-nums">{items.length} {items.length === 1 ? 'linha' : 'linhas'} · {units} un.</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{formatCurrency(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Desconto</dt>
          <dd className="text-muted-foreground">no pagamento</dd>
        </div>
      </dl>

      <div className="rounded-lg bg-primary/10 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Total</p>
        <p className="text-4xl font-extrabold tabular-nums leading-tight text-foreground">{formatCurrency(subtotal)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
        {paymentMethods.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            className="h-11 justify-start gap-2"
            disabled={!canPay}
            onClick={() => onPay(value)}
          >
            <Icon className="h-4 w-4 text-primary" />
            {label}
          </Button>
        ))}
      </div>

      <Button type="button" size="lg" className="h-14 text-base" disabled={!canPay} onClick={() => onPay()}>
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : payBlockedReason ? (
          payBlockedReason
        ) : (
          <>
            Finalizar venda <Kbd className="ml-2 border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground">F4</Kbd>
          </>
        )}
      </Button>
    </div>
  );
}
