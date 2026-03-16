import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, 
  Clock, 
  Loader2,
  UtensilsCrossed,
  Users,
  CheckCircle2,
  Package,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { KitchenItem } from '@/hooks/useKitchenDisplay';

interface KitchenItemCardProps {
  item: KitchenItem;
  onStartPreparing: (id: string) => void;
  onMarkReady: (id: string) => void;
  isUpdating: boolean;
  getWaitingTime: (addedAt: string) => number;
  getWaitingColor: (minutes: number) => string;
}

export function KitchenItemCard({ 
  item, 
  onStartPreparing, 
  onMarkReady,
  isUpdating,
  getWaitingTime,
  getWaitingColor
}: KitchenItemCardProps) {
  const [localLoading, setLocalLoading] = useState(false);
  const waitingMinutes = getWaitingTime(item.added_at);
  const colorClass = getWaitingColor(waitingMinutes);
  const isPending = item.preparation_status === 'pending';
  const isPreparing = item.preparation_status === 'preparing';

  const handleStartPreparing = () => {
    console.log('🍳 KDS Card: Clique em Preparando, item:', item.id);
    setLocalLoading(true);
    onStartPreparing(item.id);
    // Reset após 5s como safety net
    setTimeout(() => setLocalLoading(false), 5000);
  };

  const handleMarkReady = () => {
    console.log('✅ KDS Card: Clique em Pronto, item:', item.id);
    setLocalLoading(true);
    onMarkReady(item.id);
    setTimeout(() => setLocalLoading(false), 5000);
  };

  // Renderizar badge baseado no tipo de pedido
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
        return (
          <Badge variant="outline" className="bg-gray-500/20 text-gray-700 dark:text-gray-300">
            <UtensilsCrossed className="w-3 h-3 mr-1" />
            Pedido
          </Badge>
        );
    }
  };

  // Formatar tempo de espera de forma legível
  const formatWaitingTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h${mins > 0 ? `${mins}m` : ''}`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  return (
    <Card className={cn(
      'border-2 transition-all duration-300',
      colorClass,
      isPreparing && 'ring-2 ring-primary animate-pulse'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {renderOrderTypeBadge()}
            <span className="font-mono text-sm text-muted-foreground">
              #{item.order_number}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className={cn(
              'font-mono font-bold',
              waitingMinutes >= 15 && 'text-red-500',
              waitingMinutes >= 10 && waitingMinutes < 15 && 'text-orange-500',
              waitingMinutes >= 5 && waitingMinutes < 10 && 'text-yellow-600'
            )}>
              {formatWaitingTime(waitingMinutes)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-bold">
              {item.quantity}x {item.product_name}
            </h3>
            {item.customer_name && (
              <p className="text-sm text-muted-foreground">
                Cliente: {item.customer_name}
              </p>
            )}
          </div>

          {item.notes && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-md">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                📝 {item.notes}
              </p>
            </div>
          )}

          {item.addons && Object.keys(item.addons).length > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Adicionais:</span>{' '}
              {Array.isArray(item.addons) 
                ? item.addons.map((a: any) => a.name || a).join(', ')
                : Object.values(item.addons).flat().join(', ')
              }
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {isPending && (
              <Button
                className="flex-1"
                variant="default"
                onClick={handleStartPreparing}
                disabled={localLoading}
              >
                {localLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ChefHat className="w-4 h-4 mr-2" />
                )}
                Preparando
              </Button>
            )}
            {isPreparing && (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleMarkReady}
                disabled={localLoading}
              >
                {localLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Pronto!
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
