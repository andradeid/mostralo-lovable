// Nome, descrição, aviso de promoção, selos (% OFF, frete grátis) e o preço do produto.
import { ProductDescription } from '@/components/ProductDescription';
import { brl } from '@/lib/brl';
import { formatPrice } from '@/lib/productPage/pricing';
import type { useProductPromotion } from '@/hooks/useProductPromotion';
import type { AddonCategory, PizzaFlavorsPricing, Product, ProductVariant } from '@/lib/productPage/types';

type PromotionResult = ReturnType<typeof useProductPromotion>;

interface Props {
  product: Product;
  selectedVariant: ProductVariant | null;
  addonCategories: AddonCategory[];
  pf: PizzaFlavorsPricing;
  currentFinalPrice: number;
  eligiblePromotion: PromotionResult extends { eligiblePromotion: infer T } ? T : never;
  bestPromotion: PromotionResult extends { bestPromotion: infer T } ? T : never;
  discountInfo: PromotionResult extends { discountInfo: infer T } ? T : never;
}

export function ProductSummary({
  product,
  selectedVariant,
  addonCategories,
  pf,
  currentFinalPrice,
  eligiblePromotion,
  bestPromotion,
  discountInfo,
}: Props) {
  // Selo de frete grátis mostra o valor mínimo do pedido, quando houver
  const freeDeliveryMin = Number((bestPromotion as any)?.minimum_order_value) || 0;
  const freeDeliveryLabel = freeDeliveryMin > 0
    ? `Frete grátis acima de ${freeDeliveryMin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: Number.isInteger(freeDeliveryMin) ? 0 : 2 })}`
    : 'Frete Grátis';

  return (
    <>
      <div>
        <h1 className="text-xl md:text-2xl font-bold mb-2">{product.name}</h1>
        {product.description && (
          <ProductDescription description={product.description} className="text-sm text-muted-foreground" />
        )}

        {/* Aviso de Promoção Elegível */}
        {eligiblePromotion && (
          <div className="mt-3 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-3 flex items-start gap-2">
            <span className="text-lg">🎁</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900">
                Este produto está em promoção!
              </p>
              <p className="text-xs text-purple-700 mt-0.5">
                {(() => {
                  const p: any = eligiblePromotion;
                  if (p.type === 'bogo') {
                    const buy = p.bogo_buy_quantity || 2;
                    const get = p.bogo_get_quantity || 1;
                    const pct = p.bogo_discount_percentage ?? 100;
                    return pct >= 100
                      ? `Leve ${buy}, pague ${buy - get}`
                      : `Compre ${buy} e ganhe ${pct}% OFF no${get > 1 ? 's' : ''} próximo${get > 1 ? 's' : ''} ${get} item${get > 1 ? 'ns' : ''}`;
                  }
                  if (p.type === 'percentage') return `${p.discount_percentage}% OFF aplicado automaticamente`;
                  if (p.type === 'fixed_amount') return `${brl(Number(p.discount_amount))} de desconto`;
                  if (p.type === 'free_delivery') return 'Frete grátis disponível';
                  if (p.type === 'free_gift') return 'Brinde grátis incluso';
                  return p.name;
                })()}
              </p>
            </div>
          </div>
        )}


        {/* Badge de Oferta ou Promoção */}
        {discountInfo && discountInfo.amount > 0 && (
          <div className="mt-3 mb-2 flex flex-wrap gap-2">
            <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-semibold">
              {Math.round((discountInfo.amount / (selectedVariant?.price || product.price)) * 100)}% OFF
              {discountInfo.source === 'promotion' && ' (Promoção)'}
              {discountInfo.source === 'product_offer' && ' (Oferta)'}
            </span>
            {bestPromotion?.type === 'free_delivery' && (
              <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1">
                🚚 {freeDeliveryLabel}
              </span>
            )}
          </div>
        )}

        {/* Badge de Frete Grátis sem desconto no produto */}
        {bestPromotion?.type === 'free_delivery' && (!discountInfo || discountInfo.amount === 0) && (
          <div className="mt-3 mb-2">
            <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-semibold inline-flex items-center gap-1">
              🚚 {freeDeliveryLabel}
            </span>
          </div>
        )}

        {/* Mensagem de desconto */}
        {discountInfo && discountInfo.message && (
          <p className="text-sm text-green-600 font-medium mt-2">
            ✨ {discountInfo.message}
          </p>
        )}
      </div>

      {/* Preços */}
      <div className="flex flex-col">
        {addonCategories.length > 0 && (
          <span className="text-xs text-muted-foreground">A partir de</span>
        )}
        <div className="flex items-baseline gap-3">
          {pf.active ? (
            <div className="text-2xl md:text-3xl font-bold text-primary">
              {formatPrice(currentFinalPrice)}
            </div>
          ) : discountInfo && discountInfo.amount > 0 ? (
            <>
              <div className="text-2xl md:text-3xl font-bold text-primary">
                {formatPrice(currentFinalPrice)}
              </div>
              <div className="text-base md:text-xl text-muted-foreground line-through">
                {formatPrice(selectedVariant?.price || product.price)}
              </div>
            </>
          ) : product.is_on_offer ? (
            <>
              <div className="text-2xl md:text-3xl font-bold text-primary">
                {formatPrice(product.offer_price!)}
              </div>
              <div className="text-base md:text-xl text-muted-foreground line-through">
                {formatPrice(product.price)}
              </div>
            </>
          ) : (
            <div className="text-2xl md:text-3xl font-bold text-primary">
              {formatPrice(currentFinalPrice)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
