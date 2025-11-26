import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CustomerSelector } from './CustomerSelector';
import { ProductSelector, type OrderItem } from './ProductSelector';
import { OrderItemsList } from './OrderItemsList';
import { DriverSelector } from './DriverSelector';
import { CustomerFormDialog } from '../CustomerFormDialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateOrderDialog({ open, onOpenChange, onSuccess }: CreateOrderDialogProps) {
  const { storeId: validatedStoreId } = useStoreAccess();
  const [store, setStore] = useState<any>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [orderNotes, setOrderNotes] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && validatedStoreId) {
      fetchStoreData();
    }
  }, [open, validatedStoreId]);

  const fetchStoreData = async () => {
    if (!validatedStoreId) return;

    try {
      const { data: storeData, error } = await supabase
        .from('stores')
        .select('id, delivery_fee')
        .eq('id', validatedStoreId)
        .single();

      if (error) throw error;
      
      setStore(storeData);
      setDeliveryFee(storeData.delivery_fee || 0);
    } catch (error) {
      console.error('Erro ao buscar dados da loja:', error);
      toast.error('Erro ao carregar dados da loja');
    }
  };

  const handleAddProduct = (item: OrderItem) => {
    setOrderItems(prev => [...prev, item]);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    setOrderItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const addonsTotal = item.addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
      item.quantity = quantity;
      item.subtotal = (item.unitPrice + addonsTotal) * quantity;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };


  const handleSubmit = async () => {
    // Validações
    if (!selectedCustomer) {
      toast.error('Selecione um cliente');
      return;
    }
    
    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos um produto ao pedido');
      return;
    }
    
    if (deliveryType === 'delivery' && !selectedCustomer.address) {
      toast.error('Cliente precisa de endereço cadastrado para delivery');
      return;
    }

    setLoading(true);
    
    try {
      // Calcular totais
      const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
      const finalDeliveryFee = deliveryType === 'delivery' ? deliveryFee : 0;
      const total = subtotal + finalDeliveryFee;
      
      // Gerar número do pedido sequencial
      const { data: orderNumber, error: orderNumberError } = await supabase
        .rpc('get_next_order_number', { store_uuid: validatedStoreId });
      
      if (orderNumberError) {
        console.error('Error generating order number:', orderNumberError);
        throw orderNumberError;
      }
      
      // Criar pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          store_id: validatedStoreId,
          customer_id: selectedCustomer.id,
          customer_name: selectedCustomer.name,
          customer_phone: selectedCustomer.phone,
          customer_email: selectedCustomer.email,
          customer_address: deliveryType === 'delivery' ? selectedCustomer.address : null,
          delivery_type: deliveryType,
          payment_method: paymentMethod,
          payment_details: paymentDetails,
          payment_status: paymentStatus,
          status: 'entrada',
          subtotal,
          delivery_fee: finalDeliveryFee,
          total,
          notes: orderNotes,
          assigned_driver_id: deliveryType === 'delivery' ? selectedDriverId : null,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Criar delivery_assignment se houver entregador atribuído
      if (selectedDriverId && deliveryType === 'delivery') {
        const { error: assignmentError } = await supabase
          .from('delivery_assignments')
          .insert({
            order_id: order.id,
            delivery_driver_id: selectedDriverId,
            store_id: validatedStoreId,
            status: 'assigned',
            assigned_at: new Date().toISOString(),
          });
        
        if (assignmentError) {
          console.error('Erro ao criar atribuição:', assignmentError);
        }
      }
      
      // Criar order_items
      const itemsToInsert = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        notes: item.notes,
      }));
      
      const { data: insertedItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert)
        .select();
      
      if (itemsError) throw itemsError;
      
      // Criar order_addons
      const addonsToInsert: any[] = [];
      orderItems.forEach((item, itemIndex) => {
        if (item.addons && item.addons.length > 0) {
          item.addons.forEach(addon => {
            addonsToInsert.push({
              order_item_id: insertedItems[itemIndex].id,
              addon_id: addon.id,
              addon_name: addon.name,
              quantity: addon.quantity,
              unit_price: addon.price,
              subtotal: addon.price * addon.quantity,
            });
          });
        }
      });
      
      if (addonsToInsert.length > 0) {
        const { error: addonsError } = await supabase
          .from('order_addons')
          .insert(addonsToInsert);
        
        if (addonsError) throw addonsError;
      }
      
      toast.success('Pedido criado com sucesso!', {
        description: `Número do pedido: #${order.order_number}`,
      });
      
      // Reset e fechar
      resetForm();
      onSuccess();
      onOpenChange(false);
      
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setOrderItems([]);
    setDeliveryType('delivery');
    setPaymentMethod('pix');
    setPaymentDetails(null);
    setPaymentStatus('pending');
    setOrderNotes('');
    setSelectedDriverId(null);
  };

  const handleCustomerCreated = () => {
    setShowCustomerForm(false);
    toast.success('Cliente criado com sucesso');
    // O CustomerSelector vai recarregar a lista automaticamente
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const finalDeliveryFee = deliveryType === 'delivery' ? deliveryFee : 0;
  const total = subtotal + finalDeliveryFee;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Criar Novo Pedido</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[calc(90vh-180px)] px-6">
            <div className="space-y-6 pb-6">
              {/* Cliente */}
              <CustomerSelector
                storeId={validatedStoreId || ''}
                selectedCustomer={selectedCustomer}
                onSelect={setSelectedCustomer}
                onCreateNew={() => setShowCustomerForm(true)}
              />
              
              <Separator />
              
              {/* Adicionar Produtos */}
              <ProductSelector
                storeId={validatedStoreId || ''}
                onAddProduct={handleAddProduct}
              />
              
              <Separator />
              
              {/* Lista de Itens */}
              <OrderItemsList
                items={orderItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
              />
              
              <Separator />
              
              {/* Configurações do Pedido */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Configurações do Pedido</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Entrega</Label>
                    <Select value={deliveryType} onValueChange={(v: any) => setDeliveryType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="pickup">Retirada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {deliveryType === 'delivery' && (
                    <div className="space-y-2">
                      <Label>Taxa de Entrega (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(Number(e.target.value))}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Valor padrão da loja: R$ {(store?.delivery_fee || 0).toFixed(2)}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select value={paymentMethod} onValueChange={(v: any) => {
                      setPaymentMethod(v);
                      if (v !== 'card') setPaymentDetails(null);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="card">Cartão</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Tipo de cartão (se cartão selecionado) */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-2">
                      <Label>Tipo de Cartão</Label>
                      <Select 
                        value={paymentDetails?.card_type || ''} 
                        onValueChange={(value) => setPaymentDetails({ card_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit">Crédito</SelectItem>
                          <SelectItem value="debit">Débito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Status do Pagamento</Label>
                  <Select value={paymentStatus} onValueChange={(v: any) => setPaymentStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Observações do Pedido (opcional)</Label>
                  <Textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Observações gerais sobre o pedido..."
                    rows={3}
                  />
                </div>

                {deliveryType === 'delivery' && (
                  <div className="space-y-2">
                    <Label>Entregador (opcional)</Label>
                    <DriverSelector
                      storeId={validatedStoreId || ''}
                      selectedDriverId={selectedDriverId}
                      onSelect={setSelectedDriverId}
                      deliveryType={deliveryType}
                    />
                    <p className="text-xs text-muted-foreground">
                      Você pode atribuir um entregador agora ou deixar para depois
                    </p>
                  </div>
                )}
              </div>
              
              {/* Resumo Financeiro */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <Label className="text-base font-semibold">Resumo do Pedido</Label>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de entrega:</span>
                    <span>R$ {finalDeliveryFee.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Criar Cliente */}
      <CustomerFormDialog
        open={showCustomerForm}
        onClose={() => setShowCustomerForm(false)}
        onSuccess={handleCustomerCreated}
      />
    </>
  );
}
