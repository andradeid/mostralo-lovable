import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CustomerSelector } from './CustomerSelector';
import { ProductSelector, NEW_ORDER_BARCODE_ZONE, type OrderItem } from './ProductSelector';
import { keepOpenOnToastClick } from '@/hooks/barcode/useBarcodeScanner';
import { OrderItemsList } from './OrderItemsList';
import { DriverSelector } from './DriverSelector';
import { CustomerFormDialog } from '../CustomerFormDialog';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { buildAdminOrderRequest, screenTotals, totalDiffers, withQuantity } from '@/lib/orders/adminOrderRequest';
import { createAdminOrder } from '@/lib/orders/createAdminOrder';
import { brl } from '@/lib/brl';

export interface CreateOrderCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

type Customer = CreateOrderCustomer;

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  prefilledCustomer?: Customer | null;
  prefilledItems?: OrderItem[];
  prefilledDeliveryFee?: number;
  source?: string;
}

export function CreateOrderDialog({ open, onOpenChange, onSuccess, prefilledCustomer, prefilledItems, prefilledDeliveryFee, source }: CreateOrderDialogProps) {
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
      if (prefilledCustomer) {
        // Sempre enriquecer dados do cliente para garantir endereço e coordenadas
        if (prefilledCustomer.phone) {
          enrichCustomerData(prefilledCustomer);
        } else {
          setSelectedCustomer(prefilledCustomer);
        }
      }
      if (prefilledItems && prefilledItems.length > 0) {
        setOrderItems(prefilledItems);
      }
    }
  }, [open, validatedStoreId, prefilledCustomer, prefilledItems]);

  const enrichCustomerData = async (customer: Customer) => {
    try {
      // Gerar todas as variantes possíveis do telefone
      const cleanPhone = customer.phone.replace(/\D/g, '');
      const phoneVariants = new Set<string>();
      phoneVariants.add(cleanPhone);
      
      // Com/sem DDI 55
      if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
        const withoutDDI = cleanPhone.slice(2);
        phoneVariants.add(withoutDDI);
        // Com/sem nono dígito (posição 3 após DDD)
        if (withoutDDI.length === 11) {
          phoneVariants.add(withoutDDI.slice(0, 2) + withoutDDI.slice(3)); // remove 9
        } else if (withoutDDI.length === 10) {
          phoneVariants.add(withoutDDI.slice(0, 2) + '9' + withoutDDI.slice(2)); // add 9
        }
      } else {
        phoneVariants.add('55' + cleanPhone);
        if (cleanPhone.length === 11) {
          phoneVariants.add(cleanPhone.slice(0, 2) + cleanPhone.slice(3));
          phoneVariants.add('55' + cleanPhone.slice(0, 2) + cleanPhone.slice(3));
        } else if (cleanPhone.length === 10) {
          phoneVariants.add(cleanPhone.slice(0, 2) + '9' + cleanPhone.slice(2));
          phoneVariants.add('55' + cleanPhone.slice(0, 2) + '9' + cleanPhone.slice(2));
        }
      }

      const { data } = await supabase
        .from('customers')
        .select('id, name, phone, email, address, latitude, longitude')
        .in('phone', Array.from(phoneVariants))
        .not('address', 'is', null)
        .limit(1)
        .maybeSingle();

      if (data) {
        setSelectedCustomer({
          id: data.id,
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          address: data.address || undefined,
          latitude: data.latitude || undefined,
          longitude: data.longitude || undefined,
        });
      } else {
        setSelectedCustomer(customer);
      }
    } catch {
      setSelectedCustomer(customer);
    }
  };

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
      // Use prefilled delivery fee if provided, otherwise use store default
      if (prefilledDeliveryFee !== undefined && prefilledDeliveryFee > 0) {
        setDeliveryFee(prefilledDeliveryFee);
      } else {
        setDeliveryFee(storeData.delivery_fee || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da loja:', error);
      toast.error('Erro ao carregar dados da loja');
    }
  };

  const handleAddProduct = (item: OrderItem) => {
    setOrderItems(prev => [...prev, item]);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    setOrderItems(prev => prev.map((item, i) => (i === index ? withQuantity(item, quantity) : item)));
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
      // O servidor confere o acesso, tira os preços do catálogo e grava pedido, itens,
      // adicionais, entregador e etiquetas do cliente (função admin-create-order).
      const shownTotal = screenTotals(orderItems, deliveryType, deliveryFee).total;
      const result = await createAdminOrder(buildAdminOrderRequest({
        storeId: validatedStoreId!,
        source,
        customer: selectedCustomer,
        items: orderItems,
        deliveryType,
        deliveryFee,
        paymentMethod,
        paymentDetails,
        paymentStatus,
        notes: orderNotes,
        driverId: selectedDriverId,
      }));

      const order = result.order;
      if (!order) {
        toast.error(result.message || 'Erro ao criar pedido. Tente novamente.');
        return;
      }

      toast.success('Pedido criado com sucesso!', {
        description: `Número do pedido: #${order.order_number}`,
      });
      if (totalDiffers(shownTotal, order.total)) {
        toast.info(`Preços conferidos pelo catálogo da loja. Total do pedido: ${brl(order.total)}`);
      }

      // ✅ Notificação para o lojista é enviada automaticamente pelo trigger do banco (notify_store_new_order)
      
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

  const { subtotal, delivery_fee: finalDeliveryFee, total } = screenTotals(orderItems, deliveryType, deliveryFee);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] p-0"
          data-barcode-zone={NEW_ORDER_BARCODE_ZONE}
          onInteractOutside={keepOpenOnToastClick}
        >
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
                      <CurrencyInput
                        value={deliveryFee}
                        onChange={setDeliveryFee}
                        placeholder="0,00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Valor padrão da loja: {brl((store?.delivery_fee || 0))}
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
                    <span>{brl(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de entrega:</span>
                    <span>{brl(finalDeliveryFee)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span>{brl(total)}</span>
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
