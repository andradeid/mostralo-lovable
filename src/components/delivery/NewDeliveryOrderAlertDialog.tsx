import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Clock, DollarSign, Phone, User, X } from "lucide-react";

interface NewDeliveryOrderAlertDialogProps {
  order: any;
  open: boolean;
  onAccept: (orderId: string) => void;
  onViewDetails: () => void;
  onDismiss: () => void;
  driverEarnings?: number;
  totalPending: number;
}

export function NewDeliveryOrderAlertDialog({
  order,
  open,
  onAccept,
  onViewDetails,
  onDismiss,
  driverEarnings = 0,
  totalPending
}: NewDeliveryOrderAlertDialogProps) {
  if (!order) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary animate-pulse" />
              <span>Novo Pedido Disponível!</span>
            </div>
            {totalPending > 1 && (
              <Badge variant="destructive" className="animate-pulse">
                +{totalPending - 1} aguardando
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações principais */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Pedido</p>
              <p className="font-bold text-lg">#{order.order_number}</p>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Você ganha</p>
              <p className="font-bold text-lg text-green-600 dark:text-green-400">
                {formatCurrency(driverEarnings)}
              </p>
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{order.customer_name}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{order.customer_phone}</span>
            </div>
          </div>

          {/* Endereço */}
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm">{order.customer_address}</span>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{formatTime(order.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => onAccept(order.id)}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            ✅ Aceitar Pedido
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onViewDetails}
              variant="outline"
              className="w-full"
            >
              Ver Detalhes
            </Button>
            
            <Button
              onClick={onDismiss}
              variant="ghost"
              className="w-full"
            >
              <X className="w-4 h-4 mr-1" />
              Dispensar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
