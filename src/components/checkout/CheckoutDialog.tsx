import { useState, useEffect, useRef, useCallback } from 'react';
import { formatCustomerPhone } from '@/lib/storeCheckout/phoneFormat';
import { useParams } from 'react-router-dom';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import type { ZoneValidationResult } from '@/utils/deliveryZoneValidation';
import { Loader2 } from "lucide-react";
import { normalizePhone } from '@/lib/utils';
import { z } from 'zod';
import { buildStoreOrdersUrl } from '@/lib/storeRedirects';
import { useStoreCheckoutConfig } from '@/hooks/storeCheckout/useStoreCheckoutConfig';
import { useCheckoutScheduling } from '@/hooks/storeCheckout/useCheckoutScheduling';
import { useCheckoutPromotion } from '@/hooks/storeCheckout/useCheckoutPromotion';
import {
  createGuestOrder,
  identifyCustomerByPhone,
  isPromotionRejection,
  isScheduleRejection,
  saveCustomerProfile,
} from '@/lib/storeCheckout/guestOrder';
import { CheckoutDialogHeader, type CheckoutDialogStep } from './CheckoutDialogHeader';

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

const STEPS: CheckoutDialogStep[] = [
  { id: 'delivery', title: 'Entrega', label: 'Entrega' },
  { id: 'customer', title: 'Seus Dados', label: 'Dados' },
  { id: 'payment', title: 'Pagamento', label: 'Pagamento' },
  { id: 'confirmation', title: 'Confirmação', label: 'Confirmar' },
];

const formatPhone = formatCustomerPhone;

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  deliveryFee: number;
  isServicePaused?: boolean;
  scheduledOrdersEnabled?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  deliveryConfig?: Record<string, unknown> | null;
  businessHoursData?: Record<string, unknown> | null;
}

/**
 * Checkout da loja em 4 etapas (entrega, dados, pagamento, confirmação).
 * Peças: useStoreCheckoutConfig (formas de pagamento, entrega e agendamento da loja),
 * useCheckoutScheduling (dias e horários), useCheckoutPromotion (promoção do pedido)
 * e lib/storeCheckout/guestOrder (identificar cliente e gravar na create-guest-order-v3).
 */
export const CheckoutDialog = ({
  open,
  onOpenChange,
  storeId,
  deliveryFee,
  isServicePaused = false,
  scheduledOrdersEnabled = false,
  primaryColor = '#FF9500',
  secondaryColor,
  deliveryConfig = null,
  businessHoursData = null
}: CheckoutDialogProps) => {
  const { items, getTotalPrice, clearCart } = useCart();
  const { slug, storeSlug } = useParams<{ slug?: string; storeSlug?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Dados do cliente
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  // Entrega
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [deliveryZoneInfo, setDeliveryZoneInfo] = useState<ZoneValidationResult | null>(null);

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // Agendamento
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedSlotAt, setSelectedSlotAt] = useState<string | null>(null);
  // Força recarregar dias/horários (ex.: após erro de horário no envio)
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);

  const {
    paymentConfig: storePaymentConfig,
    manualPixKey,
    allowedDeliveryTypes,
    scheduledConfig,
    deliveryTimeText,
    pickupTimeText,
  } = useStoreCheckoutConfig({ open, storeId, deliveryConfig, businessHoursData });

  const schedulingEnabled = scheduledConfig?.enabled ?? scheduledOrdersEnabled;
  const { availableSlots, calendarDays, calendarMonth, setCalendarMonth, calendarLoading } = useCheckoutScheduling({
    storeId,
    enabled: schedulingEnabled,
    deliveryType,
    selectedDate,
    refreshKey: scheduleRefreshKey,
  });

  const subtotal = getTotalPrice();
  const finalDeliveryFee = deliveryType === 'delivery'
    ? (deliveryZoneInfo?.deliveryFee ?? deliveryFee)
    : 0;

  const promo = useCheckoutPromotion({
    open,
    storeId,
    items,
    subtotal,
    deliveryType,
    deliveryFee: finalDeliveryFee,
    zoneKey: deliveryZoneInfo,
  });
  const { appliedPromotion, promotionDiscount, promotionTotalSavings } = promo;

  // Tipo de entrega que a loja não oferece: troca para o primeiro permitido
  useEffect(() => {
    if (!open) return;
    const t = deliveryType as string;
    if (
      (t === 'delivery' && !allowedDeliveryTypes.does_delivery) ||
      (t === 'pickup' && !allowedDeliveryTypes.allows_pickup) ||
      (t === 'table' && !allowedDeliveryTypes.allows_table)
    ) {
      if (allowedDeliveryTypes.does_delivery) setDeliveryType('delivery');
      else if (allowedDeliveryTypes.allows_pickup) setDeliveryType('pickup');
      else if (allowedDeliveryTypes.allows_table) setDeliveryType('table' as DeliveryType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, allowedDeliveryTypes]);

  // Loja só com agendamento ("esconder o quanto antes"): agendar é obrigatório
  useEffect(() => {
    if (open && scheduledConfig?.enabled && scheduledConfig.hide_asap) setIsScheduled(true);
  }, [open, scheduledConfig]);

  // Resetar etapa e dados SOMENTE na transição de abertura (false -> true)
  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (!(open && storeId && justOpened)) return;

    // Dados salvos no aparelho (sem exigir Supabase Auth)
    const savedProfile = localStorage.getItem(`customer_${storeId}`);
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setCustomerName(profile.name || '');
        setCustomerPhone(profile.phone ? formatPhone(profile.phone) : '');
        setCustomerEmail(profile.email || '');
        setCustomerAddress(profile.address || '');
        setLatitude(profile.latitude || null);
        setLongitude(profile.longitude || null);
        // Manter a observação digitada ao fechar e reabrir o checkout
        if (profile.notes) setNotes(profile.notes);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    }

    if (isServicePaused && scheduledOrdersEnabled) setIsScheduled(true);

    // Cupom guardado (ex.: veio de um link com cupom)
    const pendingCode = localStorage.getItem(`pending_promo_${storeId}`);
    if (pendingCode) {
      promo.setPromotionCode(pendingCode);
      localStorage.removeItem(`pending_promo_${storeId}`);
      setTimeout(() => { promo.applyPromotionCode(pendingCode); }, 500);
    }

    setCurrentStep(0);
    setPaymentMethod(null);
    setPaymentDetails(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedSlotAt(null);
    setNeedsChange(false);
    setChangeAmount("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, storeId, isServicePaused, scheduledOrdersEnabled]);

  // Persistir a observação no perfil local (sobrevive a fechar/reabrir o checkout)
  useEffect(() => {
    if (!open || !storeId) return;
    try {
      const raw = localStorage.getItem(`customer_${storeId}`);
      const profile = raw ? JSON.parse(raw) : {};
      profile.notes = notes;
      localStorage.setItem(`customer_${storeId}`, JSON.stringify(profile));
    } catch { /* armazenamento indisponível — manter apenas em memória */ }
  }, [notes, open, storeId]);

  // Trocar entrega/retirada limpa o agendamento escolhido
  const handleDeliveryTypeChange = useCallback((type: DeliveryType) => {
    setDeliveryType(type);
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedSlotAt(null);
  }, []);

  const hasFreeDeliveryPromotion = appliedPromotion?.type === 'free_delivery' && deliveryType === 'delivery';
  const total = subtotal + finalDeliveryFee - promotionDiscount;

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Entrega
        if (deliveryType === 'delivery' && !customerAddress.trim()) {
          toast.error('Informe o endereço de entrega');
          return false;
        }
        if (deliveryType === 'delivery' && (!latitude || !longitude)) {
          toast.error('Selecione sua localização no mapa');
          return false;
        }
        if (isScheduled && (!selectedDate || !selectedTime || !selectedSlotAt)) {
          toast.error('Selecione data e horário para o agendamento');
          return false;
        }
        if (isServicePaused && scheduledOrdersEnabled && !isScheduled) {
          toast.error('O serviço está pausado. Por favor, agende seu pedido.');
          return false;
        }
        return true;

      case 1: { // Dados do cliente
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
      }

      case 2: // Pagamento
        if (!paymentMethod) {
          toast.error('Selecione a forma de pagamento');
          return false;
        }
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

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const finishWithSuccess = (orderNumber: string, ordersPageUrl: string) => {
    toast.success('Pedido realizado com sucesso!', { description: `Número do pedido: ${orderNumber}`, duration: 2000 });
    localStorage.removeItem(`cart_${storeId}`);
    clearCart();
    onOpenChange(false);
    window.location.replace(ordersPageUrl);
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    const release = () => {
      isSubmittingRef.current = false;
      setIsLoading(false);
    };

    try {
      const normalizedPhone = normalizePhone(customerPhone);

      // Resolver/criar cliente pelo telefone (endereço de entrega vai só no pedido)
      const customer = await identifyCustomerByPhone({
        storeId,
        phone: normalizedPhone,
        name: customerName,
        email: customerEmail || undefined,
      });
      if (!customer) {
        toast.error('Erro ao identificar cliente. Tente novamente.');
        release();
        return;
      }
      saveCustomerProfile(storeId, customer, {
        address: deliveryType === 'delivery' ? customerAddress : customer.address,
        latitude,
        longitude,
      });

      let finalNotes = notes.trim();
      if (paymentMethod === 'cash') {
        const trocoInfo = needsChange && changeAmount
          ? `\n💰 TROCO PARA: R$ ${changeAmount}`
          : '\n✅ VALOR EXATO (não precisa troco)';
        finalNotes = (finalNotes + trocoInfo).trim();
      }

      // Promoção conferida de novo logo antes de enviar
      const finalPromo = await promo.finalizePromotion();

      const result = await createGuestOrder({
        customer_token: customer.token,
        store_id: storeId,
        customer_id: customer.customerId,
        customer_name: customerName,
        customer_phone: normalizedPhone,
        customer_email: customerEmail || null,
        customer_address: deliveryType === 'delivery' ? customerAddress : null,
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        subtotal,
        delivery_fee: deliveryType === 'delivery' ? finalDeliveryFee : 0,
        total: subtotal + finalDeliveryFee - finalPromo.discount,
        notes: finalNotes || null,
        // slot_at exatamente como veio da RPC
        scheduled_for: isScheduled && selectedSlotAt ? selectedSlotAt : null,
        promotion_id: finalPromo.promotion?.id || null,
        promotion_code: finalPromo.promotion?.code || null,
        promotion_discount: finalPromo.discount > 0 ? finalPromo.discount : null,
        is_outside_delivery_zone: deliveryZoneInfo ? !deliveryZoneInfo.isInZone : false,
        requires_zone_approval: deliveryZoneInfo ? !deliveryZoneInfo.isInZone : false,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes ?? null,
        })),
      });

      if (result.kind === 'rejected') {
        toast.error(result.message);
        if (isPromotionRejection(result)) {
          // Servidor recusou a promoção (ex.: não é o primeiro pedido): tirar e voltar ao Pagamento
          promo.dropPromotion();
          setCurrentStep(2);
        } else if (isScheduleRejection(result)) {
          // Limpar horário escolhido e recarregar dias/horários do banco
          setSelectedTime("");
          setSelectedSlotAt(null);
          setScheduleRefreshKey((k) => k + 1);
          setCurrentStep(0);
        }
        release();
        return;
      }
      if (result.kind === 'failed') throw new Error(result.message);

      const ordersPageUrl = await buildStoreOrdersUrl({ storeId, candidates: [slug, storeSlug] });
      if (!ordersPageUrl) throw new Error('Não foi possível identificar a loja para abrir Meus Pedidos.');
      finishWithSuccess(result.order.order_number, ordersPageUrl);
    } catch (error: any) {
      console.error('Error creating order:', error?.message, error?.stack);
      toast.error(`Erro ao realizar pedido: ${error?.message || 'Tente novamente.'}`);
      release();
    }
  };

  // Botão "Continuar" desabilitado enquanto falta algo obrigatório na etapa
  const isNextDisabled =
    (currentStep === 0 && deliveryType === 'delivery' && (!customerAddress || !latitude || !longitude)) ||
    (currentStep === 0 && isScheduled && (!selectedDate || !selectedTime || !selectedSlotAt)) ||
    (currentStep === 2 && !paymentMethod);

  const promotionCode = promo.promotionCode;
  const setPromotionCode = promo.setPromotionCode;
  const handleApplyPromotionCode = () => promo.applyPromotionCode();
  const handleRemovePromotion = promo.removePromotion;
  const isApplyingPromotion = promo.isApplyingPromotion;
  const steps = STEPS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col p-0">
        <CheckoutDialogHeader steps={STEPS} currentStep={currentStep} primaryColor={primaryColor} onBack={handleBack} />

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {currentStep === 0 && (
            <DeliveryStep
              deliveryTimeText={deliveryTimeText}
              pickupTimeText={pickupTimeText}
              deliveryType={deliveryType}
              onDeliveryTypeChange={handleDeliveryTypeChange}
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
              onDateChange={(date) => {
                setSelectedDate(date);
                setSelectedTime("");
                setSelectedSlotAt(null);
              }}
              selectedTime={selectedTime}
              onTimeChange={(time, slotAt) => {
                setSelectedTime(time);
                setSelectedSlotAt(slotAt ?? null);
              }}
              availableSlots={availableSlots}
              calendarDays={calendarDays}
              calendarMonth={calendarMonth}
              calendarLoading={calendarLoading}
              onCalendarMonthChange={setCalendarMonth}
              storeId={storeId}
              isServicePaused={isServicePaused}
              scheduledOrdersEnabled={schedulingEnabled}
              hideAsap={scheduledConfig?.hide_asap === true}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              hasFreeDeliveryPromotion={hasFreeDeliveryPromotion}
              allowedDeliveryTypes={allowedDeliveryTypes}
              scheduledConfig={scheduledConfig}
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
              storeId={storeId}
              onCustomerIdentified={(customer) => {
                if (customer.address) setCustomerAddress(customer.address);
                if (customer.latitude) setLatitude(customer.latitude);
                if (customer.longitude) setLongitude(customer.longitude);
              }}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          )}

          {currentStep === 2 && (
            <PaymentStep
              manualPixKey={manualPixKey}
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
              promotionTotalSavings={promotionTotalSavings}
              isApplyingPromotion={isApplyingPromotion}
              subtotal={subtotal}
              deliveryFee={finalDeliveryFee}
              hasFreeDeliveryPromotion={hasFreeDeliveryPromotion}
              total={total}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              acceptsCash={storePaymentConfig.loaded ? storePaymentConfig.acceptsCash : true}
              acceptsPix={storePaymentConfig.loaded ? storePaymentConfig.acceptsPix : true}
              acceptsCredit={storePaymentConfig.loaded ? storePaymentConfig.acceptsCard : true}
              acceptsDebit={storePaymentConfig.loaded ? storePaymentConfig.acceptsCard : true}
              onlinePaymentEnabled={storePaymentConfig.onlinePaymentEnabled}
              paymentDetails={paymentDetails}
              allowAutoSelect={storePaymentConfig.ok}
              deliveryType={deliveryType}
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
              paymentDetails={paymentDetails}
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
              promotionTotalSavings={promotionTotalSavings}
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
            style={{ 
              backgroundColor: isNextDisabled ? '#9ca3af' : primaryColor,
              opacity: isNextDisabled ? 0.6 : 1 
            }}
            onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
            disabled={isLoading || isNextDisabled}
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
