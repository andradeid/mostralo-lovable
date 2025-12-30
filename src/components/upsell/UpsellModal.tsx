import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Minus, X } from 'lucide-react';
import { useUpsell } from '@/hooks/useUpsell';
import { formatCurrency } from '@/lib/utils';

interface UpsellProduct {
  id: string;
  upsell_product_id: string;
  upsell_price: number | null;
  priority: number;
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
  };
}

interface UpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  triggerProductId: string;
  onAccept: (product: { 
    id: string; 
    name: string; 
    price: number; 
    image_url: string | null;
    quantity: number;
  }) => void;
  onDecline: () => void;
  themeColor?: string;
}

export function UpsellModal({
  open,
  onOpenChange,
  storeId,
  triggerProductId,
  onAccept,
  onDecline,
  themeColor = '#f97316'
}: UpsellModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [upsellProducts, setUpsellProducts] = useState<UpsellProduct[]>([]);
  const { fetchUpsells, recordImpression, recordAccepted, recordRejected, hasAccess } = useUpsell(storeId);

  useEffect(() => {
    if (open && triggerProductId && hasAccess) {
      loadUpsells();
    }
  }, [open, triggerProductId, hasAccess]);

  const loadUpsells = async () => {
    const upsells = await fetchUpsells(triggerProductId);
    setUpsellProducts(upsells);
    setCurrentIndex(0);
    setQuantity(1);
    
    // Registrar impressão do primeiro upsell
    if (upsells.length > 0) {
      recordImpression(upsells[0].id);
    }
  };

  const currentUpsell = upsellProducts[currentIndex];
  
  if (!currentUpsell || !hasAccess) {
    return null;
  }

  const finalPrice = currentUpsell.upsell_price ?? currentUpsell.product.price;
  const hasDiscount = currentUpsell.upsell_price !== null && currentUpsell.upsell_price < currentUpsell.product.price;
  const totalPrice = finalPrice * quantity;

  const handleNext = () => {
    if (currentIndex < upsellProducts.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setQuantity(1);
      recordImpression(upsellProducts[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setQuantity(1);
    }
  };

  const handleAccept = () => {
    recordAccepted(currentUpsell.id, totalPrice);
    onAccept({
      id: currentUpsell.product.id,
      name: currentUpsell.product.name,
      price: finalPrice,
      image_url: currentUpsell.product.image_url,
      quantity
    });
    onOpenChange(false);
  };

  const handleDecline = () => {
    recordRejected(currentUpsell.id);
    onDecline();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-center text-lg">
            Que tal adicionar?
          </DialogTitle>
        </DialogHeader>

        {/* Product Image */}
        <div className="relative aspect-[4/3] bg-muted">
          {currentUpsell.product.image_url ? (
            <img
              src={currentUpsell.product.image_url}
              alt={currentUpsell.product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground text-4xl">🍽️</span>
            </div>
          )}
          
          {/* Navigation arrows */}
          {upsellProducts.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === upsellProducts.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              
              {/* Pagination dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {upsellProducts.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      idx === currentIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-lg">{currentUpsell.product.name}</h3>
            {currentUpsell.product.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {currentUpsell.product.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="text-center">
            {hasDiscount ? (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground line-through">
                  De {formatCurrency(currentUpsell.product.price)}
                </span>
                <div className="text-2xl font-bold" style={{ color: themeColor }}>
                  Por {formatCurrency(finalPrice)}
                </div>
              </div>
            ) : (
              <div className="text-2xl font-bold" style={{ color: themeColor }}>
                {formatCurrency(finalPrice)}
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="p-2 rounded-lg border border-border hover:bg-muted"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="p-2 rounded-lg text-white"
              style={{ backgroundColor: themeColor }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Total */}
          {quantity > 1 && (
            <div className="text-center text-sm text-muted-foreground">
              Total: <span className="font-semibold">{formatCurrency(totalPrice)}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleAccept}
              className="w-full py-6 text-lg font-semibold"
              style={{ backgroundColor: themeColor }}
            >
              Adicionar {formatCurrency(totalPrice)}
            </Button>
            <Button
              variant="ghost"
              onClick={handleDecline}
              className="w-full text-muted-foreground"
            >
              Não, obrigado
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
