import { useStoreTimezone } from '@/hooks/useStoreTimezone';
import { scheduledLabel, formatBRL } from '@/lib/scheduledOrders';
import { updateOrderStatus } from '@/lib/orderStatus';
import { useEffect, useState } from 'react';
import { useNewOrders } from '@/contexts/NewOrdersContext';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, CheckCircle, MapPin, Package, Clock, CalendarClock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrderTimer } from '@/hooks/useOrderTimer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { DeliveryTimeSelector } from './orders/DeliveryTimeSelector';

export function GlobalNewOrderAlert() {
  const { pendingOrders, dismissOrder } = useNewOrders();
  const navigate = useNavigate();
  const [currentOrder, setCurrentOrder] = useState<typeof pendingOrders[0] | null>(null);
  const { data: timezone } = useStoreTimezone(currentOrder?.store_id);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const timer = useOrderTimer(currentOrder?.created_at || new Date().toISOString(), currentOrder?.scheduled_for, currentOrder?.status);

  useEffect(() => {
    if (pendingOrders.length > 0 && !currentOrder) {
      setCurrentOrder(pendingOrders[0]);
    }
  }, [pendingOrders, currentOrder]);

  const handleDismiss = () => {
    if (currentOrder) {
      dismissOrder(currentOrder.id);
      setCurrentOrder(null);
      
      setTimeout(() => {
        const nextOrder = pendingOrders.find((o) => o.id !== currentOrder.id);
        if (nextOrder) {
          setCurrentOrder(nextOrder);
        }
      }, 300);
    }
  };

  const handleAcceptClick = () => {
    setShowTimeSelector(true);
  };

  const handleAcceptOrder = async (estimatedMinutes?: number, at?: string) => {
    if (!currentOrder) return;

    setIsAccepting(true);
    try {
      const result = await updateOrderStatus({ orderId: currentOrder.id, status: 'em_preparo', estimatedDeliveryMinutes: currentOrder.scheduled_for ? undefined : estimatedMinutes });
      if (!result.success) throw new Error(result.error);
      toast.success(currentOrder.scheduled_for ? `Encomenda confirmada para ${scheduledLabel(at || currentOrder.scheduled_for, timezone)}` : `✅ Pedido aceito! Tempo estimado: ${estimatedMinutes} min`);
      setShowTimeSelector(false);
      dismissOrder(currentOrder.id);
      setCurrentOrder(null);
      
      setTimeout(() => {
        const nextOrder = pendingOrders.find((o) => o.id !== currentOrder.id);
        if (nextOrder) {
          setCurrentOrder(nextOrder);
        }
      }, 300);
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
      toast.error('Erro ao aceitar pedido');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleViewDetails = () => {
    if (currentOrder) {
      handleDismiss();
      navigate(currentOrder.scheduled_for ? `/dashboard/scheduled-orders?order=${currentOrder.id}` : `/dashboard/orders?order=${currentOrder.id}`);
    }
  };

  if (!currentOrder) return null;

  return (
    <>
      <AlertDialog open={!!currentOrder && !showTimeSelector}>
        <AlertDialogContent className="box-border w-[calc(100%-2rem)] max-w-md sm:max-w-md max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto rounded-lg border-4 border-destructive p-4 sm:p-6 [&>*]:min-w-0">
          <AlertDialogHeader className="w-full min-w-0 pr-9 text-left">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className="shrink-0 p-2 rounded-full bg-primary/10 animate-pulse">
                  <Bell className="h-6 w-6 text-orange-500" />
                </div>
                <AlertDialogTitle className="min-w-0 break-words text-xl sm:text-2xl font-bold text-destructive">
                  {currentOrder.scheduled_for ? 'ENCOMENDA!' : 'NOVO PEDIDO!'}
                </AlertDialogTitle>
              </div>
                {timer && (
                  <Badge variant="destructive" className="max-w-full min-w-0 gap-1 whitespace-normal text-sm px-3 py-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="min-w-0 break-words">{timer.elapsedTime}</span>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  aria-label="Fechar alerta de pedido"
                  className="absolute right-3 top-3 h-8 w-8 shrink-0 sm:right-4 sm:top-4"
                >
                  <X className="h-4 w-4" />
                </Button>
            </div>
          </AlertDialogHeader>
          
          <AlertDialogDescription asChild>
            <div className="box-border w-full min-w-0 space-y-4">
              <div className="box-border w-full min-w-0 bg-primary/10 p-4 rounded-lg space-y-3">
                <div className="flex min-w-0 flex-wrap justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground">Número do Pedido</span>
                  <span className="min-w-0 break-all font-mono font-bold text-xl">#{currentOrder.order_number}</span>
                </div>
                
                <div className="border-t pt-2 space-y-2">
                  <div className="flex min-w-0 justify-between gap-3">
                    <span className="shrink-0 text-sm text-muted-foreground">Cliente:</span>
                    <span className="min-w-0 break-words text-right font-semibold">{currentOrder.customer_name}</span>
                  </div>
                  
                  <div className="flex min-w-0 justify-between gap-3">
                    <span className="shrink-0 text-sm text-muted-foreground">Telefone:</span>
                    <span className="min-w-0 break-all text-right font-medium">{currentOrder.customer_phone}</span>
                  </div>

                  {currentOrder.customer_address && (
                    <div className="flex items-start gap-2 text-sm pt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="min-w-0 break-words line-clamp-2">{currentOrder.customer_address}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {currentOrder.delivery_type === 'delivery' ? 'Entrega' : 'Retirada no Balcão'}
                    </span>
                  </div>


                  {/* Info de Agendamento */}
                  {currentOrder.scheduled_for && (
                    <div className="flex items-center gap-2 text-sm p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                      <CalendarClock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <div className="min-w-0 break-words">
                        <span className="font-semibold text-amber-700 dark:text-amber-400">📦 Encomenda</span>
                        <p className="text-xs text-amber-600 dark:text-amber-300">
                          Encomenda para {scheduledLabel(currentOrder.scheduled_for, timezone)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex min-w-0 flex-wrap justify-between items-center gap-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatBRL(currentOrder.total)}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground text-center pt-1">
                    {format(new Date(currentOrder.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>

              {pendingOrders.length > 1 && (
                <div className="text-center">
                  <span className="text-xs text-orange-500 font-medium animate-pulse">
                    🔔 +{pendingOrders.length - 1} pedido(s) aguardando
                  </span>
                </div>
              )}
            </div>
          </AlertDialogDescription>

          <AlertDialogFooter className="w-full min-w-0 flex-col gap-2 min-[400px]:flex-row sm:space-x-0">
            <Button
              variant="outline"
              onClick={handleViewDetails}
              className="h-auto min-h-11 w-full min-w-0 whitespace-normal px-3 py-2 min-[400px]:flex-1"
            >
              Ver Detalhes
            </Button>
            <Button
              onClick={handleAcceptClick}
              className="h-auto min-h-11 w-full min-w-0 whitespace-normal px-3 py-2 text-sm font-semibold normal-case min-[400px]:flex-1"
            >
              <span className="flex min-w-0 items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span className="min-w-0 break-words">{currentOrder.scheduled_for ? 'Aceitar encomenda' : 'Aceitar pedido'}</span>
              </span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de seleção de tempo */}
      <DeliveryTimeSelector
        open={showTimeSelector}
        onOpenChange={setShowTimeSelector}
        onConfirm={handleAcceptOrder}
        isPickup={currentOrder?.delivery_type === 'pickup'}
        isLoading={isAccepting}
        scheduledFor={currentOrder?.scheduled_for}
        orderId={currentOrder.id}
        storeId={currentOrder.store_id}
      />
    </>
  );
}
