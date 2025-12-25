import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChefHat, 
  Clock, 
  Loader2,
  UtensilsCrossed,
  Users,
  CheckCircle2
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
  const waitingMinutes = getWaitingTime(item.added_at);
  const colorClass = getWaitingColor(waitingMinutes);
  const isPending = item.preparation_status === 'pending';
  const isPreparing = item.preparation_status === 'preparing';

  return (
    <Card className={cn(
      'border-2 transition-all duration-300',
      colorClass,
      isPreparing && 'ring-2 ring-primary animate-pulse'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {item.comanda_type === 'mesa' ? (
              <Badge variant="outline" className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
                <Users className="w-3 h-3 mr-1" />
                Mesa {item.table_number}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-orange-500/20 text-orange-700 dark:text-orange-300">
                <UtensilsCrossed className="w-3 h-3 mr-1" />
                Balcão
              </Badge>
            )}
            <span className="font-mono text-sm text-muted-foreground">
              #{item.comanda_number}
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
              {waitingMinutes}min
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
              {Object.values(item.addons).flat().join(', ')}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {isPending && (
              <Button
                className="flex-1"
                variant="default"
                onClick={() => onStartPreparing(item.id)}
                disabled={isUpdating}
              >
                {isUpdating ? (
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
                onClick={() => onMarkReady(item.id)}
                disabled={isUpdating}
              >
                {isUpdating ? (
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
