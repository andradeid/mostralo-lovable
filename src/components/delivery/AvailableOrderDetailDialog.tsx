import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MapPin, Clock, DollarSign, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CustomerMap } from '@/components/admin/CustomerMap';
import { stopOrderAlertLoop } from '@/utils/soundPlayer';
import { calculateDriverEarnings, type EarningsConfig } from '@/utils/driverEarnings';
import { useAuth } from '@/hooks/use-auth';
import { formatOrderNumber } from '@/utils/addressFormatter';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_email?: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  status: string;
  delivery_type: string;
  created_at: string;
  notes?: string;
  store_id: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

interface OrderAddon {
  id: string;
  addon_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Props {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onAccept: (orderId: string) => void;
}

const maskPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ****-${cleaned.slice(-4)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ****-${cleaned.slice(-4)}`;
  }
  return '****-****';
};

const maskEmail = (email?: string) => {
  if (!email) return null;
  const [user, domain] = email.split('@');
  if (!user || !domain) return '***@***';
  return `${user.slice(0, 2)}***@${domain}`;
};

export function AvailableOrderDetailDialog({ order, open, onClose, onAccept }: Props) {
  const { profile } = useAuth();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [addons, setAddons] = useState<Map<string, OrderAddon[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [driverEarningsConfig, setDriverEarningsConfig] = useState<EarningsConfig | null>(null);

  useEffect(() => {
    if (open && order) {
      fetchOrderDetails();
    }
  }, [open, order]);

  // Parar som ao abrir dialog
  useEffect(() => {
    if (open) {
      stopOrderAlertLoop();
    }
  }, [open]);

  const fetchOrderDetails = async () => {
    if (!order) return;

    setLoading(true);
    try {
      // Buscar configurações da loja
      const { data: config } = await supabase
        .from('store_configurations')
        .select('*')
        .eq('store_id', order.store_id)
        .single();

      if (config) {
        setStoreConfig(config);
      }

      // Buscar configuração de ganhos do entregador
      if (profile) {
        const { data: earningsConfig } = await supabase
          .from('driver_earnings_config')
          .select('*')
          .eq('driver_id', profile.id)
          .eq('store_id', order.store_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (earningsConfig) {
          setDriverEarningsConfig(earningsConfig);
        }
      }

      // Buscar itens do pedido
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      setItems(orderItems || []);

      // Buscar adicionais de cada item
      if (orderItems && orderItems.length > 0) {
        const addonsMap = new Map<string, OrderAddon[]>();
        
        for (const item of orderItems) {
          const { data: itemAddons } = await supabase
            .from('order_addons')
            .select('*')
            .eq('order_item_id', item.id);

          if (itemAddons && itemAddons.length > 0) {
            addonsMap.set(item.id, itemAddons);
          }
        }

        setAddons(addonsMap);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAccept = () => {
    if (order) {
      onAccept(order.id);
      onClose();
    }
  };

  if (!order) return null;

  const timeAgo = formatDistanceToNow(new Date(order.created_at), {
    addSuffix: true,
    locale: ptBR
  });

  const firstName = order.customer_name.split(' ')[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Pedido {formatOrderNumber(order.order_number)}</span>
            <Badge variant="secondary" className="gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dados do Cliente (Parciais) */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <p className="font-medium">{firstName}</p>
                <p className="text-xs text-muted-foreground">
                  Nome completo visível após aceitar
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <p className="font-mono text-muted-foreground">{maskPhone(order.customer_phone)}</p>
                <p className="text-xs text-muted-foreground">
                  Número completo visível após aceitar
                </p>
              </div>

              {order.customer_email && (
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-mono text-muted-foreground">{maskEmail(order.customer_email)}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Endereço de Entrega</Label>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p>{order.customer_address || 'Endereço não informado'}</p>
                </div>
              </div>
            </div>

            {/* Mapa (se tiver coordenadas) */}
            {storeConfig?.delivery_zones && (
              <div className="h-[200px] rounded-lg overflow-hidden border">
                <CustomerMap
                  latitude={-15.7942}
                  longitude={-47.8822}
                  customerName={firstName}
                  compact
                />
              </div>
            )}

            {/* Itens do Pedido */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4" />
                Itens do Pedido
              </Label>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.quantity}x {item.product_name}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Obs: {item.notes}
                          </p>
                        )}
                      </div>
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>

                    {/* Adicionais do Item */}
                    {addons.get(item.id) && addons.get(item.id)!.length > 0 && (
                      <div className="pl-4 space-y-1 border-l-2 border-primary/20">
                        {addons.get(item.id)!.map((addon) => (
                          <div key={addon.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              + {addon.quantity}x {addon.addon_name}
                            </span>
                            <span className="text-muted-foreground">
                              {formatCurrency(addon.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Observações do Pedido */}
            {order.notes && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <Label className="text-xs text-muted-foreground">Observações do Cliente</Label>
                <p className="text-sm mt-1">{order.notes}</p>
              </div>
            )}

            {/* Valor que o entregador ganha */}
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700 dark:text-green-400">
                    Você Ganha Nesta Entrega
                  </span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(calculateDriverEarnings(order.delivery_fee, driverEarningsConfig || undefined))}
                </span>
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa Cobrada do Cliente</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Total
                </span>
                <span className="text-green-600">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleAccept} className="w-full sm:w-auto gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Aceitar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
