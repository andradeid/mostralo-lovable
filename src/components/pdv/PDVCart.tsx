import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CartItem } from '@/hooks/usePDV';
import { useIsMobile } from '@/hooks/use-mobile';

interface PDVCartProps {
  items: CartItem[];
  subtotal: number;
  discount?: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onFinalize: () => void;
  isProcessing?: boolean;
  salesPaused?: boolean;
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
  salesPaused = false,
}: PDVCartProps) {
  const total = subtotal - discount;
  const isMobile = useIsMobile();

  return (
    <Card className="flex flex-col max-h-[calc(100vh-80px)]">
      <CardHeader className={`pb-3 flex-shrink-0 ${isMobile ? 'px-4' : ''}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-xl' : 'text-lg'}`}>
            <ShoppingCart className={isMobile ? "h-6 w-6" : "h-5 w-5"} />
            Carrinho
            {items.length > 0 && (
              <span className={`bg-primary text-primary-foreground rounded-full ${isMobile ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'}`}>
                {items.length}
              </span>
            )}
          </CardTitle>
          {items.length > 0 && (
            <Button 
              variant="ghost" 
              size={isMobile ? "default" : "sm"}
              onClick={onClearCart}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={`flex-1 min-h-0 overflow-hidden ${isMobile ? 'px-4' : 'px-3'}`}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <ShoppingCart className={`mb-2 opacity-20 ${isMobile ? 'h-16 w-16' : 'h-12 w-12'}`} />
            <p className={isMobile ? 'text-base' : 'text-sm'}>Carrinho vazio</p>
            <p className={isMobile ? 'text-sm' : 'text-xs'}>Adicione produtos para começar</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className={`space-y-3 pr-4 ${isMobile ? 'pb-4' : ''}`}>
              {items.map((item) => (
                <div key={item.id} className={`bg-muted/50 rounded-lg ${isMobile ? 'p-4' : 'p-3'}`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium break-words leading-tight ${isMobile ? 'text-base' : 'text-sm'}`}>
                        {item.product_name}
                      </p>
                      <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-xs'}`}>
                        {formatCurrency(item.unit_price)} cada
                      </p>
                    </div>
                    <p className={`font-bold text-primary whitespace-nowrap min-w-[80px] text-right ${isMobile ? 'text-base' : 'text-sm'}`}>
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className={isMobile ? "h-12 w-12" : "h-7 w-7"}
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className={isMobile ? "h-5 w-5" : "h-3 w-3"} />
                      </Button>
                      <span className={`text-center font-bold ${isMobile ? 'w-12 text-xl' : 'w-8 text-sm'}`}>
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className={isMobile ? "h-12 w-12" : "h-7 w-7"}
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className={isMobile ? "h-5 w-5" : "h-3 w-3"} />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`text-destructive hover:text-destructive hover:bg-destructive/10 ${isMobile ? 'h-12 w-12' : 'h-7 w-7'}`}
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                    </Button>
                  </div>

                  {item.notes && (
                    <p className={`text-muted-foreground mt-2 italic ${isMobile ? 'text-sm' : 'text-xs'}`}>
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
        <CardFooter className={`flex-shrink-0 flex-col gap-3 pt-3 border-t ${isMobile ? 'px-4 pb-4' : ''}`}>
          <div className="w-full space-y-1">
            <div className={`flex justify-between ${isMobile ? 'text-base' : 'text-sm'}`}>
              <span className="text-muted-foreground">Subtotal</span>
              <span className="min-w-[80px] text-right">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className={`flex justify-between text-green-600 ${isMobile ? 'text-base' : 'text-sm'}`}>
                <span>Desconto</span>
                <span className="min-w-[80px] text-right">-{formatCurrency(discount)}</span>
              </div>
            )}
            <Separator />
            <div className={`flex justify-between font-bold ${isMobile ? 'text-xl' : 'text-lg'}`}>
              <span>Total</span>
              <span className="text-primary min-w-[80px] text-right">{formatCurrency(total)}</span>
            </div>
          </div>

          <Button 
            className={`w-full ${isMobile ? 'h-14 text-lg' : ''}`}
            size="lg"
            onClick={onFinalize}
            disabled={isProcessing || salesPaused}
            variant={salesPaused ? 'secondary' : 'default'}
          >
            {isProcessing ? 'Processando...' : salesPaused ? 'Vendas Pausadas' : 'Finalizar Venda'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
