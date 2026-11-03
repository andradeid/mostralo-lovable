// Modo Lista (supermercado): último item lido em destaque, tabela da venda, atalhos F2/F3/F4/Del
// e, à direita, total e formas de pagamento. No celular/tablet estreito empilha (total embaixo).
import { Eraser, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PDVSaleProps } from './types';
import { LastItemBanner } from './LastItemBanner';
import { SaleTable } from './SaleTable';
import { SaleTotals } from './SaleTotals';
import { ProductSearchBox } from './ProductSearchBox';
import { HotkeyHints, Kbd } from './HotkeyHints';

export function ListLayout(sale: PDVSaleProps) {
  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0 lg:flex-row">
      <section className="flex min-w-0 flex-col gap-3 lg:min-h-0 lg:flex-1">
        <LastItemBanner item={sale.lastItem} />

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <ProductSearchBox
            storeId={sale.storeId}
            term={sale.searchTerm}
            onTermChange={sale.onSearchChange}
            onPick={sale.onPickProduct}
            className="md:w-96"
          />
          <HotkeyHints className="md:ml-2" />
        </div>

        <SaleTable
          items={sale.cart}
          lastItemId={sale.lastItem?.id}
          onUpdateQuantity={sale.onUpdateQuantity}
          onRemoveItem={sale.onRemoveItem}
          className="min-h-[12rem] max-h-[60vh] lg:max-h-none lg:flex-1"
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={!sale.lastItem} onClick={sale.onRemoveLast}>
            <Undo2 className="mr-2 h-4 w-4" /> Remover último <Kbd className="ml-2">Del</Kbd>
          </Button>
          <Button type="button" variant="outline" disabled={!sale.lastItem} onClick={sale.onEditLast}>
            Quantidade <Kbd className="ml-2">F2</Kbd>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={sale.cart.length === 0}
            onClick={sale.onClearCart}
          >
            <Eraser className="mr-2 h-4 w-4" /> Nova venda
          </Button>
        </div>
      </section>

      <aside className="w-full shrink-0 lg:w-80 xl:w-96">
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
