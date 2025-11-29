import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { 
  findApplicablePromotions, 
  validatePromotionCode, 
  calculatePromotionDiscount,
  findBestPromotion 
} from '@/utils/promotionCalculator';
import type { Promotion } from '@/types/promotions';
import type { ZoneValidationResult } from '@/utils/deliveryZoneValidation';
import { ChevronLeft, Loader2 } from "lucide-react";
import { normalizePhone } from '@/lib/utils';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { validateScheduledTime, generateAvailableSlots, ScheduledOrdersSettings, convertToMinutes } from '@/utils/scheduledOrdersValidation';

// Import step components
import { DeliveryStep } from './steps/DeliveryStep';
import { CustomerDataStep } from './steps/CustomerDataStep';
import { PaymentStep } from './steps/PaymentStep';
import { ConfirmationStep } from './steps/ConfirmationStep';

const checkoutSchema = z.object({
  customerName: z.string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(120, 'Nome deve ter no máximo 120 caracteres'),
  customerPhone: z.string()
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  customerEmail: z.string()
    .trim()
    .email('E-mail inválido')
    .max(255, 'E-mail muito longo')
    .optional()
    .or(z.literal('')),
  customerAddress: z.string()
    .trim()
    .max(500, 'Endereço muito longo')
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .trim()
    .max(500, 'Observações muito longas')
    .optional()
    .or(z.literal('')),
});

type DeliveryType = Database['public']['Enums']['delivery_type'];
type PaymentMethod = Database['public']['Enums']['payment_method'];

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  deliveryFee: number;
  isServicePaused?: boolean;
  scheduledOrdersEnabled?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

export const CheckoutDialog = ({ 
  open, 
  onOpenChange, 
  storeId, 
  deliveryFee,
  isServicePaused = false,
  scheduledOrdersEnabled = false,
  primaryColor = '#FF9500',
  secondaryColor
}: CheckoutDialogProps) => {
  const { items, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [isLoading, setIsLoading] = useState(false);
  
  // Step control
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { id: 'delivery', title: 'Entrega', label: 'Entrega' },
    { id: 'customer', title: 'Seus Dados', label: 'Dados' },
    { id: 'payment', title: 'Pagamento', label: 'Pagamento' },
    { id: 'confirmation', title: 'Confirmação', label: 'Confirmar' }
  ];
  
  // Customer data states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  
  // Delivery states
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [deliveryZoneInfo, setDeliveryZoneInfo] = useState<ZoneValidationResult | null>(null);
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  // Scheduling states
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [scheduledConfig, setScheduledConfig] = useState<ScheduledOrdersSettings | null>(null);
  const [businessHours, setBusinessHours] = useState<any>(null);

  // Promotion states
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [promotionDiscount, setPromotionDiscount] = useState(0);
  const [isApplyingPromotion, setIsApplyingPromotion] = useState(false);
  const [autoPromotionChecked, setAutoPromotionChecked] = useState(false);

  // Prefill data and load configurations
  useEffect(() => {
    if (open && storeId) {
      const checkAuth = async () => {
        const savedProfile = localStorage.getItem(`customer_${storeId}`);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!savedProfile || !session) {
          toast.error('Você precisa estar logado para finalizar o pedido');
          onOpenChange(false);
          return;
        }
        
        try {
          const profile = JSON.parse(savedProfile);
          setCustomerName(profile.name || '');
          const formattedPhone = profile.phone ? formatPhone(profile.phone) : '';
          setCustomerPhone(formattedPhone);
          setCustomerEmail(profile.email || '');
          setCustomerAddress(profile.address || '');
          setLatitude(profile.latitude || null);
          setLongitude(profile.longitude || null);
        } catch (error) {
          console.error('Erro ao carregar perfil:', error);
        }
      };
      
      checkAuth();
      fetchStoreConfig();
      
      if (isServicePaused && scheduledOrdersEnabled) {
        setIsScheduled(true);
      }

      const pendingCode = localStorage.getItem(`pending_promo_${storeId}`);
      if (pendingCode) {
        setPromotionCode(pendingCode);
        localStorage.removeItem(`pending_promo_${storeId}`);
        setTimeout(() => {
          handleApplyPromotionCode();
        }, 500);
      }
      
      // Reset step on open
      setCurrentStep(0);
    }
  }, [open, storeId, isServicePaused, scheduledOrdersEnabled]);

  // Auto promotions
  useEffect(() => {
    if (open && !autoPromotionChecked && items.length > 0) {
      findAutoPromotions();
    }
  }, [open, items, autoPromotionChecked]);

  // Revalidate promotions
  useEffect(() => {
    if (!open || items.length === 0) return;

    const revalidatePromotion = async () => {
      if (appliedPromotion) {
        const result = await calculatePromotionDiscount(appliedPromotion, {
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category_id: undefined
          })),
          subtotal: getTotalPrice(),
          deliveryType,
          deliveryFee: finalDeliveryFee,
          storeId
        });

        if (!result.isValid || result.discount <= 0) {
          setAppliedPromotion(null);
          setPromotionDiscount(0);
          toast.info('Promoção removida (não se aplica mais)');
        } else {
          setPromotionDiscount(result.discount);
        }
      } else {
        findAutoPromotions(true);
      }
    };

    revalidatePromotion();
  }, [deliveryType, items, open]);
  
  // Generate time slots
  useEffect(() => {
    if (selectedDate && scheduledConfig && businessHours) {
      const slots = generateAvailableSlots(
        selectedDate,
        deliveryType,
        scheduledConfig,
        businessHours
      );
      setAvailableSlots(slots);
    }
  }, [selectedDate, deliveryType, scheduledConfig, businessHours]);
  
  async function fetchStoreConfig() {
    try {
      const { data: store } = await supabase
        .from('stores')
        .select('business_hours, delivery_config')
        .eq('id', storeId)
        .single();
        
      if (store) {
        setBusinessHours(store.business_hours);
        const deliveryConfig = store.delivery_config as any;
        if (deliveryConfig?.scheduled_orders) {
          setScheduledConfig(deliveryConfig.scheduled_orders);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  }

  const handleApplyPromotionCode = async () => {
    if (!promotionCode.trim()) {
      toast.error('Digite um código de promoção');
      return;
    }

    setIsApplyingPromotion(true);
    try {
      const promotion = await validatePromotionCode(promotionCode.trim(), storeId);
      
      if (!promotion) {
        toast.error('Código de promoção inválido ou expirado');
        return;
      }

      const result = await calculatePromotionDiscount(promotion, {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category_id: undefined
        })),
        subtotal: getTotalPrice(),
        deliveryType,
        deliveryFee: finalDeliveryFee,
        storeId
      });

      if (!result.isValid) {
        toast.error(result.message);
        return;
      }

      setAppliedPromotion(promotion);
      setPromotionDiscount(result.discount);
      toast.success(result.message);
    } catch (error) {
      console.error('Erro ao aplicar promoção:', error);
      toast.error('Erro ao aplicar promoção');
    } finally {
      setIsApplyingPromotion(false);
    }
  };

  const handleRemovePromotion = () => {
    setAppliedPromotion(null);
    setPromotionDiscount(0);
    setPromotionCode("");
    toast.info('Promoção removida');
  };

  const findAutoPromotions = async (silent = false) => {
    try {
      const applicablePromotions = await findApplicablePromotions(storeId, {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          category_id: undefined
        })),
        subtotal: getTotalPrice(),
        deliveryType,
        deliveryFee: finalDeliveryFee,
        storeId
      });

      if (applicablePromotions.length > 0) {
        const bestPromotion = await findBestPromotion(applicablePromotions, {
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category_id: undefined
          })),
          subtotal: getTotalPrice(),
          deliveryType,
          deliveryFee: finalDeliveryFee,
          storeId
        });

        if (bestPromotion) {
          const result = await calculatePromotionDiscount(bestPromotion, {
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              category_id: undefined
            })),
            subtotal: getTotalPrice(),
            deliveryType,
            deliveryFee: finalDeliveryFee,
            storeId
          });

          if (result.isValid) {
            setAppliedPromotion(bestPromotion);
            setPromotionDiscount(result.discount);
            if (!silent) {
              toast.success('🎉 Promoção aplicada automaticamente!', {
                description: result.message
              });
            }
          }
        }
      }
      setAutoPromotionChecked(true);
    } catch (error) {
      console.error('Erro ao buscar promoções:', error);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const subtotal = getTotalPrice();
  const finalDeliveryFee = deliveryType === 'delivery' 
    ? (deliveryZoneInfo?.deliveryFee ?? deliveryFee) 
    : 0;
  const totalBeforeDiscount = subtotal + finalDeliveryFee;
  const total = totalBeforeDiscount - promotionDiscount;

  // Step validation
  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 0: // Delivery Step
        // Validação de endereço apenas para entrega
        if (deliveryType === 'delivery' && !customerAddress.trim()) {
          toast.error('Informe o endereço de entrega');
          return false;
        }
        
        // Validação de localização apenas para entrega
        if (deliveryType === 'delivery' && (!latitude || !longitude)) {
          toast.error('Selecione sua localização no mapa');
          return false;
        }
        
        if (isScheduled) {
          if (!selectedDate || !selectedTime) {
            toast.error('Selecione data e horário para o agendamento');
            return false;
          }
          
          const [hours, minutes] = selectedTime.split(':').map(Number);
          const scheduledDateTime = new Date(selectedDate);
          scheduledDateTime.setHours(hours, minutes, 0, 0);
          
          if (scheduledConfig) {
            const validation = validateScheduledTime(
              scheduledDateTime,
              deliveryType,
              scheduledConfig,
              businessHours
            );
            
            if (!validation.valid) {
              toast.error(validation.error || 'Horário inválido para agendamento');
              return false;
            }
          }
        }
        
        if (isServicePaused && scheduledOrdersEnabled && !isScheduled) {
          toast.error('O serviço está pausado. Por favor, agende seu pedido.');
          return false;
        }
        return true;

      case 1: // Customer Data Step
        const validation = checkoutSchema.safeParse({
          customerName: customerName.trim(),
          customerPhone: normalizePhone(customerPhone),
          customerEmail: customerEmail.trim(),
          customerAddress: customerAddress.trim(),
          notes: notes.trim(),
        });

        if (!validation.success) {
          toast.error(validation.error.issues[0].message);
          return false;
        }
        return true;

      case 2: // Payment Step
        if (paymentMethod === 'cash' && needsChange) {
          if (!changeAmount || changeAmount.trim() === '') {
            toast.error('Por favor, informe o valor para o troco');
            return false;
          }
          
          const changeValue = parseFloat(changeAmount.replace(',', '.'));
          if (isNaN(changeValue) || changeValue <= 0) {
            toast.error('Valor do troco inválido');
            return false;
          }
          
          if (changeValue < total) {
            toast.error('O valor do troco deve ser maior que o total do pedido');
            return false;
          }
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) return;
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhone(customerPhone);

      // Get or create customer (GLOBAL)
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      let customerId: string;
      
      if (existingCustomer) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            name: customerName,
            email: customerEmail || null,
            address: deliveryType === 'delivery' ? customerAddress : null,
            latitude: latitude,
            longitude: longitude,
          })
          .eq('id', existingCustomer.id);

        if (updateError) throw updateError;
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert({
            name: customerName,
            phone: normalizedPhone,
            email: customerEmail || null,
            address: deliveryType === 'delivery' ? customerAddress : null,
            latitude: latitude,
            longitude: longitude,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        customerId = newCustomer.id;
      }

      // Create customer-store relationship
      await supabase
        .from('customer_stores')
        .upsert({
          customer_id: customerId,
          store_id: storeId,
          first_order_at: new Date().toISOString(),
        }, {
          onConflict: 'customer_id,store_id'
        });

      // Prepare scheduled_for if scheduled
      let scheduledFor = null;
      if (isScheduled && selectedDate && selectedTime) {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const scheduledDateTime = new Date(selectedDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        scheduledFor = scheduledDateTime.toISOString();
      }
      
      // Build final notes with change info
      let finalNotes = notes.trim();
      if (paymentMethod === 'cash') {
        const trocoInfo = needsChange && changeAmount 
          ? `\n💰 TROCO PARA: R$ ${changeAmount}` 
          : '\n✅ VALOR EXATO (não precisa troco)';
        finalNotes = (finalNotes + trocoInfo).trim();
      }

      // Final promotion validation
      let finalPromotionDiscount = promotionDiscount;
      let finalAppliedPromotion = appliedPromotion;
      
      if (appliedPromotion) {
        const finalCheck = await calculatePromotionDiscount(appliedPromotion, {
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category_id: undefined
          })),
          subtotal,
          deliveryType,
          deliveryFee: finalDeliveryFee,
          storeId
        });

        if (!finalCheck.isValid || finalCheck.discount <= 0) {
          finalPromotionDiscount = 0;
          finalAppliedPromotion = null;
        } else {
          finalPromotionDiscount = finalCheck.discount;
        }
      }
      
      // Generate sequential order number via RPC
      const { data: orderNumber, error: numberError } = await supabase
        .rpc('get_next_order_number', { store_uuid: storeId });

      if (numberError) throw numberError;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          store_id: storeId,
          customer_id: customerId,
          customer_name: customerName,
          customer_phone: normalizedPhone,
          customer_email: customerEmail || null,
          customer_address: deliveryType === 'delivery' ? customerAddress : null,
          delivery_type: deliveryType,
          payment_method: paymentMethod,
          payment_details: paymentDetails,
          payment_status: 'pending',
          status: 'entrada',
          subtotal,
          delivery_fee: deliveryType === 'delivery' ? finalDeliveryFee : 0,
          total: subtotal + finalDeliveryFee - finalPromotionDiscount,
          notes: finalNotes || null,
          scheduled_for: scheduledFor,
          promotion_id: finalAppliedPromotion?.id || null,
          promotion_code: finalAppliedPromotion?.code || null,
          promotion_discount: finalPromotionDiscount > 0 ? finalPromotionDiscount : null,
          is_outside_delivery_zone: deliveryZoneInfo ? !deliveryZoneInfo.isInZone : false,
          requires_zone_approval: deliveryZoneInfo ? !deliveryZoneInfo.isInZone : false
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Register promotion usage
      if (finalAppliedPromotion && order) {
        await supabase.rpc('increment_promotion_usage', {
          promotion_id_param: finalAppliedPromotion.id
        });

        await supabase
          .from('promotion_usage')
          .insert({
            promotion_id: finalAppliedPromotion.id,
            customer_id: customerId,
            order_id: order.id,
            discount_applied: finalPromotionDiscount,
            promotion_code: finalAppliedPromotion.code || null
          });
      }

      // Create order items
      const extractProductId = (compositeId: string): string | null => {
        const firstPart = (compositeId?.split('_')[0] ?? compositeId).trim();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(firstPart) ? firstPart : null;
      };

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: extractProductId(item.id),
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
        notes: (item as any).notes ?? null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Erro ao salvar itens do pedido:', itemsError);
        throw new Error('Não foi possível salvar os itens do pedido');
      }

      // Save profile to localStorage
      const profile = {
        name: customerName,
        phone: normalizedPhone,
        email: customerEmail,
        address: customerAddress,
        latitude: latitude,
        longitude: longitude,
      };
      localStorage.setItem(`customer_${storeId}`, JSON.stringify(profile));

      toast.success('Pedido realizado com sucesso!', {
        description: `Número do pedido: ${order.order_number}`,
        duration: 2000
      });

      // NAVEGAÇÃO IMEDIATA - ANTES de qualquer operação que cause re-render
      // Limpar localStorage do carrinho manualmente (evita setState do clearCart)
      localStorage.removeItem(`cart_${storeId}`);

      // Redireciona imediatamente - página vai recarregar
      window.location.href = `/pedido/${order.id}`;
      return; // Interrompe execução - código abaixo não executa
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao realizar pedido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header with Progress */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <h2 className="text-lg font-semibold flex-1 text-center">
              {steps[currentStep].title}
            </h2>
            <div className="w-8" />
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className={cn(
                    "h-1 w-full rounded-full transition-colors",
                    index <= currentStep ? "" : "bg-muted"
                  )}
                  style={{
                    backgroundColor: index <= currentStep ? primaryColor : undefined
                  }}
                />
                <span className={cn(
                  "text-xs transition-colors hidden sm:block",
                  index <= currentStep ? "font-medium" : "text-muted-foreground"
                )}
                style={{ color: index <= currentStep ? primaryColor : undefined }}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {currentStep === 0 && (
            <DeliveryStep
              deliveryType={deliveryType}
              onDeliveryTypeChange={setDeliveryType}
              customerAddress={customerAddress}
              onAddressChange={setCustomerAddress}
              latitude={latitude}
              longitude={longitude}
              onLocationChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              deliveryZoneInfo={deliveryZoneInfo}
              onDeliveryZoneChange={setDeliveryZoneInfo}
              deliveryFee={deliveryFee}
              isScheduled={isScheduled}
              onScheduledChange={setIsScheduled}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              selectedTime={selectedTime}
              onTimeChange={setSelectedTime}
              availableSlots={availableSlots}
              storeId={storeId}
              isServicePaused={isServicePaused}
              scheduledOrdersEnabled={scheduledOrdersEnabled}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          )}

          {currentStep === 1 && (
            <CustomerDataStep
              customerName={customerName}
              onNameChange={setCustomerName}
              customerPhone={customerPhone}
              onPhoneChange={setCustomerPhone}
              customerEmail={customerEmail}
              onEmailChange={setCustomerEmail}
              notes={notes}
              onNotesChange={setNotes}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          )}

          {currentStep === 2 && (
            <PaymentStep
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              onPaymentDetailsChange={setPaymentDetails}
              needsChange={needsChange}
              onNeedsChangeToggle={setNeedsChange}
              changeAmount={changeAmount}
              onChangeAmountChange={setChangeAmount}
              promotionCode={promotionCode}
              onPromotionCodeChange={setPromotionCode}
              onApplyPromotion={handleApplyPromotionCode}
              onRemovePromotion={handleRemovePromotion}
              appliedPromotion={appliedPromotion}
              promotionDiscount={promotionDiscount}
              isApplyingPromotion={isApplyingPromotion}
              subtotal={subtotal}
              deliveryFee={finalDeliveryFee}
              total={total}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          )}

          {currentStep === 3 && (
            <ConfirmationStep
              customerName={customerName}
              customerPhone={customerPhone}
              customerEmail={customerEmail}
              customerAddress={customerAddress}
              deliveryType={deliveryType}
              paymentMethod={paymentMethod}
              needsChange={needsChange}
              changeAmount={changeAmount}
              items={items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
              }))}
              subtotal={subtotal}
              deliveryFee={finalDeliveryFee}
              promotionDiscount={promotionDiscount}
              total={total}
              appliedPromotion={appliedPromotion}
              isScheduled={isScheduled}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onEditStep={setCurrentStep}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          )}
        </div>

        {/* Footer with Action Button */}
        <div className="p-6 border-t bg-background">
          <Button
            type="button"
            className="w-full h-14 text-lg font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
            onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Finalizando...
              </>
            ) : currentStep === steps.length - 1 ? (
              'ENVIAR PEDIDO'
            ) : (
              'CONTINUAR'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
