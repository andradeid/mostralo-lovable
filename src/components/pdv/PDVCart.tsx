import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CartItem } from '@/hooks/usePDV';

interface PDVCartProps {
  items: CartItem[];
  subtotal: number;
  discount?: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onFinalize: () => void;
  isProcessing?: boolean;
}

export function PDVCart({
  items,
  subtotal,
  discount = 0,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onFinalize,
  isProcessing = false,
}: PDVCartProps) {
  const total = subtotal - discount;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5" />
            Carrinho
            {items.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </CardTitle>
          {items.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearCart}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 px-3 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
            <p className="text-sm">Carrinho vazio</p>
            <p className="text-xs">Adicione produtos para começar</p>
          </div>
        ) : (
          <ScrollArea className="h-full pr-2">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.unit_price)} cada
                      </p>
                    </div>
                    <p className="font-bold text-sm text-primary whitespace-nowrap">
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Obs: {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {items.length > 0 && (
        <CardFooter className="flex-col gap-3 pt-3 border-t">
          <div className="w-full space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={onFinalize}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processando...' : 'Finalizar Venda'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
