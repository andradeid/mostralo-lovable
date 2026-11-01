// SEO da página do produto (título, descrição, imagem e palavras-chave para compartilhamento e ofertas).
import { usePageSEO } from '@/hooks/useSEO';
import { formatPrice } from '@/lib/productPage/pricing';
import type { Product, ProductVariant, Store } from '@/lib/productPage/types';

export function useProductSeo(product: Product | null, store: Store | null, selectedVariant: ProductVariant | null) {
  // SEO configuration - Melhorado para compartilhamento e ofertas
  const currentSEOPrice = selectedVariant
    ? selectedVariant.price
    : (product?.is_on_offer && product?.offer_price ? product?.offer_price : product?.price || 0);

  const originalPrice = product?.is_on_offer && product?.original_price ? product.original_price : null;
  const formattedCurrentPrice = formatPrice(currentSEOPrice);
  const formattedOriginalPrice = originalPrice ? formatPrice(originalPrice) : null;

  // Texto de desconto para SEO
  const discountPercentage = originalPrice && product?.offer_price
    ? Math.round((1 - product.offer_price / originalPrice) * 100)
    : 0;

  const offerPrefix = product?.is_on_offer ? '🔥 OFERTA: ' : '';
  const discountText = discountPercentage > 0 ? ` (${discountPercentage}% OFF - antes ${formattedOriginalPrice})` : '';

  // Título otimizado para compartilhamento
  const seoTitle = product && store
    ? `${offerPrefix}${product.name} por ${formattedCurrentPrice}${discountText} - ${store.name}`
    : 'Carregando produto...';

  // Descrição otimizada para compartilhamento social
  const seoDescription = product && store
    ? `Encontrei este produto incrível e quero compartilhar! ${product.description || product.name} 💰 Por apenas ${formattedCurrentPrice}${discountText} na ${store.name}. ${product?.category?.name ? `Categoria: ${product.category.name} • ` : ''}Peça já pelo WhatsApp!`
    : 'Carregando produto...';

  // Imagem priorizada do produto
  const seoImage = product?.image_url || product?.image_gallery?.[0] || store?.logo_url || '/favicon.png';

  // Keywords otimizadas
  const seoKeywords = [
    product?.name,
    store?.name,
    product?.category?.name,
    'cardápio digital',
    'delivery',
    'pedido online',
    store?.slug,
    product?.is_on_offer ? 'oferta' : '',
    product?.is_on_offer ? 'promoção' : '',
    product?.is_on_offer ? 'desconto' : '',
    'WhatsApp'
  ].filter(Boolean).join(', ');

  usePageSEO({
    title: seoTitle,
    description: seoDescription,
    image: seoImage,
    url: window.location.href,
    type: 'product',
    keywords: seoKeywords,
    price: currentSEOPrice,
    currency: 'BRL',
    availability: 'in stock',
    brand: store?.name || 'Mostralo'
  });
}
