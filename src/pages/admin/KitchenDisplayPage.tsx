import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKitchenDisplay } from '@/hooks/useKitchenDisplay';
import { KitchenHeader, KitchenStats, KitchenItemCard } from '@/components/kitchen';
import { KitchenReadyCard } from '@/components/kitchen/KitchenReadyCard';
import { KitchenPerformance } from '@/components/kitchen/KitchenPerformance';
import { ChefHat, Loader2, CheckCircle2, Timer, History, BarChart3 } from 'lucide-react';

export default function KitchenDisplayPage() {
  const {
    pendingItems,
    preparingItems,
    readyItems,
    isLoading,
    refetch,
    startPreparing,
    isStartingPreparing,
    markReady,
    isMarkingReady,
    undoReady,
    isUndoingReady,
    getWaitingTime,
    getWaitingColor,
    getPreparationTime,
    soundEnabled,
    setSoundEnabled,
  } = useKitchenDisplay();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
  const totalReady = readyItems.length;
  const isUpdating = isStartingPreparing || isMarkingReady;

  const renderItemsGrid = (items: typeof pendingItems) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <KitchenItemCard
          key={item.id}
          item={item}
          onStartPreparing={startPreparing}
          onMarkReady={markReady}
          isUpdating={isUpdating}
          getWaitingTime={getWaitingTime}
          getWaitingColor={getWaitingColor}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <KitchenHeader
        currentTime={currentTime}
        soundEnabled={soundEnabled}
        onSoundToggle={setSoundEnabled}
        onRefresh={refetch}
      />

      <KitchenStats totalPending={totalPending} totalPreparing={totalPreparing} totalReady={totalReady} />

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="all">Todos ({totalPending + totalPreparing})</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({totalPending})</TabsTrigger>
          <TabsTrigger value="preparing">Preparando ({totalPreparing})</TabsTrigger>
          <TabsTrigger value="ready" className="flex items-center gap-1">
            <History className="w-3.5 h-3.5" />
            Prontos ({totalReady})
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" />
            Desempenho
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {totalPending === 0 && totalPreparing === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Nenhum pedido na fila</h2>
              <p className="text-muted-foreground">Novos pedidos aparecerão aqui automaticamente</p>
            </div>
          ) : (
            renderItemsGrid([...pendingItems, ...preparingItems])
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {totalPending === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Sem pedidos pendentes!</h2>
            </div>
          ) : (
            renderItemsGrid(pendingItems)
          )}
        </TabsContent>

        <TabsContent value="preparing" className="mt-4">
          {totalPreparing === 0 ? (
            <div className="text-center py-12">
              <Timer className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Nenhum item em preparo</h2>
            </div>
          ) : (
            renderItemsGrid(preparingItems)
          )}
        </TabsContent>

        <TabsContent value="ready" className="mt-4">
          {totalReady === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Nenhum item pronto hoje</h2>
              <p className="text-muted-foreground">Itens finalizados aparecerão aqui</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {readyItems.map((item) => (
                <KitchenReadyCard
                  key={item.id}
                  item={item}
                  getPreparationTime={getPreparationTime}
                  onUndoReady={undoReady}
                  isUndoing={isUndoingReady}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <KitchenPerformance />
        </TabsContent>
      </Tabs>
    </div>
  );
}
