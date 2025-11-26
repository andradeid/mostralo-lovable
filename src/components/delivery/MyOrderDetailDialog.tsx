import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, DollarSign, Package, Navigation, Shield, Store, MessageCircle, Clock, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CustomerMap } from '@/components/admin/CustomerMap';
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

interface Assignment {
  id: string;
  order_id: string;
  status: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  orders: Order;
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
  assignment: Assignment | null;
  open: boolean;
  onClose: () => void;
}

export function MyOrderDetailDialog({ assignment, open, onClose }: Props) {
  const { profile } = useAuth();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [addons, setAddons] = useState<Map<string, OrderAddon[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [storeData, setStoreData] = useState<{ 
    phone?: string; 
    whatsapp?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    name?: string;
  } | null>(null);
  const [driverEarningsConfig, setDriverEarningsConfig] = useState<EarningsConfig | null>(null);

  useEffect(() => {
    if (open && assignment) {
      fetchOrderDetails();
    }
  }, [open, assignment]);

  const fetchOrderDetails = async () => {
    if (!assignment) return;

    const order = assignment.orders;
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

      // Buscar dados da loja (telefone, WhatsApp, endereço e localização)
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('phone, whatsapp, address, latitude, longitude, name')
        .eq('id', order.store_id)
        .single();

      if (storeError) {
        console.error('Erro ao buscar dados da loja:', storeError);
      }

      if (store) {
        console.log('✅ Dados da loja carregados:', {
          name: store.name,
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          phone: store.phone,
          whatsapp: store.whatsapp
        });
        setStoreData(store);
      } else {
        console.warn('⚠️ Loja não encontrada para store_id:', order.store_id);
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

  const maskPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ****-${cleaned.substring(7)}`;
    }
    return phone;
  };

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  };

  // Navegação para o cliente
  const openGoogleMapsToCustomer = () => {
    if (!assignment) return;
    const address = encodeURIComponent(assignment.orders.customer_address || '');
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
  };

  const openWazeToCustomer = () => {
    if (!assignment) return;
    const address = encodeURIComponent(assignment.orders.customer_address || '');
    window.open(`https://waze.com/ul?q=${address}`, '_blank');
  };

  // Navegação para a loja
  const openGoogleMapsToStore = () => {
    if (!storeData) return;
    
    // Priorizar coordenadas, depois endereço
    if (storeData.latitude && storeData.longitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${storeData.latitude},${storeData.longitude}`, '_blank');
    } else if (storeData.address) {
      const address = encodeURIComponent(storeData.address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    } else {
      toast.error('Localização da loja não configurada');
    }
  };

  const openWazeToStore = () => {
    if (!storeData) return;
    
    // Priorizar coordenadas, depois endereço
    if (storeData.latitude && storeData.longitude) {
      window.open(`https://waze.com/ul?ll=${storeData.latitude},${storeData.longitude}&navigate=yes`, '_blank');
    } else if (storeData.address) {
      const address = encodeURIComponent(storeData.address);
      window.open(`https://waze.com/ul?q=${address}`, '_blank');
    } else {
      toast.error('Localização da loja não configurada');
    }
  };

  const callStore = () => {
    if (!storeData?.phone) return;
    window.location.href = `tel:${storeData.phone}`;
  };

  const openStoreWhatsApp = () => {
    if (!storeData?.whatsapp) return;
    const cleanPhone = storeData.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  if (!assignment) return null;

  const order = assignment.orders;

  // ✅ STATUS MESTRE: Usar order.status do lojista ao invés de assignment.status
  const getStatusBadge = () => {
    switch (order.status) {
      case 'entrada':
        return <Badge variant="default" className="bg-blue-500">Pedido Recebido</Badge>;
      case 'em_preparo':
        return <Badge variant="default" className="bg-orange-500">Em Preparo</Badge>;
      case 'aguarda_retirada':
        return <Badge variant="secondary" className="bg-yellow-500">Aguardando Retirada</Badge>;
      case 'em_transito':
        return <Badge variant="secondary" className="bg-blue-500">Em Trânsito</Badge>;
      case 'concluido':
        return <Badge className="bg-green-600">Entregue</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{order.status}</Badge>;
    }
  };

  // ✅ STATUS MESTRE: Atualizar orders.status quando entregador retirar
  const handleMarkAsPickedUp = async () => {
    try {
      // 1. Atualizar order.status para 'em_transito' (status mestre)
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'em_transito',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 2. Atualizar assignment.status para 'picked_up' (controle interno)
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({
          status: 'picked_up',
          picked_up_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      if (assignmentError) throw assignmentError;

      toast.success('Pedido marcado como retirado!');
      fetchOrderDetails(); // Recarregar dados
    } catch (error: any) {
      console.error('Erro ao marcar como retirado:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // ✅ STATUS MESTRE: Atualizar orders.status quando entregador entregar
  const handleMarkAsDelivered = async () => {
    try {
      // 1. Atualizar assignment.status
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', assignment.id);

      if (assignmentError) throw assignmentError;

      // 2. Atualizar order.status para 'concluido' (status mestre)
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'concluido',
          completed_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      toast.success('Pedido entregue com sucesso!');
      fetchOrderDetails(); // Recarregar dados
    } catch (error: any) {
      console.error('Erro ao marcar como entregue:', error);
      toast.error('Erro ao finalizar entrega');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Pedido {formatOrderNumber(order.order_number)}</span>
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ✅ STATUS MESTRE: Usar order.status do lojista */}
            {/* Banner de Status - Aguardando Preparo */}
            {order.status === 'em_preparo' && (
              <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                      ⏳ Aguardando Lojista Preparar
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      O pedido está sendo preparado. Aguarde o lojista liberar para retirada.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Banner de Liberado - Pode Retirar */}
            {order.status === 'aguarda_retirada' && (
              <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                      ✅ Pedido Liberado para Retirada
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      O pedido está pronto. Você pode retirar e iniciar a entrega.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Banner de Privacidade */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Proteção de Dados:</strong> Por segurança e privacidade, os dados 
                pessoais do cliente são protegidos. Para comunicação, entre em contato com a loja.
              </div>
            </div>

            {/* Dados Protegidos do Cliente */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <p className="font-medium text-lg">{getFirstName(order.customer_name)}</p>
                <p className="text-xs text-yellow-600">
                  ⚠️ Dados pessoais protegidos - Fale com a loja se necessário
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Contato</Label>
                <p className="font-mono text-muted-foreground">{maskPhone(order.customer_phone)}</p>
                <p className="text-xs text-muted-foreground">
                  Para falar com o cliente, entre em contato com a loja
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Endereço de Entrega</Label>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p>{order.customer_address || 'Endereço não informado'}</p>
                </div>
              </div>
            </div>

            {/* Card de Localização da Loja - Para buscar o pedido */}
            {storeData && (storeData.address || (storeData.latitude && storeData.longitude)) && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg space-y-3">
                <Label className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-semibold">
                  <Building2 className="w-4 h-4" />
                  Localização da Loja
                </Label>
                
                <p className="text-sm text-muted-foreground">
                  Vá até a loja para retirar o pedido
                </p>
                
                {storeData.name && (
                  <p className="font-medium text-sm">{storeData.name}</p>
                )}
                
                {storeData.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{storeData.address}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={openGoogleMapsToStore}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Google Maps
                  </Button>
                  <Button 
                    onClick={openWazeToStore}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Waze
                  </Button>
                </div>
              </div>
            )}

            {/* Card de Contato com a Loja */}
            {storeData && (storeData.phone || storeData.whatsapp) && (
              <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg space-y-3">
                <Label className="flex items-center gap-2 text-primary">
                  <Store className="w-4 h-4" />
                  Precisa de Ajuda?
                </Label>
                
                <p className="text-sm text-muted-foreground">
                  Entre em contato com a loja para questões sobre o pedido
                </p>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  {storeData.phone && (
                    <Button 
                      onClick={callStore}
                      className="w-full gap-2"
                      variant="default"
                    >
                      <Phone className="w-4 h-4" />
                      Ligar para Loja
                    </Button>
                  )}
                  
                  {storeData.whatsapp && (
                    <Button 
                      onClick={openStoreWhatsApp}
                      className="w-full gap-2"
                      variant="secondary"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp Loja
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Mapa Interativo */}
            {storeConfig?.delivery_zones && (
              <div className="space-y-2">
                <div className="h-[250px] rounded-lg overflow-hidden border">
                  <CustomerMap
                    latitude={-15.7942}
                    longitude={-47.8822}
                    customerName={order.customer_name}
                    compact={false}
                  />
                </div>
                
                {/* Botões de Navegação para Cliente */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Navegação para o Cliente</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={openGoogleMapsToCustomer} 
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Google Maps
                    </Button>
                    <Button 
                      onClick={openWazeToCustomer} 
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Waze
                    </Button>
                  </div>
                </div>
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
          {/* ✅ STATUS MESTRE: Botões baseados em order.status */}
          {order.status === 'aguarda_retirada' && (
            <Button 
              onClick={handleMarkAsPickedUp} 
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600"
            >
              <Package className="w-4 h-4 mr-2" />
              Marcar como Retirado
            </Button>
          )}
          
          {order.status === 'em_transito' && (
            <Button 
              onClick={handleMarkAsDelivered} 
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Marcar como Entregue
            </Button>
          )}
          
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
