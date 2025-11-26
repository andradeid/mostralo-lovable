import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, Phone, MapPin, Package } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOrderTimer } from "@/hooks/useOrderTimer";

type Order = Database['public']['Tables']['orders']['Row'];

interface NewOrderAlertDialogProps {
  order: Order | null;
  open: boolean;
  onAccept: (orderId: string) => void;
  onViewDetails: (order: Order) => void;
}

export const NewOrderAlertDialog = ({ order, open, onAccept, onViewDetails }: NewOrderAlertDialogProps) => {
  const timer = order ? useOrderTimer(order.created_at) : null;

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-lg border-4 border-destructive"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-destructive flex items-center gap-2">
              <Bell className="h-8 w-8" />
              NOVO PEDIDO!
            </DialogTitle>
            {timer && (
              <Badge variant="destructive" className="text-lg px-4 py-2">
                <Clock className="h-4 w-4 mr-2" />
                {timer.elapsedTime}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-primary/10 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Número do Pedido</span>
              <span className="font-bold text-xl">{order.order_number}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cliente</span>
              <span className="font-semibold">{order.customer_name}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{order.customer_phone}</span>
            </div>

            {order.customer_address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="line-clamp-2">{order.customer_address}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>{order.delivery_type === 'delivery' ? 'Delivery' : 'Retirada no Balcão'}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-bold text-2xl text-primary">
                R$ {Number(order.total).toFixed(2)}
              </span>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onViewDetails(order)}
            >
              Ver Detalhes
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-lg font-bold"
              size="lg"
              onClick={() => onAccept(order.id)}
            >
              ACEITAR PEDIDO
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
