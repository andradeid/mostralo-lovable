import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Phone, Package, Bike, DollarSign, Clock, AlertTriangle, Printer, Eye } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { useOrderTimer } from "@/hooks/useOrderTimer";
import { cn } from "@/lib/utils";
import { DriverBadge } from "./DriverBadge";
import { printOrder, executePrint } from "@/utils/printOrder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PrintPreviewDialog } from "@/components/admin/print/PrintPreviewDialog";
import { useState } from "react";

type Order = Database['public']['Tables']['orders']['Row'];

interface OrderCardProps {
  order: Order;
  onClick: () => void;
  isDragging?: boolean;
  isViewed?: boolean;
  onPrint?: () => void;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
}

export const OrderCard = ({ order, onClick, isDragging, isViewed, onPrint, isSelected, onSelectChange }: OrderCardProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtmls, setPreviewHtmls] = useState<string[]>([]);
  const [previewViaNames, setPreviewViaNames] = useState<string[]>([]);
  const [storeName, setStoreName] = useState<string>('Loja');
  
  const deliveryIcon = order.delivery_type === 'delivery' ? <Bike className="h-4 w-4" /> : <Package className="h-4 w-4" />;
  const { elapsedTime, color, minutes } = useOrderTimer(order.created_at);
  
  const paymentStatusColor = order.payment_status === 'paid' ? 'bg-green-500' : 
                             order.payment_status === 'cancelled' ? 'bg-red-500' : 
                             'bg-yellow-500';

  const borderColorClass = color === 'green' ? 'border-t-green-500' : 
                          color === 'yellow' ? 'border-t-yellow-500' : 
                          'border-t-red-500';

  const isUrgent = color === 'red';

  const handleQuickPrint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', order.store_id)
        .single();

      await printOrder(order as any, storeData?.name || 'Loja');
      if (onPrint) onPrint();
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast.error('Erro ao imprimir pedido');
    }
  };

  const handlePreview = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', order.store_id)
        .single();

      const stName = storeData?.name || 'Loja';
      setStoreName(stName);
      
      await printOrder(order as any, stName, {
        preview: true,
        onPreviewReady: (htmlContents, viaNames) => {
          setPreviewHtmls(htmlContents);
          setPreviewViaNames(viaNames);
          setShowPreview(true);
        },
      });
    } catch (error) {
      console.error('Erro ao gerar pré-visualização:', error);
      toast.error('Erro ao gerar pré-visualização');
    }
  };

  const handleConfirmPrint = async () => {
    // Buscar configuração para saber o print_type
    const { data: storeConfig } = await supabase
      .from('print_configurations')
      .select('print_type')
      .eq('store_id', order.store_id)
      .eq('is_active', true)
      .maybeSingle();
    
    executePrint(previewHtmls, storeConfig?.print_type || 'thermal_80mm');
    if (onPrint) onPrint();
  };

  return (
    <Card 
      className={cn(
        "p-2.5 cursor-pointer hover:shadow-lg transition-all border-t-4 overflow-visible w-full max-w-full",
        borderColorClass,
        isDragging && 'opacity-50',
        isUrgent && 'animate-pulse',
        order.status === 'entrada' && !isViewed && 'animate-blink-border border-2'
      )}
      onClick={onClick}
    >
      <div className="space-y-1.5">
        {/* Header - Linha 1: Checkbox + Número + Status + Urgência */}
        <div className="flex items-center gap-1.5">
          {onSelectChange && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelectChange(e.target.checked);
              }}
              className="h-4 w-4 rounded border-gray-300 cursor-pointer flex-shrink-0"
            />
          )}
          <span className="text-sm font-semibold whitespace-nowrap">#{order.order_number}</span>
          <OrderStatusBadge status={order.status} />
          {isUrgent && <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
        </div>

        {/* Linha 2: Nome do Cliente */}
        <div className="flex items-center">
          <span className="font-medium text-sm truncate">
            {order.customer_name}
          </span>
        </div>

        {/* Informações do pedido */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {/* Linha 3: Telefone e Tipo de Entrega */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[100px]">
                {order.customer_phone.length > 13 
                  ? order.customer_phone.slice(0, 13) + '...' 
                  : order.customer_phone}
              </span>
            </div>
            <span className="text-muted-foreground/50">•</span>
            <div className="flex items-center gap-1 whitespace-nowrap">
              {deliveryIcon}
              <span>{order.delivery_type === 'delivery' ? 'Delivery' : 'Retirada'}</span>
            </div>
          </div>

          {/* Linha 4: Timer e Forma de Pagamento */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Clock className={`h-3 w-3 flex-shrink-0 ${color === 'red' ? 'text-red-500' : color === 'yellow' ? 'text-yellow-500' : 'text-green-500'}`} />
              <span className={`${color === 'red' ? 'text-red-500' : color === 'yellow' ? 'text-yellow-500' : 'text-green-500'}`}>
                {elapsedTime}
              </span>
            </div>
            <span className="text-muted-foreground/50">•</span>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <div className={`w-1.5 h-1.5 rounded-full ${paymentStatusColor} flex-shrink-0`} />
              <span>
                {order.payment_method === 'pix' ? 'PIX' : 
                 order.payment_method === 'card' ? (
                   (order as any).payment_details?.card_type === 'credit' ? 'Crédito' :
                   (order as any).payment_details?.card_type === 'debit' ? 'Débito' :
                   'Cartão'
                 ) : 'Dinheiro'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer com valor total */}
        <div className="pt-1.5 border-t space-y-1.5">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-base font-bold">
              R$ {Number(order.total).toFixed(2)}
            </span>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex gap-1.5 w-full">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={handlePreview}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Visualizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={handleQuickPrint}
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Entregador atribuído */}
        {order.assigned_driver_id && (
          <div className="pt-1.5 border-t">
            <p className="text-xs text-muted-foreground mb-1 font-medium">
              Entregador
            </p>
            <DriverBadge driverId={order.assigned_driver_id} />
          </div>
        )}
      </div>

      <PrintPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        htmlContents={previewHtmls}
        viaNames={previewViaNames}
        onConfirmPrint={handleConfirmPrint}
      />
    </Card>
  );
};
