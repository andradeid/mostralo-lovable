// Controles da venda do PDV compartilhados pelos três modos (Grade, Lista, Misto): busca,
// produto por quilo (peso), F2 quantidade, pagamento com forma escolhida, atalhos de teclado
// e o leitor de código de barras. O carrinho continua em usePDV; o caixa em useCashSession.
// O PDVPage só escolhe o modo e repassa `sale` e os diálogos.
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import type { usePDV } from '@/hooks/usePDV';
import { usePDVScan } from '@/components/pdv/usePDVScan';
import { canManageProducts } from '@/lib/barcode/scanRules';
import { buildWeightedItem, stripWeightSuffix } from '@/lib/pdv/weight';
import type { PDVLayout } from '@/lib/pdv/layout';
import type { PDVPickProduct, PDVSaleProps, WeighingState } from '@/components/pdv/layouts/types';
import { focusPdvSearch, usePDVHotkeys } from './usePDVHotkeys';

type PDVState = ReturnType<typeof usePDV>;

interface Options {
  storeId: string | null;
  pdv: PDVState;
  layout: PDVLayout;
  /** A tela de venda (e não Comandas/Histórico/Caixa) está à vista. */
  saleTabActive: boolean;
  /** Aba Comandas à vista: a leitura não vai para o carrinho. */
  comandasTabActive: boolean;
  salesPaused: boolean;
  /** Ex.: "Abra o caixa para vender". */
  blockedMessage?: string;
}

export function usePDVSaleControls({ storeId, pdv, layout, saleTabActive, comandasTabActive, salesPaused, blockedMessage }: Options) {
  const { userRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [weighing, setWeighing] = useState<WeighingState | null>(null);
  const [quantityOpen, setQuantityOpen] = useState(false);
  const [payment, setPayment] = useState<{ open: boolean; method?: string }>({ open: false });

  const { cart, lastItem, addToCart, addScannedToCart, replaceCartItem, updateCartItemQuantity, removeFromCart, removeLastItem, clearCart, isProcessing } = pdv;

  const startWeighing = useCallback((product: PDVPickProduct) => {
    setWeighing({ product: { id: product.id, name: product.name, price: Number(product.price) || 0, image_url: product.image_url } });
  }, []);

  // Leitor: produto lido entra no carrinho (por quilo abre o peso) — nos três modos
  const scan = usePDVScan({
    storeId,
    comandasTabActive,
    addScannedToCart,
    clearSearch: () => setSearchTerm(''),
    onWeigh: startWeighing,
  });

  const pickProduct = useCallback(
    (product: PDVPickProduct & { barcode?: string | null }) => {
      if (product.sold_by_weight) {
        startWeighing(product);
        return;
      }
      addScannedToCart({
        product_id: product.id,
        product_name: product.name,
        image_url: product.image_url || undefined,
        unit_price: Number(product.price) || 0,
        quantity: 1,
        barcode: product.barcode ?? undefined,
      });
    },
    [addScannedToCart, startWeighing],
  );

  const confirmWeight = useCallback(
    (kg: number) => {
      if (!weighing) return;
      const item = buildWeightedItem(weighing.product, kg);
      if (weighing.replaceItemId) replaceCartItem(weighing.replaceItemId, item);
      else addToCart(item);
      setWeighing(null);
    },
    [weighing, addToCart, replaceCartItem],
  );

  const cancelWeight = useCallback(() => setWeighing(null), []);

  /** F2: quantidade do último item; item por quilo abre o peso para corrigir. */
  const editLast = useCallback(() => {
    if (!lastItem) {
      toast.info('Nenhum item na venda');
      return;
    }
    if (lastItem.weight_kg != null && lastItem.product_id) {
      setWeighing({
        product: { id: lastItem.product_id, name: stripWeightSuffix(lastItem.product_name), price: lastItem.price_per_kg ?? 0, image_url: lastItem.image_url },
        replaceItemId: lastItem.id,
        initialKg: lastItem.weight_kg,
      });
      return;
    }
    setQuantityOpen(true);
  }, [lastItem]);

  const removeLast = useCallback(() => {
    if (!lastItem) return;
    removeLastItem();
    toast(`Removido: ${lastItem.product_name}`, { id: 'pdv-remove-last', duration: 1500 });
  }, [lastItem, removeLastItem]);

  const payBlockedReason = salesPaused ? 'Vendas pausadas' : blockedMessage;
  const canPay = cart.length > 0 && !isProcessing && !payBlockedReason;

  /** F4 / botões das formas de pagamento. */
  const pay = useCallback(
    (method?: string) => {
      if (cart.length === 0) {
        toast.info('Adicione itens antes de finalizar');
        return;
      }
      if (payBlockedReason) {
        toast.error(payBlockedReason);
        return;
      }
      if (isProcessing) return;
      setPayment({ open: true, method });
    },
    [cart.length, payBlockedReason, isProcessing],
  );

  usePDVHotkeys({
    enabled: saleTabActive,
    quantity: editLast,
    search: focusPdvSearch,
    pay: () => pay(),
    removeLast,
  });

  const sale: PDVSaleProps = {
    storeId,
    cart,
    subtotal: pdv.subtotal,
    lastItem,
    onPickProduct: pickProduct,
    onUpdateQuantity: updateCartItemQuantity,
    onRemoveItem: removeFromCart,
    onRemoveLast: removeLast,
    onClearCart: clearCart,
    onEditLast: editLast,
    onPay: pay,
    canPay,
    payBlockedReason,
    isProcessing,
    searchTerm,
    onSearchChange: setSearchTerm,
    weighing,
    onConfirmWeight: confirmWeight,
    onCancelWeight: cancelWeight,
    canManageProducts: canManageProducts(userRole),
  };

  return {
    sale,
    scan,
    /** Grade: produto por quilo clicado abre o peso. */
    startWeighing,
    /** Diálogo de peso (o modo Misto mostra o painel na própria tela). */
    weightDialog: {
      weighing: layout === 'mixed' && saleTabActive ? null : weighing,
      onConfirm: confirmWeight,
      onCancel: cancelWeight,
    },
    quantityDialog: {
      item: lastItem,
      open: quantityOpen,
      onOpenChange: setQuantityOpen,
      onConfirm: updateCartItemQuantity,
    },
    payment: {
      open: payment.open,
      initialMethod: payment.method,
      onOpenChange: (open: boolean) => setPayment((p) => ({ ...p, open })),
    },
  };
}
