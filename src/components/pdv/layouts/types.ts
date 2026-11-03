// Estado da venda repassado igual para os três modos do PDV (o carrinho, o caixa e o
// pagamento são os mesmos; cada modo só muda a tela). Montado por usePDVSaleControls.
import type { CartItem } from '@/hooks/usePDV';
import type { WeighableProduct } from '@/lib/pdv/weight';

/** Produto escolhido na busca, no atalho ou na grade (pesado ou não). */
export interface PDVPickProduct extends WeighableProduct {
  sold_by_weight?: boolean | null;
}

export interface WeighingState {
  product: PDVPickProduct;
  /** Pesando de novo uma linha do carrinho (F2 num item por quilo). */
  replaceItemId?: string;
  initialKg?: number;
}

export interface PDVSaleProps {
  storeId: string | null;
  cart: CartItem[];
  subtotal: number;
  lastItem: CartItem | null;
  /** Busca/atalho: 1 unidade (soma na linha igual) ou abre o peso. */
  onPickProduct: (product: PDVPickProduct) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onRemoveLast: () => void;
  onClearCart: () => void;
  /** F2: quantidade (ou peso) do último item. */
  onEditLast: () => void;
  /** F4 / botões das formas: abre o pagamento (com a forma já escolhida). */
  onPay: (method?: string) => void;
  canPay: boolean;
  payBlockedReason?: string;
  isProcessing: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  /** Peso em andamento (o modo Misto mostra no painel; os outros, num diálogo). */
  weighing: WeighingState | null;
  onConfirmWeight: (kg: number) => void;
  onCancelWeight: () => void;
  canManageProducts: boolean;
}
