import { useEffect, useState } from 'react';
import { useCrossSell } from '@/hooks/useCrossSell';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Sparkles } from 'lucide-react';

interface CartItem {
  category_id?: string | null;
  product_id?: string;
}

interface CrossSellProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  discountPercentage?: number;
  ruleId?: string;
}

interface CrossSellSectionProps {
  storeId: string;
  cartItems: CartItem[];
  onAddProduct: (product: { 
    id: string; 
    name: string; 
    price: number; 
    image_url: string | null;
  }) => void;
  themeColor?: string;
  title?: string;
}

export function CrossSellSection({
  storeId,
  cartItems,
  onAddProduct,
  themeColor = '#f97316',
  title = 'Você também pode gostar'
}: CrossSellSectionProps) {
  const { fetchSuggestions, recordImpression, recordAccepted, hasAccess, suggestions, loading } = useCrossSell(storeId);
  const [impressionsRecorded, setImpressionsRecorded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (hasAccess && cartItems.length > 0) {
      fetchSuggestions(cartItems);
    }
  }, [hasAccess, cartItems, fetchSuggestions]);

  useEffect(() => {
    // Registrar impressões para regras novas
    suggestions.forEach(product => {
      if (product.ruleId && !impressionsRecorded.has(product.ruleId)) {
        recordImpression(product.ruleId);
        setImpressionsRecorded(prev => new Set(prev).add(product.ruleId!));
      }
    });
  }, [suggestions, recordImpression, impressionsRecorded]);

  if (!hasAccess || loading || suggestions.length === 0) {
    return null;
  }

  const handleAddProduct = (product: CrossSellProduct) => {
    const finalPrice = product.discountPercentage 
      ? product.price * (1 - product.discountPercentage / 100)
      : product.price;

    if (product.ruleId) {
      recordAccepted(product.ruleId, finalPrice);
    }

    onAddProduct({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image_url: product.image_url
    });
  };

  return (
    <div className="py-4 border-t">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Sparkles className="h-4 w-4" style={{ color: themeColor }} />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {suggestions.map((product) => {
            const hasDiscount = product.discountPercentage && product.discountPercentage > 0;
            const finalPrice = hasDiscount 
              ? product.price * (1 - product.discountPercentage! / 100)
              : product.price;

            return (
              <div
                key={product.id}
                className="flex-shrink-0 w-36 rounded-lg border bg-background overflow-hidden"
              >
                {/* Image */}
                <div className="aspect-square bg-muted relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl">🍽️</span>
                    </div>
                  )}
                  {hasDiscount && (
                    <div 
                      className="absolute top-1 right-1 text-white text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: themeColor }}
                    >
                      -{product.discountPercentage}%
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-2">
                  <h4 className="text-xs font-medium line-clamp-2 min-h-[2rem]">
                    {product.name}
                  </h4>
                  
                  <div className="mt-1">
                    {hasDiscount ? (
                      <div className="space-y-0">
                        <span className="text-xs text-muted-foreground line-through block">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="text-sm font-bold" style={{ color: themeColor }}>
                          {formatCurrency(finalPrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold" style={{ color: themeColor }}>
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="w-full mt-2 h-7 text-xs"
                    style={{ backgroundColor: themeColor }}
                    onClick={() => handleAddProduct(product)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
