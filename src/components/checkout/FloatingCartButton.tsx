import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';

interface FloatingCartButtonProps {
  totalItems: number;
  totalPrice: number;
  onClick: () => void;
  primaryColor?: string;
}

export function FloatingCartButton({ 
  totalItems, 
  totalPrice, 
  onClick,
  primaryColor = '#ef4444' 
}: FloatingCartButtonProps) {
  if (totalItems === 0) return null;

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 bg-card border-t p-4 shadow-lg md:bottom-20 transition-all duration-300 ease-in-out">
      <div className="max-w-4xl mx-auto">
        <Button 
          className="w-full h-14 text-lg font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: primaryColor }}
          onClick={onClick}
        >
          <ShoppingBag className="mr-2 h-5 w-5" />
          Ver sacola • R$ {formatPrice(totalPrice)} / {totalItems} {totalItems === 1 ? 'item' : 'itens'}
        </Button>
      </div>
    </div>
  );
}
