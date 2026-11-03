// Leitor de código de barras no PDV (balcão): produto lido entra no carrinho com quantidade 1
// (ler de novo soma 1). Com a aba Comandas aberta, pede para escolher a comanda.
// Funciona sem campo focado; na busca de produto, a leitura limpa o campo.
// Produto vendido por quilo não entra direto: a tela pede o peso (onWeigh).
import { toast } from 'sonner';
import { useProductScan, SCAN_TOAST_ID, type ScannedProduct } from '@/hooks/barcode/useProductScan';
import { scanAddedMessage } from '@/lib/barcode/scanRules';
import type { CartItem } from '@/hooks/usePDV';

interface Options {
  storeId: string | null;
  /** Aba Comandas na tela: a leitura não vai para o carrinho. */
  comandasTabActive: boolean;
  addScannedToCart: (item: Omit<CartItem, 'id' | 'total_price'>) => void;
  clearSearch: () => void;
  /** Produto por quilo lido: abre o peso. */
  onWeigh: (product: ScannedProduct) => void;
}

export function usePDVScan({ storeId, comandasTabActive, addScannedToCart, clearSearch, onWeigh }: Options) {
  return useProductScan({
    storeId,
    typedSearchCodes: true,
    onClearSearch: clearSearch,
    onProduct: (product) => {
      if (comandasTabActive) {
        toast.info('Selecione uma comanda', {
          id: SCAN_TOAST_ID,
          description: `Abra a comanda para lançar ${product.name}, ou volte à aba do PDV.`,
        });
        return;
      }
      if (product.sold_by_weight) {
        onWeigh(product);
        return;
      }
      addScannedToCart({
        product_id: product.id,
        product_name: product.name,
        image_url: product.image_url || undefined,
        unit_price: Number(product.price),
        quantity: 1,
        barcode: product.barcode,
      });
      toast.success(scanAddedMessage(product.name), { id: SCAN_TOAST_ID, duration: 1500 });
    },
  });
}
