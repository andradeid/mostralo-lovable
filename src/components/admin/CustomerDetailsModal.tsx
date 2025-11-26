import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CustomerMap } from './CustomerMap';
import { CustomerPasswordResetDialog } from './CustomerPasswordResetDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, Phone, MapPin, ShoppingBag, DollarSign, Calendar, Loader2, Navigation, KeyRound } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
  created_at: string;
  auth_user_id?: string;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  delivery_type: string;
}

interface CustomerDetailsModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
}

export const CustomerDetailsModal = ({ open, onClose, customerId }: CustomerDetailsModalProps) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);

  useEffect(() => {
    if (open && customerId) {
      loadCustomerData();
    }
  }, [open, customerId]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      // Buscar loja do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: storesData } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!storesData) throw new Error('Loja não encontrada');

      // Buscar dados do cliente específicos da loja
      const { data: customerStoreData } = await supabase
        .from('customer_stores')
        .select('total_orders, total_spent, last_order_at, first_order_at')
        .eq('customer_id', customerId)
        .eq('store_id', storesData.id)
        .single();

      // Buscar dados básicos do cliente
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;
      
      // Mesclar dados do cliente com estatísticas da loja
      setCustomer({
        ...customerData,
        total_orders: customerStoreData?.total_orders || 0,
        total_spent: customerStoreData?.total_spent || 0,
        last_order_at: customerStoreData?.last_order_at || null,
      });

      // Buscar apenas pedidos da loja atual
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total, status, created_at, delivery_type')
        .eq('customer_id', customerId)
        .eq('store_id', storesData.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      entrada: 'bg-blue-500',
      producao: 'bg-yellow-500',
      entrega: 'bg-purple-500',
      finalizado: 'bg-green-500',
      cancelado: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            {customer?.auth_user_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPasswordResetOpen(true)}
                className="gap-2"
              >
                <KeyRound className="h-4 w-4" />
                Redefinir Senha
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : customer ? (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="orders">Pedidos ({orders.length})</TabsTrigger>
              <TabsTrigger value="map">Localização</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <ScrollArea className="h-[calc(90vh-200px)] md:h-[500px] pr-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Total de Pedidos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{customer.total_orders}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Total Gasto
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          R$ {Number(customer.total_spent).toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Último Pedido
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          {customer.last_order_at
                            ? format(new Date(customer.last_order_at), "dd/MM/yyyy", { locale: ptBR })
                            : 'Nenhum pedido'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Dados de Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">Telefone</div>
                          <div className="text-sm text-muted-foreground">{customer.phone}</div>
                        </div>
                      </div>

                      {customer.email && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">Email</div>
                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                          </div>
                        </div>
                      )}

                      {customer.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">Endereço</div>
                            <div className="text-sm text-muted-foreground">{customer.address}</div>
                          </div>
                        </div>
                      )}

                      {customer.notes && (
                        <div>
                          <div className="font-medium mb-1">Observações</div>
                          <div className="text-sm text-muted-foreground">{customer.notes}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="orders">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Nenhum pedido encontrado
                    </div>
                  ) : (
                    orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="font-medium">#{order.order_number}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <div className="font-bold">R$ {Number(order.total).toFixed(2)}</div>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="map">
              <ScrollArea className="h-[calc(90vh-200px)] md:h-[500px] pr-4">
                {customer.latitude && customer.longitude ? (
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden">
                      <CustomerMap
                        latitude={customer.latitude}
                        longitude={customer.longitude}
                        customerName={customer.name}
                        compact={true}
                      />
                    </div>
                    
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <div className="text-sm">
                          <div className="font-medium mb-2">Coordenadas:</div>
                          <div className="text-muted-foreground space-y-1">
                            <div>Latitude: {customer.latitude.toFixed(6)}</div>
                            <div>Longitude: {customer.longitude.toFixed(6)}</div>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="text-sm font-medium mb-3">Navegação:</div>
                          <div className="grid grid-cols-1 gap-2">
                            <button
                              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                              onClick={() => window.open(
                                `https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`,
                                '_blank'
                              )}
                            >
                              <Navigation className="h-4 w-4" />
                              Abrir no Google Maps
                            </button>
                            
                            <button
                              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-3 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
                              onClick={() => window.open(
                                `https://waze.com/ul?ll=${customer.latitude},${customer.longitude}&navigate=yes`,
                                '_blank'
                              )}
                            >
                              <Navigation className="h-4 w-4" />
                              Abrir no Waze
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Localização não disponível
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : null}

        {customer && (
          <CustomerPasswordResetDialog
            open={passwordResetOpen}
            onClose={() => setPasswordResetOpen(false)}
            customerId={customer.id}
            customerName={customer.name}
            customerPhone={customer.phone}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
