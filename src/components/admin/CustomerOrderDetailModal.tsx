import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Loader2, 
  Store, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle,
  Home,
  CreditCard,
  Banknote,
  Wallet,
  ShoppingBag,
  HelpCircle,
  X
} from "lucide-react";

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  created_at: string;
  completed_at?: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  payment_method: string;
  delivery_type: string;
  notes?: string;
  stores?: {
    name: string;
    logo_url?: string;
    slug: string;
  };
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  products?: {
    image_url?: string;
  };
}

interface OrderAddon {
  id: string;
  order_item_id: string;
  addon_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// Cliente: exibir somente nome e foto do entregador (sem email)
interface DriverInfo {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface CustomerOrderDetailModalProps {
  orderId: string;
  open: boolean;
  onClose: () => void;
}

const statusConfig: Record<string, { 
  color: string; 
  bgColor: string; 
  icon: any; 
  label: string;
  description: string;
}> = {
  entrada: { 
    color: "text-blue-700 dark:text-blue-300", 
    bgColor: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800", 
    icon: Clock, 
    label: "Pedido recebido",
    description: "Aguardando confirmação"
  },
  em_preparo: { 
    color: "text-orange-700 dark:text-orange-300", 
    bgColor: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800", 
    icon: Clock, 
    label: "Em preparo",
    description: "Seu pedido está sendo preparado"
  },
  pronto: { 
    color: "text-green-700 dark:text-green-300", 
    bgColor: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800", 
    icon: CheckCircle2, 
    label: "Pedido pronto",
    description: "Pronto para retirada/entrega"
  },
  saiu_entrega: { 
    color: "text-purple-700 dark:text-purple-300", 
    bgColor: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800", 
    icon: Truck, 
    label: "Saiu para entrega",
    description: "Em rota de entrega"
  },
  em_transito: { 
    color: "text-purple-700 dark:text-purple-300", 
    bgColor: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800", 
    icon: Truck, 
    label: "Em trânsito",
    description: "A caminho do destino"
  },
  concluido: { 
    color: "text-green-700 dark:text-green-300", 
    bgColor: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800", 
    icon: CheckCircle2, 
    label: "Pedido concluído",
    description: "Obrigado por comprar conosco!"
  },
  cancelado: { 
    color: "text-red-700 dark:text-red-300", 
    bgColor: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800", 
    icon: XCircle, 
    label: "Pedido cancelado",
    description: "Entre em contato se tiver dúvidas"
  },
};

const paymentIcons: Record<string, any> = {
  pix: Wallet,
  money: Banknote,
  card: CreditCard,
  debit: CreditCard,
  credit: CreditCard,
};

const getPaymentLabel = (paymentMethod: string, paymentDetails: any) => {
  if (paymentMethod === 'pix') return 'PIX';
  if (paymentMethod === 'cash') return 'Dinheiro';
  if (paymentMethod === 'card') {
    if (paymentDetails?.card_type === 'credit') return 'Cartão de Crédito';
    if (paymentDetails?.card_type === 'debit') return 'Cartão de Débito';
    return 'Cartão';
  }
  return paymentMethod;
};

export default function CustomerOrderDetailModal({ 
  orderId, 
  open, 
  onClose 
}: CustomerOrderDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [addons, setAddons] = useState<OrderAddon[]>([]);
  const [driver, setDriver] = useState<DriverInfo | null>(null);

  useEffect(() => {
    if (open && orderId) {
      loadOrderDetails();
    }
  }, [open, orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);

      // Buscar pedido
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          stores:store_id (
            name,
            logo_url,
            slug
          )
        `)
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Buscar itens
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          products:product_id (
            image_url
          )
        `)
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Buscar adicionais
      if (itemsData && itemsData.length > 0) {
        const itemIds = itemsData.map(item => item.id);
        const { data: addonsData, error: addonsError } = await supabase
          .from("order_addons")
          .select("*")
          .in("order_item_id", itemIds);

        if (addonsError) throw addonsError;
        setAddons(addonsData || []);
      }

      // Buscar info do entregador (apenas nome e avatar, sem email)
      if (orderData.assigned_driver_id) {
        const { data: driverData, error: driverError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", orderData.assigned_driver_id)
          .maybeSingle();

        if (driverError) {
          console.error("Erro ao buscar entregador:", driverError);
        } else if (driverData) {
          setDriver(driverData);
        }
      }

    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) {
    return null;
  }

  const statusInfo = statusConfig[order.status] || statusConfig.entrada;
  const StatusIcon = statusInfo.icon;
  const PaymentIcon = paymentIcons[order.payment_method] || Wallet;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b sticky top-0 bg-card z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Detalhes do Pedido</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Ajuda</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="h-9 w-9"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-0">
          {/* Logo + Nome da Loja */}
          {order.stores && (
            <div className="flex items-center gap-3 px-4 py-4 border-b">
              <Avatar className="h-12 w-12">
                {order.stores.logo_url && (
                  <AvatarImage src={order.stores.logo_url} alt={order.stores.name} />
                )}
                <AvatarFallback>
                  <Store className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base">{order.stores.name}</p>
                <p className="text-sm text-muted-foreground">
                  Pedido nº {order.order_number} • {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}

          {/* Status do Pedido */}
          <div className={`mx-4 my-4 border rounded-lg p-4 ${statusInfo.bgColor}`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${statusInfo.color.includes('green') ? 'bg-green-500' : statusInfo.color.includes('orange') ? 'bg-orange-500' : statusInfo.color.includes('purple') ? 'bg-purple-500' : statusInfo.color.includes('red') ? 'bg-red-500' : 'bg-blue-500'}`}>
                <StatusIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${statusInfo.color}`}>
                  {statusInfo.label}
                  {order.completed_at && ` às ${format(new Date(order.completed_at), "HH:mm", { locale: ptBR })}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {statusInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="px-4 py-3 space-y-4 border-b">
            {items.map((item) => {
              const itemAddons = addons.filter(addon => addon.order_item_id === item.id);
              
              return (
                <div key={item.id} className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="relative shrink-0">
                    {item.products?.image_url ? (
                      <img 
                        src={item.products.image_url} 
                        className="w-16 h-16 rounded-lg object-cover"
                        alt={item.product_name}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {item.quantity > 1 && (
                      <Badge 
                        variant="default"
                        className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 rounded-full"
                      >
                        {item.quantity}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{item.product_name}</p>
                    
                    {/* Adicionais */}
                    {itemAddons.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {itemAddons.map(addon => (
                          <p key={addon.id} className="text-sm text-muted-foreground">
                            {addon.quantity}x {addon.addon_name}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        Obs: {item.notes}
                      </p>
                    )}
                  </div>
                  
                  {/* Preço */}
                  <div className="text-right shrink-0">
                    <p className="font-semibold">R$ {item.subtotal.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo de Valores */}
          <div className="px-4 py-4 bg-muted/30 border-b">
            <h3 className="font-bold mb-3 text-base">Resumo de valores</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {order.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span>{order.delivery_fee === 0 ? 'Grátis' : `R$ ${order.delivery_fee.toFixed(2)}`}</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="px-4 py-4 border-b">
            <h3 className="font-bold mb-3 text-base">Pagamento</h3>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <PaymentIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{getPaymentLabel(order.payment_method, (order as any).payment_details)}</p>
                <p className="text-sm text-muted-foreground">
                  {order.delivery_type === 'delivery' ? 'Pagamento na entrega' : 'Pagamento na retirada'}
                </p>
              </div>
            </div>
          </div>

          {/* Endereço de Entrega */}
          {order.delivery_type === 'delivery' && order.customer_address && (
            <div className="px-4 py-4 border-b">
              <h3 className="font-bold mb-3 text-base">Endereço de entrega</h3>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2 shrink-0">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.customer_address}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.customer_phone}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Informações do Entregador (apenas nome e avatar) */}
          {driver && ['concluido', 'em_transito', 'saiu_entrega'].includes(order.status) && (
            <div className="px-4 py-4 border-b">
              <h3 className="font-bold mb-3 text-base">Entregador</h3>
              
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {driver.avatar_url && (
                    <AvatarImage src={driver.avatar_url} alt={driver.full_name} />
                  )}
                  <AvatarFallback className="text-lg">
                    {driver.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium text-base">{driver.full_name}</p>
              </div>
            </div>
          )}

          {/* Observações */}
          {order.notes && (
            <div className="px-4 py-4 border-b">
              <h3 className="font-bold mb-2 text-base">Observações</h3>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          {/* Botão de Reordenar */}
          <div className="px-4 py-4 sticky bottom-0 bg-card border-t">
            <Button 
              className="w-full h-12 font-semibold text-base"
              onClick={() => {
                onClose();
                if (order.stores?.slug) {
                  window.location.href = `/loja/${order.stores.slug}`;
                }
              }}
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Ver cardápio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
