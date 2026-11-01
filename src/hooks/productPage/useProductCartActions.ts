// Ações da página do produto: adicionar ao carrinho (com sabores, adicionais e promoção),
// upsell, pedir pelo WhatsApp e compartilhar.
import type { NavigateFunction } from 'react-router-dom';
import type { useCart } from '@/contexts/CartContext';
import { cartItemId, cartItemName, cartUnitPrice, formatPrice, whatsAppOrderMessage } from '@/lib/productPage/pricing';
import type { AddonCategory, PizzaFlavorsPricing, Product, ProductVariant, SelectedAddons, Store } from '@/lib/productPage/types';
import type { Toast } from './useProductAddons';
import type { ProductPageUI } from './useProductPageUI';

type AddItem = ReturnType<typeof useCart> extends { addItem: infer T } ? T : never;

interface Params {
  store: Store | null;
  product: Product | null;
  storeSlug: string | null | undefined;
  selectedVariant: ProductVariant | null;
  addonCategories: AddonCategory[];
  selectedAddons: SelectedAddons;
  calculateAddonsPrice: () => number;
  validateRequiredAddons: () => boolean;
  pf: PizzaFlavorsPricing & { others: (string | null)[] };
  promotionFinalPrice: number | null | undefined;
  discountInfo: { source?: string } | null | undefined;
  storeStatus: { canAddToCart: boolean; scheduledOrdersEnabled: boolean };
  addItem: AddItem;
  ui: ProductPageUI;
  toast: Toast;
  navigate: NavigateFunction;
}

export function useProductCartActions({
  store,
  product,
  storeSlug,
  selectedVariant,
  addonCategories,
  selectedAddons,
  calculateAddonsPrice,
  validateRequiredAddons,
  pf,
  promotionFinalPrice,
  discountInfo,
  storeStatus,
  addItem,
  ui,
  toast,
  navigate,
}: Params) {
  const { quantity, observations, setShowUpsellModal, setUpsellTriggerProductId } = ui;

  const handleAddToCart = () => {
    if (!product) return;

    // Verificar se pode adicionar ao carrinho
    if (!storeStatus.canAddToCart) {
      toast({
        title: "⏸️ Serviço pausado",
        description: storeStatus.scheduledOrdersEnabled
          ? "Adicione produtos e escolha um horário de agendamento no checkout."
          : "Não estamos aceitando pedidos no momento.",
        variant: "destructive"
      });
      return;
    }

    if (!validateRequiredAddons()) {
      toast({
        title: "Adicionais obrigatórios",
        description: "Selecione todos os adicionais obrigatórios antes de adicionar ao carrinho.",
        variant: "destructive"
      });
      return;
    }

    if (pf.active && (!pf.complete || pf.price === null)) {
      toast({
        title: "Escolha os sabores",
        description: `Falta escolher ${pf.others.filter((x) => !x).length > 1 ? 'os outros sabores' : 'o outro sabor'} da pizza.`,
        variant: "destructive"
      });
      return;
    }

    const currentPrice = cartUnitPrice(pf, promotionFinalPrice, selectedVariant, product);
    const addonsPrice = calculateAddonsPrice();
    const fullName = cartItemName(pf, product, selectedVariant, addonCategories, selectedAddons);

    addItem({
      id: cartItemId(product, selectedVariant, selectedAddons, pf.otherIds),
      name: fullName,
      price: currentPrice + addonsPrice,
      image_url: product.image_url,
      category_id: product.category_id ?? null
    }, quantity);

    toast({
      title: "Produto adicionado!",
      description: `${quantity}x ${product.name}${discountInfo?.source === 'promotion' ? ' com promoção aplicada' : ''} adicionado ao carrinho.`,
    });

    // Mostrar modal de upsell
    setUpsellTriggerProductId(product.id);
    setShowUpsellModal(true);
  };

  const handleUpsellAccept = (upsellProduct: { id: string; name: string; price: number; image_url: string | null; quantity: number }) => {
    addItem({
      id: upsellProduct.id,
      name: upsellProduct.name,
      price: upsellProduct.price,
      image_url: upsellProduct.image_url
    }, upsellProduct.quantity);
    toast({
      title: "Upsell adicionado!",
      description: `${upsellProduct.quantity}x ${upsellProduct.name} adicionado ao carrinho.`,
    });
  };

  // Recusar fecha a janela; a volta para a loja fica com o fechamento da janela (antes navegava 2 vezes)
  const handleUpsellDecline = () => {
    setShowUpsellModal(false);
    setUpsellTriggerProductId(null);
  };

  const sendWhatsAppMessage = () => {
    if (!store || !product) return;

    if (!validateRequiredAddons()) {
      toast({
        title: "Adicionais obrigatórios",
        description: "Selecione todos os adicionais obrigatórios antes de fazer o pedido.",
        variant: "destructive"
      });
      return;
    }

    // Pizza de vários sabores: só pede com todos os sabores escolhidos
    if (pf.active && (!pf.complete || pf.price === null)) {
      toast({
        title: "Escolha os sabores",
        description: `Falta escolher ${pf.others.filter((x) => !x).length > 1 ? 'os outros sabores' : 'o outro sabor'} da pizza.`,
        variant: "destructive"
      });
      return;
    }

    const message = whatsAppOrderMessage(pf, product, selectedVariant, addonCategories, selectedAddons, quantity, observations, promotionFinalPrice);

    const whatsappUrl = `https://wa.me/55${store.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareProduct = async () => {
    const offerPrefix = product?.is_on_offer ? '🔥 OFERTA: ' : '';
    const currentPrice = selectedVariant
      ? selectedVariant.price
      : (product?.is_on_offer && product?.offer_price ? product?.offer_price : product?.price || 0);
    const formattedPrice = formatPrice(currentPrice);
    const originalPrice = product?.is_on_offer && product?.original_price ? product.original_price : null;
    const discountText = originalPrice ? ` (${Math.round((1 - currentPrice / originalPrice) * 100)}% OFF)` : '';

    const shareData = {
      title: `${offerPrefix}${product?.name} por ${formattedPrice} - ${store?.name}`,
      text: `Encontrei este produto incrível e quero compartilhar! ${product?.description || product?.name} 💰 Por apenas ${formattedPrice}${discountText} na ${store?.name}. Peça já pelo WhatsApp!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to copy URL
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copiado!",
          description: "O link do produto foi copiado para a área de transferência.",
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link do produto foi copiado para a área de transferência.",
      });
    }
  };

  return { handleAddToCart, handleUpsellAccept, handleUpsellDecline, sendWhatsAppMessage, shareProduct };
}
