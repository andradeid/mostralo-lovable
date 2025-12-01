import { useEffect, useState } from 'react';
import { useNewOrders } from '@/contexts/NewOrdersContext';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, CheckCircle, MapPin, Package, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrderTimer } from '@/hooks/useOrderTimer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function GlobalNewOrderAlert() {
  const { pendingOrders, dismissOrder } = useNewOrders();
  const navigate = useNavigate();
  const [currentOrder, setCurrentOrder] = useState<typeof pendingOrders[0] | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  // ✅ Hook chamado sempre para respeitar Rules of Hooks
  const timer = useOrderTimer(currentOrder?.created_at || new Date().toISOString());

  // Mostrar o primeiro pedido pendente
  useEffect(() => {
    if (pendingOrders.length > 0 && !currentOrder) {
      setCurrentOrder(pendingOrders[0]);
    }
  }, [pendingOrders, currentOrder]);

  const handleDismiss = () => {
    if (currentOrder) {
      dismissOrder(currentOrder.id);
      setCurrentOrder(null);
      
      // Mostrar próximo pedido se houver
      setTimeout(() => {
        const nextOrder = pendingOrders.find((o) => o.id !== currentOrder.id);
        if (nextOrder) {
          setCurrentOrder(nextOrder);
        }
      }, 300);
    }
  };

  const handleAcceptOrder = async () => {
    if (!currentOrder) return;

    setIsAccepting(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'em_preparo' })
        .eq('id', currentOrder.id);

      if (error) throw error;

      toast.success('✅ Pedido aceito com sucesso!');
      dismissOrder(currentOrder.id);
      setCurrentOrder(null);
      
      // Mostrar próximo pedido se houver
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
      navigate(`/dashboard/orders?order=${currentOrder.id}`);
    }
  };

  if (!currentOrder) return null;

  return (
    <AlertDialog open={!!currentOrder}>
      <AlertDialogContent className="sm:max-w-md border-4 border-destructive">
        <AlertDialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-orange-500/10 animate-pulse">
                <Bell className="h-6 w-6 text-orange-500" />
              </div>
              <AlertDialogTitle className="text-2xl font-bold text-destructive">
                NOVO PEDIDO!
              </AlertDialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {timer && (
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {timer.elapsedTime}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription asChild>
          <div className="space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Número do Pedido</span>
                <span className="font-mono font-bold text-xl">#{currentOrder.order_number}</span>
              </div>
              
              <div className="border-t pt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cliente:</span>
                  <span className="font-semibold">{currentOrder.customer_name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Telefone:</span>
                  <span className="font-medium">{currentOrder.customer_phone}</span>
                </div>

                {currentOrder.customer_address && (
                  <div className="flex items-start gap-2 text-sm pt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{currentOrder.customer_address}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {currentOrder.delivery_type === 'delivery' ? 'Delivery' : 'Retirada no Balcão'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {currentOrder.total.toFixed(2)}
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

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleViewDetails}
            className="w-full"
          >
            Ver Detalhes
          </Button>
          <Button
            onClick={handleAcceptOrder}
            disabled={isAccepting}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-lg font-bold"
          >
            {isAccepting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Aceitando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                ACEITAR PEDIDO
              </span>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
