import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { DeliveryStep } from "@/components/checkout/steps/DeliveryStep";
import { CustomerDataStep } from "@/components/checkout/steps/CustomerDataStep";
import { PaymentStep } from "@/components/checkout/steps/PaymentStep";
import { ConfirmationStep } from "@/components/checkout/steps/ConfirmationStep";
import { CheckoutProgressIndicator } from "@/components/checkout/CheckoutProgressIndicator";
import { PixPaymentModal } from "@/components/checkout/PixPaymentModal";
import { CrossSellSection } from "@/components/crosssell/CrossSellSection";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { formatPhone } from "@/lib/utils";
import { assignCustomerLabels } from "@/utils/customerLabelUtils";
import { generateAvailableSlots, ScheduledOrdersSettings } from '@/utils/scheduledOrdersValidation';
import type { Database } from "@/integrations/supabase/types";
import type { ZoneValidationResult } from "@/utils/deliveryZoneValidation";
import type { Promotion } from "@/types/promotions";
import { resilientEdgeFetch } from "@/lib/resilientFetch";


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
  const { items, clearCart, getTotalPrice, addItem } = useCart();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false); // Guard contra double-submit
  
  // Dados da loja
  const [storeId, setStoreId] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [primaryColor, setPrimaryColor] = useState("#8B5CF6");
  const [secondaryColor, setSecondaryColor] = useState("#D946EF");
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  
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
  const [scheduledOrdersEnabled, setScheduledOrdersEnabled] = useState(false);
  const [hideAsap, setHideAsap] = useState(false);
  const [scheduledConfig, setScheduledConfig] = useState<ScheduledOrdersSettings | null>(null);
  const [businessHours, setBusinessHours] = useState<any>(null);
  
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
  const [efiAccountNumber, setEfiAccountNumber] = useState<string | null>(null);
  
  // Payment Step
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState("");
  
  // PIX Payment Modal
  const [showPixModal, setShowPixModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  
  // Prefill dos dados do cliente (se disponíveis)
  useEffect(() => {
    const loadProfile = () => {
      if (!storeId) return;

      const savedProfile = localStorage.getItem(`customer_${storeId}`);
      
      if (!savedProfile) {
        // Sem perfil salvo — tudo bem, o cliente preencherá no checkout
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
    
    loadProfile();
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
      const checkoutStoreSlug = sessionStorage.getItem("checkoutStoreSlug");
      
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
      setStoreSlug(checkoutStoreSlug || "");
      
      // Carregar configurações de pagamento da loja
      try {
        const { data: store, error } = await supabase
          .from("stores")
          .select("slug, accepts_cash, accepts_card, accepts_pix, payment_gateways, efi_account_status, efi_account_number, efi_pix_enabled")
          .eq("id", checkoutStoreId)
          .single();
        
        // Sempre usar o slug do banco como fonte confiável
        if (store?.slug) {
          setStoreSlug(store.slug);
          sessionStorage.setItem("checkoutStoreSlug", store.slug);
        }
        
        if (error) {
          console.error("Erro ao carregar configurações de pagamento:", error);
          return;
        }
        
        if (store) {
          setAcceptsCash(store.accepts_cash ?? true);
          setAcceptsCredit(store.accepts_card ?? false);
          setAcceptsDebit(store.accepts_card ?? false);
          setAcceptsPix(store.accepts_pix ?? false);
          
          // Verificar se há EFI ativo para pagamento online
          const hasEfiActive = store.efi_account_status === 'active' && !!store.efi_account_number && store.efi_pix_enabled === true;
          if (hasEfiActive) {
            setEfiAccountNumber(store.efi_account_number);
          }
          
          // Verificar se há gateway online configurado (legado)
          const gateways = store.payment_gateways as any;
          const hasOnlineGateway = gateways && (
            gateways.mercado_pago?.enabled || 
            gateways.stripe?.enabled ||
            gateways.pagarme?.enabled ||
            gateways.paypal?.enabled
          );
          
          setOnlinePaymentEnabled(hasEfiActive || (hasOnlineGateway ?? false));
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
    // Guard contra double-submit (ref é síncrono, mais confiável que state)
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    
    try {
      // Normalizar telefone e identificar cliente via Edge Function (guest checkout)
      const normalizedPhone = (customerPhone || '').replace(/\D/g, '');
      
      const { data: authData, error: authError } = await supabase.functions.invoke('customer-auth-v2', {
        body: {
          action: 'identify-by-phone',
          phone: normalizedPhone,
          store_id: storeId,
          name: customerName,
          email: customerEmail || undefined,
          address: deliveryType === 'delivery' ? customerAddress : undefined,
        },
      });

      if (authError || authData?.error) {
        console.error('[Checkout] Erro ao identificar cliente:', authError || authData?.error);
        toast.error('Erro ao identificar cliente. Tente novamente.');
        setIsLoading(false);
        return;
      }

      const customerId = authData.customer.id;

      localStorage.setItem(`customer_${storeId}`, JSON.stringify({
        customer_id: customerId,
        name: authData.customer.name,
        phone: authData.customer.phone,
        email: authData.customer.email,
        address: deliveryType === 'delivery' ? customerAddress : authData.customer.address,
        latitude,
        longitude,
        token: authData.token,
        expires_at: authData.expires_at,
        saved_at: new Date().toISOString(),
      }));
      
      const subtotal = getTotalPrice();
      const finalDeliveryFee = deliveryType === 'delivery' ? deliveryFee : 0;
      const total = subtotal + finalDeliveryFee;

      // Verificar se é PIX online (com EFI ativo)
      const isPixOnline = paymentMethod === 'pix' && onlinePaymentEnabled && efiAccountNumber;

      // Aplicar etiquetas ao cliente
      const labelsToApply = ['E-commerce'];
      if (deliveryType === 'delivery') {
        labelsToApply.push('Delivery');
      }
      assignCustomerLabels(customerId, storeId, labelsToApply).catch(console.error);

      // Agendamento (se houver)
      let scheduledFor: string | null = null;
      if (isScheduled && selectedDate && selectedTime) {
        const [hours, minutes] = selectedTime.split(':');
        const scheduled = new Date(selectedDate);
        scheduled.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        scheduledFor = scheduled.toISOString();
      }

      // Criar pedido via Edge Function (bypass RLS, sem triggers pesados)
      const orderPayload = {
        customer_token: authData.token,
        store_id: storeId,
        customer_id: customerId,
        customer_name: customerName,
        customer_phone: normalizedPhone,
        customer_email: customerEmail || null,
        customer_address: deliveryType === 'delivery' ? customerAddress : null,
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        subtotal,
        delivery_fee: finalDeliveryFee,
        total,
        notes: notes?.trim() || null,
        scheduled_for: scheduledFor,
        promotion_id: appliedPromotion?.id || null,
        promotion_code: appliedPromotion?.code || null,
        promotion_discount: 0,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: (item as any).notes ?? null,
        })),
      };

      let order: any = null;
      
      // Fetch SEM retry para evitar pedidos duplicados
      const { data: orderResult, error: orderError, timedOut } = await resilientEdgeFetch(
        'create-guest-order',
        orderPayload,
        {
          timeoutMs: 30000,
          maxRetries: 1,
        }
      );


      if (orderError || !orderResult) {
        console.error('[Checkout] Erro na Edge Function:', orderError, 'timedOut:', timedOut);
        
        // FALLBACK: Verificar se o pedido foi criado mesmo com erro (últimos 10s)
        if (normalizedPhone) {
          console.log('[Checkout] Verificando se pedido foi criado silenciosamente...');
          const fiveSecondsAgo = new Date(Date.now() - 10000).toISOString();
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('id, order_number')
            .eq('store_id', storeId)
            .eq('customer_phone', normalizedPhone)
            .gte('created_at', fiveSecondsAgo)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (existingOrder) {
            console.log('[Checkout] Pedido encontrado via fallback:', existingOrder.id);
            toast.success('Pedido realizado com sucesso!');
            clearCart();
            sessionStorage.removeItem('checkoutStoreId');
            window.location.replace(`/pedido/${existingOrder.id}`);
            return;
          }
        }
        
        throw new Error(
          timedOut
            ? 'Servidor indisponível no momento. Por favor, aguarde alguns segundos e tente novamente.'
            : (orderError || 'Erro ao criar pedido')
        );
      }
      
      order = orderResult;

      // Se for PIX online, abrir modal de pagamento
      if (isPixOnline) {
        setPendingOrderId(order.order_id);
        setShowPixModal(true);
        setIsLoading(false);
        return;
      }
      
      // Limpar carrinho e dados temporários
      clearCart();
      sessionStorage.removeItem('checkoutStoreId');
      sessionStorage.removeItem('checkoutDeliveryFee');
      sessionStorage.removeItem('checkoutPrimaryColor');
      sessionStorage.removeItem('checkoutSecondaryColor');
      sessionStorage.removeItem('checkoutStoreName');
      sessionStorage.removeItem('checkoutStoreSlug');
      
      toast.success('Pedido realizado com sucesso!');

      window.location.replace(`/pedido/${order.order_id}`);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido. Tente novamente.');
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };
  
  // Handler quando pagamento PIX é confirmado (Edge Function já atualizou o pedido)
  const handlePixPaymentConfirmed = async () => {

    // Limpar dados (Edge Function já atualizou status do pedido via service_role)
    clearCart();
    sessionStorage.removeItem('checkoutStoreId');
    sessionStorage.removeItem('checkoutDeliveryFee');
    sessionStorage.removeItem('checkoutPrimaryColor');
    sessionStorage.removeItem('checkoutSecondaryColor');
    sessionStorage.removeItem('checkoutStoreName');
    sessionStorage.removeItem('checkoutStoreSlug');
    
    setShowPixModal(false);
    toast.success('Pagamento confirmado! Pedido enviado.');

    if (pendingOrderId) {
      window.location.replace(`/pedido/${pendingOrderId}`);
      return;
    }

    window.location.replace('/');
  };
  
  // Handler quando PIX expira
  const handlePixPaymentExpired = async () => {
    // Cancelar o pedido pendente
    if (pendingOrderId) {
      await supabase
        .from('orders')
        .update({ 
          status: 'cancelado',
          cancellation_reason: 'Tempo de pagamento PIX expirado'
        })
        .eq('id', pendingOrderId);
    }
    toast.error('Tempo de pagamento expirado. Gere um novo QR Code.');
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
            storeId={storeId}
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
            deliveryFee={deliveryType === 'delivery' ? deliveryFee : 0}
            total={getTotalPrice() + (deliveryType === 'delivery' ? deliveryFee : 0)}
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
          <>
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
              deliveryFee={deliveryType === 'delivery' ? deliveryFee : 0}
              promotionDiscount={0}
              total={getTotalPrice() + (deliveryType === 'delivery' ? deliveryFee : 0)}
              appliedPromotion={appliedPromotion}
              isScheduled={isScheduled}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onEditStep={handleEditStep}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
            
            {/* Cross-sell Section */}
            {storeId && items.length > 0 && (
              <div className="mt-6">
                <CrossSellSection
                  storeId={storeId}
                  cartItems={items.map(item => ({ 
                    category_id: null,
                    product_id: item.id.split('_')[0]
                  }))}
                  onAddProduct={(product) => {
                    addItem({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image_url: product.image_url
                    }, 1);
                  }}
                  themeColor={primaryColor}
                  title="Adicione algo mais ao seu pedido"
                />
              </div>
            )}
          </>
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
      
      {/* Modal de Pagamento PIX */}
      <PixPaymentModal
        open={showPixModal}
        onOpenChange={setShowPixModal}
        storeId={storeId}
        orderId={pendingOrderId}
        amount={getTotalPrice() + (deliveryType === 'delivery' ? deliveryFee : 0)}
        description={`Pedido ${storeName}`}
        onPaymentConfirmed={handlePixPaymentConfirmed}
        onPaymentExpired={handlePixPaymentExpired}
        primaryColor={primaryColor}
      />
    </div>
  );
}
