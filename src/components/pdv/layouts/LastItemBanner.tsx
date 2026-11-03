// Faixa escura do modo Lista: o último item lido/lançado em destaque.
import { ScanBarcode } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatKg } from '@/lib/pdv/weight';
import type { CartItem } from '@/hooks/usePDV';

export function LastItemBanner({ item }: { item: CartItem | null }) {
  const code = item?.barcode;
  return (
    <div className="rounded-xl bg-zinc-900 px-4 py-3 text-white shadow-sm dark:bg-zinc-950 dark:ring-1 dark:ring-white/10 sm:px-5 sm:py-4">
      {item ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Último item</p>
            <p className="truncate text-xl font-bold leading-tight sm:text-3xl" title={item.product_name}>
              {item.product_name}
            </p>
            <p className="mt-1 text-sm text-zinc-300 tabular-nums">
              {code ? <span className="font-mono">{code} · </span> : null}
              {item.weight_kg != null
                ? `${formatKg(item.weight_kg)} kg × ${formatCurrency(item.price_per_kg ?? 0)}/kg`
                : `${item.quantity} × ${formatCurrency(item.unit_price)}`}
            </p>
          </div>
          <p className="shrink-0 text-3xl font-extrabold tabular-nums text-primary sm:text-4xl">
            {formatCurrency(item.total_price)}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 py-2 text-zinc-300">
          <ScanBarcode className="h-8 w-8 shrink-0 text-primary" />
          <div>
            <p className="text-lg font-semibold text-white">Passe o código de barras</p>
            <p className="text-sm">Ou aperte F3 para buscar pelo nome.</p>
          </div>
        </div>
      )}
    </div>
  );
}
