import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle2,
  UtensilsCrossed,
  Users,
  Package,
  Store,
  Undo2
} from 'lucide-react';
import { KitchenItem } from '@/hooks/useKitchenDisplay';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KitchenReadyCardProps {
  item: KitchenItem;
  getPreparationTime: (addedAt: string, preparedAt: string | null) => number;
  onUndoReady?: (itemId: string, source: 'comanda' | 'order') => void;
  isUndoing?: boolean;
}

export function KitchenReadyCard({ 
  item, 
  getPreparationTime,
  onUndoReady,
  isUndoing = false 
}: KitchenReadyCardProps) {
  const prepTime = getPreparationTime(item.added_at, item.prepared_at);
  const preparedTime = item.prepared_at 
    ? format(new Date(item.prepared_at), 'HH:mm', { locale: ptBR })
    : '--:--';

  const renderOrderTypeBadge = () => {
    switch (item.order_type) {
      case 'mesa':
        return (
          <Badge variant="outline" className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
            <Users className="w-3 h-3 mr-1" />
            Mesa {item.table_number}
          </Badge>
        );
      case 'balcao':
        return (
          <Badge variant="outline" className="bg-orange-500/20 text-orange-700 dark:text-orange-300">
            <UtensilsCrossed className="w-3 h-3 mr-1" />
            Balcão
          </Badge>
        );
      case 'delivery':
        return (
          <Badge variant="outline" className="bg-purple-500/20 text-purple-700 dark:text-purple-300">
            <Package className="w-3 h-3 mr-1" />
            Delivery
          </Badge>
        );
      case 'pickup':
        return (
          <Badge variant="outline" className="bg-green-500/20 text-green-700 dark:text-green-300">
            <Store className="w-3 h-3 mr-1" />
            Retirada
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-2 bg-green-500/10 border-green-500/50 opacity-90 hover:opacity-100 transition-opacity">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {renderOrderTypeBadge()}
            <span className="font-mono text-sm text-muted-foreground">
              #{item.order_number}
            </span>
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Pronto</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {item.quantity}x {item.product_name}
          </h3>
          
          {item.customer_name && (
            <p className="text-sm text-muted-foreground">
              Cliente: {item.customer_name}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground border-t">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Preparo: {prepTime} min</span>
            </div>
            <span>Pronto às {preparedTime}</span>
          </div>

          {onUndoReady && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full mt-2 text-muted-foreground hover:text-orange-600 hover:bg-orange-500/10"
              onClick={() => onUndoReady(item.id, item.source)}
              disabled={isUndoing}
            >
              <Undo2 className="w-4 h-4 mr-1" />
              Desfazer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
