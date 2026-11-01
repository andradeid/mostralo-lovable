// Barra fixa inferior: quantidade, "Adicionar • R$ total" e compartilhar.
import { Button } from '@/components/ui/button';
import { Minus, Plus, Share2 } from 'lucide-react';
import { formatPrice } from '@/lib/productPage/pricing';

interface Props {
  quantity: number;
  setQuantity: (quantity: number) => void;
  storeStatus: { canAddToCart: boolean };
  primaryColor: string;
  totalPrice: number;
  onAddToCart: () => void;
  onShare: () => void;
}

export function ProductBottomBar({ quantity, setQuantity, storeStatus, primaryColor, totalPrice, onAddToCart, onShare }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t p-4 shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Controle de Quantidade */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="h-10 w-10"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-bold text-lg">{quantity}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setQuantity(quantity + 1)}
              className="h-10 w-10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Botão Adicionar */}
          <Button
            className="flex-1 h-12 text-lg font-semibold hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: storeStatus.canAddToCart ? primaryColor : '#9ca3af',
              opacity: storeStatus.canAddToCart ? 1 : 0.5
            }}
            onClick={onAddToCart}
            disabled={!storeStatus.canAddToCart}
          >
            Adicionar • {formatPrice(totalPrice * quantity)}
          </Button>

          {/* Botão Compartilhar */}
          <Button
            variant="outline"
            size="icon"
            onClick={onShare}
            className="h-12 w-12 flex-shrink-0"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
