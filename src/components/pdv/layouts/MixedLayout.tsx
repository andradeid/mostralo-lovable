// Modo Misto (padaria): atalhos grandes à esquerda (produto por quilo abre o peso no painel),
// à direita o pedido em lista e o total. No celular empilha.
import { Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PDVSaleProps } from './types';
import { ShortcutGrid } from './ShortcutGrid';
import { WeightPanel } from './WeightPanel';
import { SaleTable } from './SaleTable';
import { SaleTotals } from './SaleTotals';
import { ProductSearchBox } from './ProductSearchBox';

export function MixedLayout(sale: PDVSaleProps) {
  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0 lg:flex-row">
      <section className="flex min-w-0 flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-auto lg:pr-1">
        <ProductSearchBox
          storeId={sale.storeId}
          term={sale.searchTerm}
          onTermChange={sale.onSearchChange}
          onPick={sale.onPickProduct}
          placeholder="Outro produto: buscar por nome ou ler código..."
        />
        {sale.weighing && (
          <WeightPanel weighing={sale.weighing} onConfirm={sale.onConfirmWeight} onCancel={sale.onCancelWeight} />
        )}
        <ShortcutGrid storeId={sale.storeId} onPick={sale.onPickProduct} canManage={sale.canManageProducts} />
      </section>

      <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-96 xl:w-[28rem] lg:min-h-0 lg:overflow-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pedido</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={sale.cart.length === 0}
            onClick={sale.onClearCart}
          >
            <Eraser className="mr-1.5 h-4 w-4" /> Nova venda
          </Button>
        </div>
        <SaleTable
          items={sale.cart}
          lastItemId={sale.lastItem?.id}
          onUpdateQuantity={sale.onUpdateQuantity}
          onRemoveItem={sale.onRemoveItem}
          compact
          className="min-h-[10rem] lg:flex-1"
        />
        <SaleTotals
          items={sale.cart}
          subtotal={sale.subtotal}
          onPay={sale.onPay}
          canPay={sale.canPay}
          payBlockedReason={sale.payBlockedReason}
          isProcessing={sale.isProcessing}
        />
      </aside>
    </div>
  );
}
