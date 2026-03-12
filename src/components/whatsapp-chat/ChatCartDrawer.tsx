import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, Plus, Minus, Package, Loader2, CreditCard, Send, Truck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

interface ChatCartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onFinalize: (deliveryFee: number) => void;
  onRequestPixPayment?: (deliveryFee: number) => void;
  onSendConfirmation?: (deliveryFee: number) => void;
  finalizing?: boolean;
  sendingConfirmation?: boolean;
}

export function ChatCartDrawer({
  open,
  onOpenChange,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onFinalize,
  onRequestPixPayment,
  onSendConfirmation,
  finalizing,
  sendingConfirmation,
}: ChatCartDrawerProps) {
  const [deliveryFee, setDeliveryFee] = useState(0);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Carrinho ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 opacity-30" />
            <p className="text-sm">Carrinho vazio</p>
            <p className="text-xs">Busque produtos e adicione ao carrinho</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    {/* Imagem */}
                    <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.price)} un.
                      </p>
                      <p className="text-sm font-bold text-primary">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* Controles de quantidade */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            item.quantity <= 1
                              ? onRemoveItem(item.id)
                              : onUpdateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          {item.quantity <= 1 ? (
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-border p-4 space-y-3">
              {/* Taxa de entrega */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Truck className="w-3.5 h-3.5" />
                  Taxa de Entrega
                </Label>
                <CurrencyInput
                  value={deliveryFee}
                  onChange={setDeliveryFee}
                  placeholder="0,00"
                  className="h-8 text-sm"
                />
              </div>

              <Separator />

              {/* Subtotal e Total */}
              <div className="space-y-1">
                {deliveryFee > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                )}
                {deliveryFee > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Entrega</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              <Separator />

              {/* Enviar para confirmação */}
              {onSendConfirmation && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 border-green-500/30 text-green-600 hover:bg-green-500/10 dark:text-green-400"
                  onClick={() => onSendConfirmation(deliveryFee)}
                  disabled={finalizing || sendingConfirmation}
                >
                  {sendingConfirmation ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Enviar para Confirmação
                </Button>
              )}

              {/* Cobrar via PIX */}
              {onRequestPixPayment && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => onRequestPixPayment(deliveryFee)}
                  disabled={finalizing}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Cobrar via PIX
                </Button>
              )}

              {/* Ações */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={onClearCart}
                  disabled={finalizing}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={onFinalize}
                  disabled={finalizing}
                >
                  {finalizing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-3.5 h-3.5" />
                  )}
                  Finalizar Pedido
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
