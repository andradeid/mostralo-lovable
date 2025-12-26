import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Clock, ChefHat, CheckCircle2 } from 'lucide-react';

interface ComandaItem {
  id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  requires_approval: boolean;
  approved_at: string | null;
  preparation_status: string | null;
}

interface TableSummaryPanelProps {
  items: ComandaItem[];
  total: number;
}

export function TableSummaryPanel({ items, total }: TableSummaryPanelProps) {
  return (
    <Card className="mx-4 mt-4">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Seu Consumo
        </h3>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum item ainda</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{item.quantity}x {item.product_name}</span>
                  {item.requires_approval && !item.approved_at && (
                    <Clock className="h-3 w-3 text-amber-500" />
                  )}
                  {item.preparation_status === 'preparing' && (
                    <ChefHat className="h-3 w-3 text-orange-500" />
                  )}
                  {item.preparation_status === 'ready' && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                </div>
                <span className="font-medium">{formatCurrency(item.total_price)}</span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
