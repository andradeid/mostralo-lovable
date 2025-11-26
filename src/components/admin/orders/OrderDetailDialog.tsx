import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { CancelOrderDialog } from "./CancelOrderDialog";
import { CustomerMap } from "../CustomerMap";
import { DriverBadge } from "./DriverBadge";
import { useDriverPresence } from "@/hooks/useDriverPresence";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone, Mail, MapPin, Package, CreditCard, FileText, X, Printer, Eye, Navigation, Clock, AlertCircle } from "lucide-react";
import { mockOrderItems } from "@/utils/mockOrders";
import { printOrder, executePrint } from "@/utils/printOrder";
import { PrintPreviewDialog } from "@/components/admin/print/PrintPreviewDialog";

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type OrderAddon = Database['public']['Tables']['order_addons']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: () => void;
}

interface OrderItemWithAddons extends OrderItem {
  addons?: OrderAddon[];
}

interface CustomerLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export const OrderDetailDialog = ({ order, open, onOpenChange, onStatusChange }: OrderDetailDialogProps) => {
  const [items, setItems] = useState<OrderItemWithAddons[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [customerLocation, setCustomerLocation] = useState<CustomerLocation | null>(null);
  const [preferredApp, setPreferredApp] = useState<'google_maps' | 'waze'>('google_maps');
  const [assignedDriverId, setAssignedDriverId] = useState<string | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtmls, setPreviewHtmls] = useState<string[]>([]);
  const [previewViaNames, setPreviewViaNames] = useState<string[]>([]);
  const [storeName, setStoreName] = useState<string>('Loja');

  useEffect(() => {
    if (order && open) {
      setSelectedStatus(order.status);
      setAssignedDriverId(order.assigned_driver_id);
      fetchOrderItems();
      fetchAvailableDrivers();
    }
  }, [order, open]);

  const fetchOrderItems = async () => {
    if (!order) return;

    // Buscar preferência de navegação da loja
    const { data: storeData } = await supabase
      .from('stores')
      .select('preferred_navigation_app')
      .limit(1)
      .single();
    
    if (storeData?.preferred_navigation_app) {
      setPreferredApp(storeData.preferred_navigation_app as 'google_maps' | 'waze');
    }

    // Buscar localização do cliente
    if (order.customer_id) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('latitude, longitude, address')
        .eq('id', order.customer_id)
        .single();

      if (customerData?.latitude && customerData?.longitude) {
        setCustomerLocation({
          latitude: Number(customerData.latitude),
          longitude: Number(customerData.longitude),
          address: customerData.address || order.customer_address || ''
        });
      }
    }

    // Tentar buscar itens reais do banco
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    // Se houver erro ou não houver dados, usar mock
    if (itemsError || !itemsData || itemsData.length === 0) {
      const mockItems = mockOrderItems[order.id];
      if (mockItems) {
        setItems(mockItems as OrderItemWithAddons[]);
      }
      return;
    }

    const itemsWithAddons = await Promise.all(
      (itemsData || []).map(async (item) => {
        const { data: addonsData } = await supabase
          .from('order_addons')
          .select('*')
          .eq('order_item_id', item.id);

        return {
          ...item,
          addons: addonsData || []
        };
      })
    );

    setItems(itemsWithAddons);
  };

  const fetchAvailableDrivers = async () => {
    if (!order) return;
    
    try {
      // Buscar entregadores da loja
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('store_id', order.store_id)
        .eq('role', 'delivery_driver');
      
      if (!userRoles || userRoles.length === 0) {
        setAvailableDrivers([]);
        return;
      }
      
      const driverIds = userRoles.map(r => r.user_id);
      
      const { data: drivers } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', driverIds)
        .eq('is_blocked', false)
        .eq('is_deleted', false);
      
      setAvailableDrivers(drivers || []);
    } catch (error) {
      console.error('Erro ao buscar entregadores:', error);
      setAvailableDrivers([]);
    }
  };

  const handleDriverChange = async (newDriverId: string) => {
    if (!order) return;
    
    const driverId = newDriverId === 'none' ? null : newDriverId;
    
    setIsLoading(true);
    
    try {
      // Atualizar pedido
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          assigned_driver_id: driverId,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
      
      if (orderError) throw orderError;
      
      // Se está atribuindo um entregador (não removendo)
      if (driverId) {
        // Verificar se já existe assignment
        const { data: existingAssignment } = await supabase
          .from('delivery_assignments')
          .select('id')
          .eq('order_id', order.id)
          .maybeSingle();
        
        if (existingAssignment) {
          // Atualizar assignment existente
          await supabase
            .from('delivery_assignments')
            .update({
              delivery_driver_id: driverId,
              status: 'assigned',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAssignment.id);
        } else {
          // Criar novo assignment
          await supabase
            .from('delivery_assignments')
            .insert({
              order_id: order.id,
              delivery_driver_id: driverId,
              store_id: order.store_id,
              status: 'assigned',
              assigned_at: new Date().toISOString()
            });
        }
      } else {
        // Remover assignment se está desatribuindo
        await supabase
          .from('delivery_assignments')
          .delete()
          .eq('order_id', order.id);
      }
      
      toast.success(
        driverId ? 'Entregador atribuído com sucesso!' : 'Entregador removido'
      );
      
      setAssignedDriverId(driverId);
      onStatusChange(); // Atualizar lista de pedidos
      
    } catch (error) {
      console.error('Erro ao alterar entregador:', error);
      toast.error('Erro ao alterar entregador');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order || !selectedStatus) return;

    setIsLoading(true);
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === 'concluido') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    setIsLoading(false);

    if (error) {
      toast.error('Erro ao atualizar status do pedido');
      console.error(error);
      return;
    }

    toast.success('Status atualizado com sucesso!');
    setSelectedStatus(newStatus);
    onStatusChange();
  };

  const handleCancelOrder = async (reason: string) => {
    if (!order) return;

    setIsLoading(true);
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelado',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    setIsLoading(false);
    setCancelDialogOpen(false);

    if (error) {
      toast.error('Erro ao cancelar pedido');
      console.error(error);
      return;
    }

    toast.success('Pedido cancelado com sucesso');
    setSelectedStatus('cancelado');
    onStatusChange();
    onOpenChange(false);
  };

  const handlePrint = async () => {
    if (!order) return;
    
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', order.store_id)
        .single();
      
      await printOrder(order as any, storeData?.name || 'Loja');
      toast.success('Impressão iniciada com sucesso!');
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast.error('Erro ao imprimir pedido');
    }
  };

  const handlePreview = async () => {
    if (!order) return;
    
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

  const handleConfirmPrint = () => {
    executePrint(previewHtmls);
  };

  if (!order) return null;

  // Filtrar status baseado no tipo de entrega
  // Agora ambos têm aguarda_retirada, mas delivery também tem em_transito
  const statusOptions: OrderStatus[] = order.delivery_type === 'pickup'
    ? ['entrada', 'em_preparo', 'aguarda_retirada', 'concluido'] // Pickup: entrada -> preparo -> aguarda retirada -> concluido
    : ['entrada', 'em_preparo', 'aguarda_retirada', 'em_transito', 'concluido']; // Delivery: entrada -> preparo -> aguarda entregador -> em trânsito -> concluido
  
  const canChangeStatus = order.status !== 'cancelado' && order.status !== 'concluido';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">{order.order_number}</DialogTitle>
              <OrderStatusBadge status={selectedStatus || order.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            
            {/* Data de Agendamento - SE EXISTIR */}
            {order.scheduled_for && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Pedido Agendado
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Para: {format(new Date(order.scheduled_for), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-6 pr-2">
              {/* Status */}
              {canChangeStatus && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alterar Status</label>
                  
                  {/* Botão Especial: Liberar para Retirada (apenas para pickup) */}
                  {order.delivery_type === 'pickup' && order.status === 'em_preparo' && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                        ✅ Pedido em preparo
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                        Quando o pedido estiver pronto, clique no botão abaixo para liberar para retirada
                      </p>
                      <Button 
                        onClick={() => handleStatusChange('aguarda_retirada')}
                        disabled={isLoading}
                        className="w-full"
                      >
                        📦 Liberar para Retirada
                      </Button>
                    </div>
                  )}
                  
                  <Select value={selectedStatus || order.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === 'entrada' ? 'Entrada' :
                           status === 'em_preparo' ? 'Em Preparo' :
                           status === 'aguarda_retirada' ? 'Aguarda Retirada' :
                           status === 'em_transito' ? 'Em Trânsito' : 'Concluído'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Cliente */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Informações do Cliente</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer_phone}</span>
                  </div>
                  {order.customer_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{order.customer_email}</span>
                    </div>
                  )}
                  {order.customer_address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{order.customer_address}</span>
                    </div>
                  )}
                </div>

                {/* Mapa e Navegação */}
                {customerLocation && (
                  <div className="mt-4 space-y-3">
                    <CustomerMap
                      latitude={customerLocation.latitude}
                      longitude={customerLocation.longitude}
                      customerName={order.customer_name}
                      compact={true}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(
                          `https://www.google.com/maps/search/?api=1&query=${customerLocation.latitude},${customerLocation.longitude}`,
                          '_blank'
                        )}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Google Maps
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(
                          `https://waze.com/ul?ll=${customerLocation.latitude},${customerLocation.longitude}&navigate=yes`,
                          '_blank'
                        )}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Waze
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Entregador - APENAS PARA DELIVERY */}
              {order.delivery_type === 'delivery' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Entregador Responsável</h3>
                  
                  {canChangeStatus && (
                    <div className="space-y-2">
                      <Label>Selecionar Entregador</Label>
                      <Select 
                        value={assignedDriverId || 'none'} 
                        onValueChange={handleDriverChange}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sem entregador atribuído" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-muted-foreground" />
                              <span>Sem entregador</span>
                            </div>
                          </SelectItem>
                          {availableDrivers.map(driver => (
                            <SelectItem key={driver.id} value={driver.id}>
                              <DriverOptionDisplay driver={driver} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Você pode trocar o entregador a qualquer momento
                      </p>
                    </div>
                  )}
                  
                  {/* Mostrar entregador atual se não puder alterar */}
                  {!canChangeStatus && assignedDriverId && (
                    <div>
                      <DriverBadge driverId={assignedDriverId} />
                    </div>
                  )}
                  
                  {/* Mensagem se não tiver entregador */}
                  {!assignedDriverId && (
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Nenhum entregador atribuído a este pedido
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Itens do Pedido */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Itens do Pedido</h3>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantidade: {item.quantity} x R$ {Number(item.unit_price).toFixed(2)}
                          </p>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              Obs: {item.notes}
                            </p>
                          )}
                        </div>
                        <p className="font-semibold">R$ {Number(item.subtotal).toFixed(2)}</p>
                      </div>

                      {item.addons && item.addons.length > 0 && (
                        <div className="pl-4 border-l-2 space-y-1">
                          {item.addons.map((addon) => (
                            <div key={addon.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                + {addon.addon_name} x{addon.quantity}
                              </span>
                              <span>R$ {Number(addon.subtotal).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Resumo */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Resumo Financeiro</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>R$ {Number(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa de Entrega:</span>
                    <span>R$ {Number(order.delivery_fee).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {Number(order.total).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm pt-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {order.payment_method === 'pix' ? 'PIX' : 
                     order.payment_method === 'card' ? (
                       (order as any).payment_details?.card_type === 'credit' ? 'Cartão de Crédito' :
                       (order as any).payment_details?.card_type === 'debit' ? 'Cartão de Débito' : 
                       'Cartão'
                     ) : 
                     order.payment_method === 'cash' ? 'Dinheiro' : 
                     order.payment_method}
                  </span>
                  <span className="text-muted-foreground">
                    ({order.payment_status === 'paid' ? 'Pago' :
                      order.payment_status === 'cancelled' ? 'Cancelado' : 'Pendente'})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{order.delivery_type === 'delivery' ? 'Delivery' : 'Retirada no Balcão'}</span>
                </div>
              </div>

              {order.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Observações
                    </h3>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                  </div>
                </>
              )}

              {order.status === 'cancelado' && order.cancellation_reason && (
                <>
                  <Separator />
                  <div className="space-y-2 bg-destructive/10 p-4 rounded-lg">
                    <h3 className="font-semibold text-destructive">Motivo do Cancelamento</h3>
                    <p className="text-sm">{order.cancellation_reason}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t flex-shrink-0 mt-auto">
            {canChangeStatus && (
              <Button
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar Pedido
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handlePreview}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Visualizar
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CancelOrderDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelOrder}
        isLoading={isLoading}
      />

      <PrintPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        htmlContents={previewHtmls}
        viaNames={previewViaNames}
        onConfirmPrint={handleConfirmPrint}
      />
    </>
  );
};

// Componente auxiliar para exibir opção de entregador
const DriverOptionDisplay = ({ driver }: { driver: any }) => {
  const isOnline = useDriverPresence(driver.id);
  
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="relative">
        <Avatar className="h-6 w-6">
          <AvatarImage src={driver.avatar_url || undefined} />
          <AvatarFallback className="text-xs">{driver.full_name[0]}</AvatarFallback>
        </Avatar>
        <div 
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      </div>
      <span className="flex-1">{driver.full_name}</span>
      {isOnline && (
        <Badge variant="outline" className="text-xs h-5">
          Online
        </Badge>
      )}
    </div>
  );
};
