import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductDescription } from '@/components/ProductDescription';
import { Tag, Truck } from 'lucide-react';

interface PromotionProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    offer_price: number | null;
    is_on_offer: boolean;
    image_url: string | null;
  };
  discountPercentage?: number | null;
  discountAmount?: number | null;
  promotionType?: string;
  showActionButton?: boolean;
  onProductClick?: (productId: string) => void;
  primaryColor?: string;
  secondaryColor?: string;
  discountSource?: 'product_offer' | 'promotion';
  isFreeDelivery?: boolean;
}

export function PromotionProductCard({
  product,
  discountPercentage,
  discountAmount,
  promotionType,
  showActionButton = false,
  onProductClick,
  primaryColor = '#3B82F6',
  secondaryColor = '#10B981',
  discountSource,
  isFreeDelivery = false,
}: PromotionProductCardProps) {
  const basePrice = product.is_on_offer && product.offer_price 
    ? product.offer_price 
    : product.price;

  // Determinar automaticamente a origem do desconto se não for especificada
  const effectiveDiscountSource = discountSource || 
    (product.is_on_offer && product.offer_price ? 'product_offer' : 'promotion');

  // Calcular preço promocional
  const calculatePromotionalPrice = (): number | null => {
    // Para free_delivery, pode ter desconto combinado
    if (promotionType === 'free_delivery') {
      if (discountPercentage) {
        return basePrice * (1 - discountPercentage / 100);
      }
      if (discountAmount) {
        return Math.max(0, basePrice - discountAmount);
      }
      return null; // Só frete grátis, sem desconto no produto
    }

    if (promotionType === 'percentage' && discountPercentage) {
      return basePrice * (1 - discountPercentage / 100);
    }
    
    if (promotionType === 'fixed_amount' && discountAmount) {
      return Math.max(0, basePrice - discountAmount);
    }

    return null;
  };

  // Calcular porcentagem de desconto
  const getDiscountPercent = (): number | null => {
    if (promotionType === 'free_delivery') {
      if (discountPercentage) return discountPercentage;
      if (discountAmount) return Math.round((discountAmount / basePrice) * 100);
      return null;
    }

    if (promotionType === 'percentage' && discountPercentage) {
      return discountPercentage;
    }
    
    if (promotionType === 'fixed_amount' && discountAmount) {
      return Math.round((discountAmount / basePrice) * 100);
    }

    return null;
  };

  const promotionalPrice = calculatePromotionalPrice();
  const discountPercent = getDiscountPercent();
  const showFreeDelivery = isFreeDelivery || promotionType === 'free_delivery';

  return (
    <div 
      className={`flex gap-3 p-3 bg-card rounded-lg border hover:shadow-md transition-all duration-200 hover:scale-[1.01] ${onProductClick ? 'cursor-pointer' : ''}`}
      onClick={() => onProductClick?.(product.id)}
    >
      {/* Imagem redonda à esquerda */}
      <div className="flex-shrink-0">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted flex items-center justify-center">
            <Tag className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Informações à direita */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Nome do produto */}
          <h4 className="font-semibold text-sm md:text-base leading-tight mb-1">
            {product.name}
          </h4>

          {/* Descrição */}
          {product.description && (
            <ProductDescription description={product.description} className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-2" />
          )}

          {/* Badges de benefícios */}
          <div className="flex flex-wrap gap-1 mb-2">
            {showFreeDelivery && (
              <Badge className="bg-green-500 text-white font-bold text-xs flex items-center gap-1">
                <Truck className="w-3 h-3" />
                Frete Grátis
              </Badge>
            )}
            {discountPercent && (
              <Badge 
                className="text-white font-bold text-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {discountPercent}% OFF
                <span className="text-[10px] ml-1 opacity-90">
                  {effectiveDiscountSource === 'product_offer' ? '(Oferta)' : '(Promoção)'}
                </span>
              </Badge>
            )}
          </div>
        </div>

        {/* Preços */}
        <div className="flex items-end gap-2 mb-2">
          {promotionalPrice !== null ? (
            <>
              <span className="text-xs md:text-sm text-muted-foreground line-through">
                R$ {basePrice.toFixed(2)}
              </span>
              <span 
                className="text-lg md:text-xl font-bold"
                style={{ color: primaryColor }}
              >
                R$ {promotionalPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span 
              className="text-lg md:text-xl font-bold"
              style={{ color: primaryColor }}
            >
              R$ {basePrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Botão de ação */}
        {showActionButton && onProductClick && (
          <Button
            size="sm"
            className="w-full text-white hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
            onClick={() => onProductClick(product.id)}
          >
            + Ver opções
          </Button>
        )}
      </div>
    </div>
  );
}
