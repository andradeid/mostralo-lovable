import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Store as StoreIcon } from 'lucide-react';
import { useProductPromotion } from '@/hooks/useProductPromotion';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id?: string;
  is_on_offer?: boolean;
  offer_price?: number;
}

interface ProductCardWithPromotionProps {
  product: Product;
  storeId: string;
  primaryColor: string;
  layout: 'grid' | 'carousel' | 'list';
  onProductClick: (product: Product) => void;
  canAddToCart: boolean;
  shouldShowSchedulingRequired: boolean;
}

export const ProductCardWithPromotion = ({
  product,
  storeId,
  primaryColor,
  layout,
  onProductClick,
  canAddToCart,
  shouldShowSchedulingRequired
}: ProductCardWithPromotionProps) => {
  const { finalPrice, discountInfo, loading } = useProductPromotion({
    product,
    storeId,
    quantity: 1
  });

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const hasDiscount = discountInfo && discountInfo.amount > 0;
  const discountPercent = hasDiscount 
    ? Math.round((discountInfo.amount / product.price) * 100)
    : 0;

  // Badge baseado na fonte do desconto
  const getBadgeContent = () => {
    if (!hasDiscount) return null;
    
    if (discountInfo.source === 'promotion') {
      return {
        text: '🎉 PROMOÇÃO',
        className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      };
    }
    
    if (discountInfo.source === 'product_offer') {
      return {
        text: `${discountPercent}% OFF`,
        className: 'bg-red-500 text-white'
      };
    }
    
    return null;
  };

  const badgeContent = getBadgeContent();

  // Layout GRID
  if (layout === 'grid') {
    return (
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all hover:scale-105 cursor-pointer bg-white"
        onClick={() => onProductClick(product)}
      >
        <CardContent className="p-0">
          <div className="relative aspect-square w-full">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className={`w-full h-full object-cover transition-all ${
                  !canAddToCart ? 'grayscale opacity-60' : ''
                }`}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <StoreIcon className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            
            {shouldShowSchedulingRequired && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-blue-500 text-white">
                  📅 Apenas Agendamento
                </Badge>
              </div>
            )}
            
            {badgeContent && (
              <div className="absolute top-2 right-2">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold shadow-lg ${badgeContent.className}`}>
                  {badgeContent.text}
                </span>
              </div>
            )}
          </div>
          
          <div className="p-3 space-y-2">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
            
            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
            
            <div className="flex flex-col gap-1">
              {loading ? (
                <Skeleton className="h-6 w-20" />
              ) : hasDiscount ? (
                <>
                  <div className="text-xs text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </div>
                  <div 
                    className="text-lg font-bold"
                    style={{ color: primaryColor }}
                  >
                    {formatPrice(finalPrice)}
                  </div>
                </>
              ) : (
                <div 
                  className="text-lg font-bold"
                  style={{ color: primaryColor }}
                >
                  {formatPrice(finalPrice)}
                </div>
              )}
            </div>
            
            <Button 
              size="sm" 
              className="w-full text-white hover:opacity-90"
              style={{ 
                backgroundColor: canAddToCart ? primaryColor : '#9ca3af',
                opacity: canAddToCart ? 1 : 0.5
              }}
              onClick={(e) => {
                e.stopPropagation();
                onProductClick(product);
              }}
              disabled={!canAddToCart}
            >
              <Plus className="w-4 h-4 mr-1" />
              {shouldShowSchedulingRequired ? 'Agendar' : 'Ver opções'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Layout CAROUSEL
  if (layout === 'carousel') {
    return (
      <Card 
        className="flex-shrink-0 w-64 overflow-hidden hover:shadow-lg transition-all cursor-pointer snap-start bg-white"
        onClick={() => onProductClick(product)}
      >
        <CardContent className="p-0">
          <div className="relative aspect-square w-full">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className={`w-full h-full object-cover transition-all ${
                  !canAddToCart ? 'grayscale opacity-60' : ''
                }`}
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <StoreIcon className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            
            {shouldShowSchedulingRequired && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-blue-500 text-white">
                  📅 Apenas Agendamento
                </Badge>
              </div>
            )}
            
            {badgeContent && (
              <div className="absolute top-2 right-2">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold shadow-lg ${badgeContent.className}`}>
                  {badgeContent.text}
                </span>
              </div>
            )}
          </div>
          
          <div className="p-4 space-y-2">
            <h3 className="text-base font-semibold text-foreground line-clamp-2 min-h-[3rem]">
              {product.name}
            </h3>
            
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
            
            <div className="flex flex-col gap-1">
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : hasDiscount ? (
                <>
                  <div className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.price)}
                  </div>
                  <div 
                    className="text-xl font-bold"
                    style={{ color: primaryColor }}
                  >
                    {formatPrice(finalPrice)}
                  </div>
                </>
              ) : (
                <div 
                  className="text-xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {formatPrice(finalPrice)}
                </div>
              )}
            </div>
            
            <Button 
              size="sm" 
              className="w-full text-white hover:opacity-90"
              style={{ 
                backgroundColor: canAddToCart ? primaryColor : '#9ca3af',
                opacity: canAddToCart ? 1 : 0.5
              }}
              onClick={(e) => {
                e.stopPropagation();
                onProductClick(product);
              }}
              disabled={!canAddToCart}
            >
              <Plus className="w-4 h-4 mr-1" />
              {shouldShowSchedulingRequired ? 'Agendar' : 'Ver opções'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Layout LIST
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow bg-white cursor-pointer" onClick={() => onProductClick(product)}>
      <CardContent className="p-0">
        <div className="flex min-h-28 lg:min-h-32">
          {product.image_url ? (
            <div className="w-24 h-24 lg:w-28 lg:h-28 flex-shrink-0 p-3 relative">
              <img
                src={product.image_url}
                alt={product.name}
                className={`w-full h-full object-cover rounded-lg transition-all ${
                  !canAddToCart ? 'grayscale opacity-60' : ''
                }`}
              />
              {shouldShowSchedulingRequired && (
                <div className="absolute top-1 left-1">
                  <Badge className="bg-blue-500 text-white text-[10px] px-1 py-0">
                    📅
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="w-24 h-24 lg:w-28 lg:h-28 flex-shrink-0 p-3">
              <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <StoreIcon className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          )}
          
          <div className="flex-1 p-3 lg:p-4 flex flex-col justify-between">
            <div className="mb-2">
              <h3 className="text-sm lg:text-base font-semibold text-foreground mb-1 line-clamp-1">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-xs lg:text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[120px]">
                {badgeContent && (
                  <div className="mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeContent.className}`}>
                      {badgeContent.text}
                    </span>
                  </div>
                )}
                
                <div className="flex items-baseline gap-2">
                  {loading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : hasDiscount ? (
                    <>
                      <div 
                        className="text-base lg:text-lg font-bold"
                        style={{ color: primaryColor }}
                      >
                        {formatPrice(finalPrice)}
                      </div>
                      <div className="text-xs lg:text-sm text-muted-foreground line-through">
                        {formatPrice(product.price)}
                      </div>
                    </>
                  ) : (
                    <div 
                      className="text-base lg:text-lg font-bold"
                      style={{ color: primaryColor }}
                    >
                      {formatPrice(finalPrice)}
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onProductClick(product);
                }}
                style={{ 
                  backgroundColor: canAddToCart ? primaryColor : '#9ca3af',
                  opacity: canAddToCart ? 1 : 0.5
                }}
                className="text-white hover:opacity-90 text-xs lg:text-sm px-3 py-2 h-8 lg:h-9 w-full sm:w-auto"
                disabled={!canAddToCart}
              >
                <Plus className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                {shouldShowSchedulingRequired ? 'Agendar' : 'Ver opções'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
