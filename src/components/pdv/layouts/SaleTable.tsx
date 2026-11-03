// Tabela da venda (modo Lista e pedido do modo Misto): #, Produto, Código, Qtd, Unit., Total.
// A linha do último item fica destacada e sempre à vista.
import { useEffect, useRef } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { formatKg } from '@/lib/pdv/weight';
import type { CartItem } from '@/hooks/usePDV';

interface Props {
  items: CartItem[];
  lastItemId?: string | null;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  /** Esconde a coluna Código (pedido do modo Misto). */
  compact?: boolean;
  className?: string;
}

export function SaleTable({ items, lastItemId, onUpdateQuantity, onRemoveItem, compact = false, className }: Props) {
  const lastRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    lastRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [lastItemId, items.length]);

  return (
    <div className={cn('min-h-0 overflow-auto rounded-xl border bg-card', className)}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-[1] bg-muted/95 text-xs uppercase text-muted-foreground backdrop-blur">
          <tr>
            <th className="w-10 px-3 py-2 text-left font-semibold">#</th>
            <th className="px-3 py-2 text-left font-semibold">Produto</th>
            {!compact && <th className="hidden px-3 py-2 text-left font-semibold md:table-cell">Código</th>}
            <th className="px-3 py-2 text-center font-semibold">Qtd</th>
            {!compact && <th className="hidden px-3 py-2 text-right font-semibold sm:table-cell">Unit.</th>}
            <th className="px-3 py-2 text-right font-semibold">Total</th>
            <th className="w-10 px-1 py-2"><span className="sr-only">Remover</span></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={compact ? 5 : 7} className="px-3 py-10 text-center text-muted-foreground">
                Nenhum item na venda.
              </td>
            </tr>
          ) : (
            items.map((item, i) => {
              const isLast = item.id === lastItemId;
              const weighed = item.weight_kg != null;
              return (
                <tr
                  key={item.id}
                  ref={isLast ? lastRowRef : undefined}
                  className={cn('border-t transition-colors', isLast ? 'bg-primary/10 font-medium' : 'hover:bg-muted/40')}
                >
                  <td className={cn('px-3 py-2 tabular-nums text-muted-foreground', isLast && 'border-l-4 border-l-primary pl-2')}>{i + 1}</td>
                  <td className="px-3 py-2">
                    <span className="line-clamp-2 break-words">{item.product_name}</span>
                    {compact && (
                      <span className="block text-xs text-muted-foreground tabular-nums">
                        {weighed
                          ? `${formatKg(item.weight_kg!)} kg × ${formatCurrency(item.price_per_kg ?? 0)}/kg`
                          : `${formatCurrency(item.unit_price)} cada`}
                      </span>
                    )}
                    {item.notes && <span className="block text-xs italic text-muted-foreground">Obs: {item.notes}</span>}
                  </td>
                  {!compact && (
                    <td className="hidden px-3 py-2 font-mono text-xs text-muted-foreground md:table-cell">{item.barcode || '—'}</td>
                  )}
                  <td className="px-1 py-1">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        aria-label="Diminuir"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-7 text-center tabular-nums">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        aria-label="Aumentar"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  {!compact && <td className="hidden px-3 py-2 text-right tabular-nums sm:table-cell">
                    {weighed ? (
                      <span title={`${formatKg(item.weight_kg!)} kg × ${formatCurrency(item.price_per_kg ?? 0)}/kg`}>
                        {formatCurrency(item.unit_price)}
                      </span>
                    ) : (
                      formatCurrency(item.unit_price)
                    )}
                  </td>}
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCurrency(item.total_price)}</td>
                  <td className="px-1 py-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onRemoveItem(item.id)}
                      aria-label={`Remover ${item.product_name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
