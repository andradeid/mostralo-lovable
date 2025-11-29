import { useEffect, useState } from 'react';
import { useNewOrders } from '@/contexts/NewOrdersContext';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Bell, X, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function GlobalNewOrderAlert() {
  const { pendingOrders, dismissOrder, goToOrders } = useNewOrders();
  const [currentOrder, setCurrentOrder] = useState<typeof pendingOrders[0] | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

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

  const handleViewOrder = () => {
    handleDismiss();
    goToOrders();
  };

  if (!currentOrder) return null;

  return (
    <AlertDialog open={!!currentOrder}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-orange-500/10 animate-pulse">
                <Bell className="h-5 w-5 text-orange-500" />
              </div>
              <AlertDialogTitle className="text-xl">
                🔔 NOVO PEDIDO!
              </AlertDialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription asChild>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pedido</span>
                <span className="font-mono font-bold text-lg">#{currentOrder.order_number}</span>
              </div>
              
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{currentOrder.customer_name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Telefone:</span>
                  <span className="font-medium">{currentOrder.customer_phone}</span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {currentOrder.total.toFixed(2)}
                  </span>
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
            onClick={handleViewOrder}
            className="w-full"
          >
            Ver Detalhes
          </Button>
          <Button
            onClick={handleAcceptOrder}
            disabled={isAccepting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
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
