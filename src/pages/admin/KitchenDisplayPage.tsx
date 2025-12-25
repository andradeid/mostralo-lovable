import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKitchenDisplay, KitchenItem } from '@/hooks/useKitchenDisplay';
import { 
  ChefHat, 
  Clock, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Loader2,
  UtensilsCrossed,
  Users,
  CheckCircle2,
  Timer,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

function KitchenItemCard({ 
  item, 
  onStartPreparing, 
  onMarkReady,
  isUpdating,
  getWaitingTime,
  getWaitingColor
}: { 
  item: KitchenItem;
  onStartPreparing: (id: string) => void;
  onMarkReady: (id: string) => void;
  isUpdating: boolean;
  getWaitingTime: (addedAt: string) => number;
  getWaitingColor: (minutes: number) => string;
}) {
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

export default function KitchenDisplayPage() {
  const {
    pendingItems,
    preparingItems,
    isLoading,
    refetch,
    startPreparing,
    isStartingPreparing,
    markReady,
    isMarkingReady,
    getWaitingTime,
    getWaitingColor,
    soundEnabled,
    setSoundEnabled,
  } = useKitchenDisplay();

  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartPreparing = async (itemId: string) => {
    await startPreparing(itemId);
  };

  const handleMarkReady = async (itemId: string) => {
    await markReady(itemId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  const totalPending = pendingItems.length;
  const totalPreparing = preparingItems.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ChefHat className="w-8 h-8" />
            KDS - Cozinha
          </h1>
          <p className="text-muted-foreground">
            Display de pedidos em tempo real
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Relógio */}
          <div className="text-2xl font-mono font-bold text-muted-foreground">
            {currentTime.toLocaleTimeString('pt-BR')}
          </div>

          {/* Toggle som */}
          <div className="flex items-center gap-2">
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
            <Label htmlFor="sound-toggle" className="cursor-pointer">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5 text-muted-foreground" />
              )}
            </Label>
          </div>

          {/* Refresh */}
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{totalPending}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{totalPreparing}</p>
                <p className="text-xs text-muted-foreground">Em Preparo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalPending + totalPreparing}</p>
                <p className="text-xs text-muted-foreground">Total Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          totalPending === 0 && totalPreparing === 0 && 'bg-green-500/20 border-green-500'
        )}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={cn(
                'w-5 h-5',
                totalPending === 0 && totalPreparing === 0 ? 'text-green-500' : 'text-muted-foreground'
              )} />
              <div>
                <p className="text-sm font-medium">
                  {totalPending === 0 && totalPreparing === 0 
                    ? '✅ Tudo em dia!' 
                    : 'Aguardando...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">
            Todos ({totalPending + totalPreparing})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes ({totalPending})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            Preparando ({totalPreparing})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {pendingItems.length === 0 && preparingItems.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Nenhum pedido na fila</h2>
              <p className="text-muted-foreground">
                Novos pedidos aparecerão aqui automaticamente
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...pendingItems, ...preparingItems].map((item) => (
                <KitchenItemCard
                  key={item.id}
                  item={item}
                  onStartPreparing={handleStartPreparing}
                  onMarkReady={handleMarkReady}
                  isUpdating={isStartingPreparing || isMarkingReady}
                  getWaitingTime={getWaitingTime}
                  getWaitingColor={getWaitingColor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {pendingItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Sem pedidos pendentes!</h2>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pendingItems.map((item) => (
                <KitchenItemCard
                  key={item.id}
                  item={item}
                  onStartPreparing={handleStartPreparing}
                  onMarkReady={handleMarkReady}
                  isUpdating={isStartingPreparing || isMarkingReady}
                  getWaitingTime={getWaitingTime}
                  getWaitingColor={getWaitingColor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preparing" className="mt-4">
          {preparingItems.length === 0 ? (
            <div className="text-center py-12">
              <Timer className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Nenhum item em preparo</h2>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {preparingItems.map((item) => (
                <KitchenItemCard
                  key={item.id}
                  item={item}
                  onStartPreparing={handleStartPreparing}
                  onMarkReady={handleMarkReady}
                  isUpdating={isStartingPreparing || isMarkingReady}
                  getWaitingTime={getWaitingTime}
                  getWaitingColor={getWaitingColor}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
