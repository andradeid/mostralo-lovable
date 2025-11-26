import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { DeliveryStep } from "@/components/checkout/steps/DeliveryStep";
import { CustomerDataStep } from "@/components/checkout/steps/CustomerDataStep";
import { PaymentStep } from "@/components/checkout/steps/PaymentStep";
import { ConfirmationStep } from "@/components/checkout/steps/ConfirmationStep";
import { CheckoutProgressIndicator } from "@/components/checkout/CheckoutProgressIndicator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { formatPhone } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import type { ZoneValidationResult } from "@/utils/deliveryZoneValidation";
import type { Promotion } from "@/types/promotions";

type DeliveryType = Database["public"]["Enums"]["delivery_type"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

const checkoutSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

const CHECKOUT_STEPS = [
  { id: "delivery", number: 1, label: "Entrega" },
  { id: "customer", number: 2, label: "Dados" },
  { id: "payment", number: 3, label: "Pagamento" },
  { id: "confirmation", number: 4, label: "Confirmar" },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, clearCart, getTotalPrice } = useCart();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dados da loja
  const [storeId, setStoreId] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [secondaryColor, setSecondaryColor] = useState("#D946EF");
  const [storeName, setStoreName] = useState("");
  
  // Dados do checkout - Delivery Step
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [customerAddress, setCustomerAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [deliveryZoneInfo, setDeliveryZoneInfo] = useState<ZoneValidationResult | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  
  // Dados do cliente - Customer Data Step
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  
  // Configurações de pagamento da loja
  const [acceptsCash, setAcceptsCash] = useState(true);
  const [acceptsCredit, setAcceptsCredit] = useState(false);
  const [acceptsDebit, setAcceptsDebit] = useState(false);
  const [acceptsPix, setAcceptsPix] = useState(false);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(false);
  
  // Payment Step
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState("");
  
  // Verificar autenticação e fazer prefill dos dados do cliente
  useEffect(() => {
    const checkAuthentication = async () => {
      if (!storeId) return;

      const savedProfile = localStorage.getItem(`customer_${storeId}`);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!savedProfile || !session) {
        sessionStorage.setItem('checkout_redirect', 'true');
        toast.error('Você precisa estar logado para finalizar o pedido');
        navigate(-1);
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openCustomerAuth'));
        }, 300);
        return;
      }
      
      try {
        const profile = JSON.parse(savedProfile);
        setCustomerName(profile.name || '');
        setCustomerPhone(profile.phone ? formatPhone(profile.phone) : '');
        setCustomerEmail(profile.email || '');
        setCustomerAddress(profile.address || '');
        setLatitude(profile.latitude || null);
        setLongitude(profile.longitude || null);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    };
    
    checkAuthentication();
  }, [storeId, navigate]);
  
  // Dados de pagamento - Payment Step
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [isApplyingPromotion, setIsApplyingPromotion] = useState(false);
  
  // Carregar dados do sessionStorage
  useEffect(() => {
    const loadCheckoutData = async () => {
      const checkoutStoreId = sessionStorage.getItem("checkoutStoreId");
      const checkoutDeliveryFee = sessionStorage.getItem("checkoutDeliveryFee");
      const checkoutPrimaryColor = sessionStorage.getItem("checkoutPrimaryColor");
      const checkoutSecondaryColor = sessionStorage.getItem("checkoutSecondaryColor");
      const checkoutStoreName = sessionStorage.getItem("checkoutStoreName");
      
      if (!checkoutStoreId) {
        toast.error("Dados do checkout não encontrados");
        navigate(-1);
        return;
      }
      
      setStoreId(checkoutStoreId);
      setDeliveryFee(parseFloat(checkoutDeliveryFee || "0"));
      setPrimaryColor(checkoutPrimaryColor || "#8B5CF6");
      setSecondaryColor(checkoutSecondaryColor || "#D946EF");
      setStoreName(checkoutStoreName || "");
      
      // Carregar configurações de pagamento da loja
      try {
        const { data: store, error } = await supabase
          .from("stores")
          .select("accepts_cash, accepts_card, accepts_pix, payment_gateways")
          .eq("id", checkoutStoreId)
          .single();
        
        if (error) {
          console.error("Erro ao carregar configurações de pagamento:", error);
          return;
        }
        
        if (store) {
          setAcceptsCash(store.accepts_cash ?? true);
          setAcceptsCredit(store.accepts_card ?? false);
          setAcceptsDebit(store.accepts_card ?? false);
          setAcceptsPix(store.accepts_pix ?? false);
          
          // Verificar se há gateway online configurado
          const gateways = store.payment_gateways as any;
          const hasOnlineGateway = gateways && (
            gateways.mercado_pago?.enabled || 
            gateways.stripe?.enabled ||
            gateways.pagarme?.enabled ||
            gateways.paypal?.enabled
          );
          setOnlinePaymentEnabled(hasOnlineGateway ?? false);
        }
      } catch (error) {
        console.error("Erro ao buscar configurações de pagamento:", error);
      }
    };
    
    loadCheckoutData();
  }, [navigate]);
  
  // Redirecionar se carrinho vazio
  useEffect(() => {
    if (items.length === 0) {
      toast.error("Seu carrinho está vazio");
      navigate(-1);
    }
  }, [items.length, navigate]);
  
  // Gerar slots de horário quando agendamento é selecionado
  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!isScheduled || !selectedDate || !storeId) {
        setAvailableSlots([]);
        return;
      }
      
      try {
        const { data: storeConfig } = await supabase
          .from("stores")
          .select("delivery_config, business_hours")
          .eq("id", storeId)
          .single();
        
        const deliveryConfig = storeConfig?.delivery_config as any;
        if (deliveryConfig?.scheduled_orders) {
          const { generateAvailableSlots } = await import("@/utils/scheduledOrdersValidation");
          const slots = generateAvailableSlots(
            selectedDate,
            deliveryType,
            deliveryConfig.scheduled_orders,
            storeConfig.business_hours as any
          );
          setAvailableSlots(slots);
          console.log('Slots gerados:', slots.length, 'para data selecionada');
        }
      } catch (error) {
        console.error("Erro ao carregar slots:", error);
      }
    };
    
    loadAvailableSlots();
  }, [isScheduled, selectedDate, storeId, deliveryType]);
  
  const validateStep = async () => {
    if (currentStep === 0) {
      if (!deliveryType) {
        toast.error("Selecione um tipo de entrega");
        return false;
      }
      if (deliveryType === "delivery" && !customerAddress) {
        toast.error("Selecione um endereço de entrega");
        return false;
      }
      return true;
    }
    
    if (currentStep === 1) {
      try {
        checkoutSchema.parse({
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        });
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error(error.issues[0].message);
        }
        return false;
      }
    }
    
    if (currentStep === 2) {
      if (!paymentMethod) {
        toast.error("Selecione uma forma de pagamento");
        return false;
      }
      return true;
    }
    
    return true;
  };
  
  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < CHECKOUT_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Garantir usuário autenticado e normalizar telefone
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      const normalizedPhone = (customerPhone || '').replace(/\D/g, '');
      
      // Buscar ou criar cliente vinculado ao usuário atual (RLS exige auth_user_id)
      let customerId: string;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: customerName,
            phone: normalizedPhone,
            email: customerEmail || null,
            address: deliveryType === 'delivery' ? customerAddress : null,
            latitude: latitude,
            longitude: longitude,
            auth_user_id: user.id,
          })
          .select('id')
          .single();
        
        if (customerError) throw customerError;
        customerId = newCustomer!.id;
      }
      
      // Calcular valores
      const subtotal = getTotalPrice();
      const finalDeliveryFee = deliveryType === 'delivery' ? deliveryFee : 0;
      const total = subtotal + finalDeliveryFee;
      
      // Gerar número do pedido sequencial
      const { data: orderNumber, error: orderNumberError } = await supabase
        .rpc('get_next_order_number', { store_uuid: storeId });
      
      if (orderNumberError) {
        console.error('Error generating order number:', orderNumberError);
        throw orderNumberError;
      }
      
      // Montar dados do pedido usando colunas corretas do schema
      const orderData: any = {
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
        delivery_fee: finalDeliveryFee,
        total,
        notes: notes?.trim() || null,
      };
      
      // Agendamento (se houver)
      if (isScheduled && selectedDate && selectedTime) {
        const [hours, minutes] = selectedTime.split(':');
        const scheduled = new Date(selectedDate);
        scheduled.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        orderData.scheduled_for = scheduled.toISOString();
      }
      
      // Promoção (apenas ID se aplicada)
      if (appliedPromotion) {
        orderData.promotion_id = appliedPromotion.id;
      }
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Criar itens do pedido - garantir product_id válido (UUID)
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
        notes: (item as any).notes ?? null,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Registrar uso da promoção (se houver)
      if (appliedPromotion) {
        await supabase.rpc('increment_promotion_usage', {
          promotion_id_param: appliedPromotion.id,
        });
      }
      
      // Limpar carrinho e dados temporários
      clearCart();
      sessionStorage.removeItem('checkoutStoreId');
      sessionStorage.removeItem('checkoutDeliveryFee');
      sessionStorage.removeItem('checkoutPrimaryColor');
      sessionStorage.removeItem('checkoutSecondaryColor');
      sessionStorage.removeItem('checkoutStoreName');
      
      toast.success('Pedido realizado com sucesso!');
      navigate(`/pedido/${order.id}`);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo(0, 0);
  };
  
  const handleApplyPromotion = () => {
    // Implementar lógica de aplicação de promoção
    console.log("Aplicar promoção:", promotionCode);
  };
  
  const handleRemovePromotion = () => {
    setAppliedPromotion(null);
    setPromotionCode("");
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Finalizar Pedido</h1>
            {storeName && (
              <p className="text-xs text-muted-foreground">{storeName}</p>
            )}
          </div>
        </div>
      </header>
      
      {/* Progress Indicator */}
      <div className="container mx-auto px-4 py-6">
        <CheckoutProgressIndicator
          currentStep={currentStep}
          steps={CHECKOUT_STEPS}
          primaryColor={primaryColor}
        />
      </div>
      
      {/* Conteúdo do Passo Atual */}
      <main className="container mx-auto px-4 pb-24">
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
            isServicePaused={false}
            scheduledOrdersEnabled={true}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}
        
        {currentStep === 1 && (
          <CustomerDataStep
            customerName={customerName}
            customerPhone={customerPhone}
            customerEmail={customerEmail}
            notes={notes}
            onNameChange={setCustomerName}
            onPhoneChange={setCustomerPhone}
            onEmailChange={setCustomerEmail}
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
            onApplyPromotion={handleApplyPromotion}
            onRemovePromotion={handleRemovePromotion}
            appliedPromotion={appliedPromotion}
            promotionDiscount={0}
            isApplyingPromotion={isApplyingPromotion}
            subtotal={getTotalPrice()}
            deliveryFee={deliveryFee}
            total={getTotalPrice() + deliveryFee}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            acceptsCash={acceptsCash}
            acceptsCredit={acceptsCredit}
            acceptsDebit={acceptsDebit}
            acceptsPix={acceptsPix}
            onlinePaymentEnabled={onlinePaymentEnabled}
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
            items={items}
            subtotal={getTotalPrice()}
            deliveryFee={deliveryFee}
            promotionDiscount={0}
            total={getTotalPrice() + deliveryFee}
            appliedPromotion={appliedPromotion}
            isScheduled={isScheduled}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onEditStep={handleEditStep}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
          />
        )}
      </main>
      
      {/* Footer com Botões (Sticky) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
        <div className="container mx-auto flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              Voltar
            </Button>
          )}
          <Button
            className="flex-1"
            style={{ backgroundColor: primaryColor }}
            onClick={currentStep === 3 ? handleSubmit : handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : currentStep === 3 ? (
              "ENVIAR PEDIDO"
            ) : (
              "CONTINUAR"
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
