import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import type { OrderItem } from './ProductSelector';

interface OrderItemsListProps {
  items: OrderItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
}

export function OrderItemsList({ items, onUpdateQuantity, onRemove }: OrderItemsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          Itens do Pedido ({items.length})
        </Label>
      </div>
      
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum produto adicionado ainda
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-sm text-muted-foreground">
                        Variante: {item.variantName}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        Obs: {item.notes}
                      </p>
                    )}
                    
                    {item.addons && item.addons.length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-muted space-y-1">
                        {item.addons.map((addon) => (
                          <div key={addon.id} className="text-sm flex justify-between gap-2">
                            <span>+ {addon.name} x{addon.quantity}</span>
                            <span className="text-muted-foreground">
                              R$ {(addon.price * addon.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(index, Math.max(1, Number(e.target.value)))}
                      className="w-16 h-9"
                    />
                    <span className="font-semibold whitespace-nowrap">
                      R$ {item.subtotal.toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(index)}
                      className="h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
