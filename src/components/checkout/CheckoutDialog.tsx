import { useState, useEffect, useRef, useCallback } from 'react';
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
  findBestPromotion,
  fetchFreshPromotion,
  isPricedInPromotion
} from '@/utils/promotionCalculator';
import { useQueryClient } from '@tanstack/react-query';
import { getStorePromotions } from '@/hooks/useStorePromotions';
import type { Promotion } from '@/types/promotions';
import type { ZoneValidationResult } from '@/utils/deliveryZoneValidation';
import { ChevronLeft, Loader2 } from "lucide-react";
import { normalizePhone } from '@/lib/utils';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { ScheduledOrdersSettings } from '@/utils/scheduledOrdersValidation';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { resilientEdgeFetch } from '@/lib/resilientFetch';
import { buildStoreOrdersUrl } from '@/lib/storeRedirects';

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
  deliveryConfig?: Record<string, unknown> | null;
  businessHoursData?: Record<string, unknown> | null;
}

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
  const navigate = useNavigate();
  const { slug, storeSlug } = useParams<{ slug?: string; storeSlug?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [storePaymentConfig, setStorePaymentConfig] = useState<{
    acceptsCash: boolean;
    acceptsPix: boolean;
    acceptsCard: boolean;
    onlinePaymentEnabled: boolean;
    /** true quando a busca terminou (sucesso ou falha) */
    loaded: boolean;
    /** true apenas quando a busca teve sucesso — libera pré-seleção automática */
    ok: boolean;
  }>({ acceptsCash: false, acceptsPix: false, acceptsCard: false, onlinePaymentEnabled: false, loaded: false, ok: false });
  const [needsChange, setNeedsChange] = useState(false);
  const [changeAmount, setChangeAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
  // Scheduling states
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedSlotAt, setSelectedSlotAt] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ slot_at: string; slot_time: string; available: boolean; remaining: number | null }[]>([]);
  const [calendarDays, setCalendarDays] = useState<Record<string, { is_open: boolean; slots_available: number }>>({});
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [calendarLoading, setCalendarLoading] = useState(false);
  // Força recarregar dias/horários (ex.: após erro de horário no envio)
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [scheduledConfig, setScheduledConfig] = useState<ScheduledOrdersSettings | null>(null);
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [allowedDeliveryTypes, setAllowedDeliveryTypes] = useState<{ does_delivery: boolean; allows_pickup: boolean; allows_table: boolean }>({ does_delivery: true, allows_pickup: true, allows_table: true });
  // Tempos informados pelo lojista em Configurações > Entrega
  const [deliveryTimeText, setDeliveryTimeText] = useState<string | null>(null);
  const [manualPixKey, setManualPixKey] = useState<string | null>(null);
  const [pickupTimeText, setPickupTimeText] = useState<string | null>(null);

  // Promotion states
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  // Cache compartilhado das promoções da loja (evita consultas repetidas)
  const queryClient = useQueryClient();
  const [promotionDiscount, setPromotionDiscount] = useState(0);
  const [promotionTotalSavings, setPromotionTotalSavings] = useState(0);
  const [isApplyingPromotion, setIsApplyingPromotion] = useState(false);
  const [autoPromotionChecked, setAutoPromotionChecked] = useState(false);

  const parseConfigBoolean = (value: unknown, defaultValue = false) => {
    if (value === undefined || value === null) return defaultValue;
    return value === true || value === 'true' || value === 1 || value === '1';
  };

  // Chave Pix da loja (Pix manual), mostrada quando o cliente escolhe Pix
  useEffect(() => {
    if (!open || !storeId) return;
    (supabase as any)
      .from('public_store_config')
      .select('pix_key')
      .eq('store_id', storeId)
      .maybeSingle()
      .then(({ data }: any) => setManualPixKey(data?.pix_key || null));
  }, [open, storeId]);

  const applyStoreOperationalConfig = (
    configData: Record<string, unknown> | null,
    hoursData: Record<string, unknown> | null
  ) => {
    setBusinessHours(hoursData ?? null);

    const config = configData as Record<string, any> | null;
    const showTimes = config ? parseConfigBoolean(config.show_delivery_time, true) : false;
    const textOrNull = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    setDeliveryTimeText(showTimes ? textOrNull(config?.delivery_time) : null);
    setPickupTimeText(showTimes ? textOrNull(config?.pickup_time) : null);
    if (!config) {
      setScheduledConfig(null);
      setAllowedDeliveryTypes({ does_delivery: true, allows_pickup: true, allows_table: true });
      return;
    }

    const nextAllowedDeliveryTypes = {
      does_delivery: parseConfigBoolean(config.does_delivery, true),
      allows_pickup: parseConfigBoolean(config.allows_pickup, true),
      allows_table: parseConfigBoolean(config.allows_table, true),
    };

    setAllowedDeliveryTypes(nextAllowedDeliveryTypes);

    const currentDeliveryType = deliveryType as string;

    if (
      (currentDeliveryType === 'delivery' && !nextAllowedDeliveryTypes.does_delivery) ||
      (currentDeliveryType === 'pickup' && !nextAllowedDeliveryTypes.allows_pickup) ||
      (currentDeliveryType === 'table' && !nextAllowedDeliveryTypes.allows_table)
    ) {
      if (nextAllowedDeliveryTypes.does_delivery) {
        setDeliveryType('delivery');
      } else if (nextAllowedDeliveryTypes.allows_pickup) {
        setDeliveryType('pickup');
      } else if (nextAllowedDeliveryTypes.allows_table) {
        setDeliveryType('table' as DeliveryType);
      }
    }

    const scheduledOrders = config.scheduled_orders as Partial<ScheduledOrdersSettings> | undefined;

    if (!scheduledOrders) {
      setScheduledConfig(null);
      return;
    }

    const normalizedScheduledConfig = {
      ...scheduledOrders,
      enabled: parseConfigBoolean(scheduledOrders.enabled, false),
      hide_asap: parseConfigBoolean(scheduledOrders.hide_asap, false),
    } as ScheduledOrdersSettings;

    setScheduledConfig(normalizedScheduledConfig);

    if (normalizedScheduledConfig.enabled && normalizedScheduledConfig.hide_asap) {
      setIsScheduled(true);
    }
  };

  // Resetar etapa e dados SOMENTE na transição de abertura (false -> true)
  const prevOpenRef = useRef(false);

  // Buscar formas de pagamento aceitas pela loja (sempre, ao abrir)
  useEffect(() => {
    if (!open || !storeId) return;
    let cancelled = false;
    const fetchPaymentConfig = async () => {
      try {
        const [{ data, error }, { data: storeConfig }] = await Promise.all([
          supabase
            .from('public_stores')
            .select('accepts_cash, accepts_card, accepts_pix')
            .eq('id', storeId)
            .single(),
          // online_payment_enabled fica em store_configurations
          (supabase as any)
            .from('store_configurations')
            .select('online_payment_enabled')
            .eq('store_id', storeId)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        if (error || !data) throw error ?? new Error('loja não encontrada');
        setStorePaymentConfig({
          acceptsCash: data.accepts_cash !== false,
          acceptsPix: data.accepts_pix === true,
          acceptsCard: data.accepts_card === true,
          onlinePaymentEnabled: storeConfig?.online_payment_enabled === true,
          loaded: true,
          ok: true,
        });
      } catch (e) {
        if (cancelled) return;
        console.error('[CheckoutDialog] Erro ao buscar formas de pagamento:', e);
        // Falha: mostrar formas padrão, sem pré-selecionar nada
        setStorePaymentConfig({
          acceptsCash: true,
          acceptsPix: true,
          acceptsCard: true,
          onlinePaymentEnabled: false,
          loaded: true,
          ok: false,
        });
      }
    };
    fetchPaymentConfig();
    return () => { cancelled = true; };
  }, [open, storeId]);

  // Atualizações de configuração em segundo plano: só atualizam a config,
  // sem mexer em etapa, endereço, data, horário, nome ou telefone
  useEffect(() => {
    if (open && (deliveryConfig || businessHoursData)) {
      applyStoreOperationalConfig(deliveryConfig, businessHoursData);
    }
  }, [open, deliveryConfig, businessHoursData]);

  // Prefill data and load configurations
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (open && storeId && justOpened) {
      // Carregar dados salvos do localStorage (sem exigir Supabase Auth)
      const savedProfile = localStorage.getItem(`customer_${storeId}`);
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setCustomerName(profile.name || '');
          const formattedPhone = profile.phone ? formatPhone(profile.phone) : '';
          setCustomerPhone(formattedPhone);
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

      if (deliveryConfig || businessHoursData) {
        applyStoreOperationalConfig(deliveryConfig, businessHoursData);
      } else {
        fetchStoreConfig();
      }
      
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
      setPaymentMethod(null);
      setPaymentDetails(null);
      setSelectedDate(undefined);
      setSelectedTime("");
      setSelectedSlotAt(null);
      setNeedsChange(false);
      setChangeAmount("");
    }
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

  // Auto promotions
  useEffect(() => {
    if (open && !autoPromotionChecked && items.length > 0) {
      findAutoPromotions();
    }
  }, [open, items, autoPromotionChecked]);

  // Revalidate promotions when delivery type, items, or delivery zone changes
  useEffect(() => {
    if (!open || items.length === 0) return;

    const currentDeliveryFee = deliveryType === 'delivery' 
      ? (deliveryZoneInfo?.deliveryFee ?? deliveryFee) 
      : 0;

    const revalidatePromotion = async () => {
      if (appliedPromotion) {
        const result = await calculatePromotionDiscount(appliedPromotion, {
          items: promotionOrderItems,
          subtotal: getTotalPrice(),
          deliveryType,
          deliveryFee: currentDeliveryFee,
          storeId
        });

        if (!result.isValid || result.discount <= 0) {
          setAppliedPromotion(null);
          setPromotionDiscount(0);
          setPromotionTotalSavings(0);
          toast.info('Promoção removida (não se aplica mais)');
        } else {
          setPromotionDiscount(result.discount);
          setPromotionTotalSavings(result.totalSavings);
        }
      } else {
        findAutoPromotions(true);
      }
    };

    revalidatePromotion();
  }, [deliveryType, items, open, deliveryZoneInfo]);
  
  // Buscar horários do dia via RPC (fuso e regras calculados no banco)
  useEffect(() => {
    if (!selectedDate || !storeId || !(scheduledConfig?.enabled ?? scheduledOrdersEnabled)) {
      setAvailableSlots([]);
      return;
    }
    const mappedType = deliveryType === 'pickup' ? 'pickup' : 'delivery';
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    let cancelled = false;
    (supabase as any)
      .rpc('get_scheduled_slots', {
        p_store_id: storeId,
        p_date: dateStr,
        p_delivery_type: mappedType,
      })
      .then(({ data, error }: any) => {
        if (cancelled) return;
        if (error) {
          console.error('[CheckoutDialog] get_scheduled_slots:', error);
          setAvailableSlots([]);
          return;
        }
        setAvailableSlots((data ?? []) as any);
      });
    return () => { cancelled = true; };
  }, [selectedDate, deliveryType, storeId, scheduledConfig, scheduledOrdersEnabled, scheduleRefreshKey]);

  // Buscar dias do mês visível via RPC (aberto/fechado/esgotado)
  useEffect(() => {
    if (!storeId || !(scheduledConfig?.enabled ?? scheduledOrdersEnabled)) return;
    const mappedType = deliveryType === 'pickup' ? 'pickup' : 'delivery';
    const from = format(startOfMonth(calendarMonth), 'yyyy-MM-dd');
    const to = format(endOfMonth(calendarMonth), 'yyyy-MM-dd');
    let cancelled = false;
    setCalendarLoading(true);
    (supabase as any)
      .rpc('get_scheduled_days', {
        p_store_id: storeId,
        p_from: from,
        p_to: to,
        p_delivery_type: mappedType,
      })
      .then(({ data, error }: any) => {
        if (cancelled) return;
        setCalendarLoading(false);
        if (error) {
          console.error('[CheckoutDialog] get_scheduled_days:', error);
          setCalendarDays({});
          return;
        }
        const map: Record<string, { is_open: boolean; slots_available: number }> = {};
        (data ?? []).forEach((d: any) => {
          map[d.day] = { is_open: d.is_open, slots_available: d.slots_available };
        });
        setCalendarDays(map);
      });
    return () => { cancelled = true; };
  }, [calendarMonth, deliveryType, storeId, scheduledConfig, scheduledOrdersEnabled, scheduleRefreshKey]);
  
  async function fetchStoreConfig() {
    try {
      const { data: store } = await supabase
        .from('public_stores')
        .select('business_hours, delivery_config')
        .eq('id', storeId)
        .single();
        
      if (store) {
        applyStoreOperationalConfig(
          (store.delivery_config as Record<string, unknown> | null) ?? null,
          (store.business_hours as Record<string, unknown> | null) ?? null
        );
        // Formas de pagamento são buscadas pelo efeito dedicado (com store_configurations)
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
        items: promotionOrderItems,
        subtotal: getTotalPrice(),
        deliveryType,
        deliveryFee: finalDeliveryFee,
        storeId
      });

      if (!result.isValid) {
        toast.error(result.message);
        return;
      }

      // Já existe promoção automática: só troca se o cupom der desconto maior (vale uma promoção por pedido)
      if (appliedPromotion && !appliedPromotion.code && appliedPromotion.id !== promotion.id) {
        const currentSavings = Number(promotionTotalSavings || promotionDiscount || 0);
        const couponSavings = Number(result.totalSavings ?? result.discount ?? 0);
        if (couponSavings <= currentSavings) {
          toast.info('A promoção automática já dá um desconto maior que este cupom. Mantivemos a melhor para você.');
          return;
        }
      }

      setAppliedPromotion(promotion);
      setPromotionDiscount(result.discount);
      setPromotionTotalSavings(result.totalSavings);
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
    setPromotionTotalSavings(0);
    setPromotionCode("");
    toast.info('Promoção removida');
  };

  const findAutoPromotions = async (silent = false) => {
    try {
      const cachedPromotions = await getStorePromotions(queryClient, storeId);
      // Promoções de produto específico que valem para entrega E retirada já
      // estão no preço do item; as de um tipo só (ex.: só retirada) são
      // aplicadas aqui, somente sobre os itens da promoção.
      const orderLevelPromotions = cachedPromotions.filter(p => !isPricedInPromotion(p));
        const applicablePromotions = await findApplicablePromotions(storeId, {
          items: promotionOrderItems,
          subtotal: getTotalPrice(),
          deliveryType,
          deliveryFee: finalDeliveryFee,
          storeId
        }, orderLevelPromotions);

      if (applicablePromotions.length > 0) {
        const bestPromotion = await findBestPromotion(applicablePromotions, {
          items: promotionOrderItems,
          subtotal: getTotalPrice(),
          deliveryType,
          deliveryFee: finalDeliveryFee,
          storeId
        });

        if (bestPromotion) {
          const result = await calculatePromotionDiscount(bestPromotion, {
            items: promotionOrderItems,
            subtotal: getTotalPrice(),
            deliveryType,
            deliveryFee: finalDeliveryFee,
            storeId
          });

          if (result.isValid) {
            setAppliedPromotion(bestPromotion);
            setPromotionDiscount(result.discount);
            setPromotionTotalSavings(result.totalSavings);
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

  const promotionOrderItems = items.map(item => ({
    id: item.id.includes('_') ? item.id.split('_')[0] : item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    category_id: undefined
  }));

  const subtotal = getTotalPrice();
  const finalDeliveryFee = deliveryType === 'delivery' 
    ? (deliveryZoneInfo?.deliveryFee ?? deliveryFee) 
    : 0;
  
  // Check if applied promotion includes free delivery
  const hasFreeDeliveryPromotion = appliedPromotion?.type === 'free_delivery' && deliveryType === 'delivery';
  
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
          if (!selectedDate || !selectedTime || !selectedSlotAt) {
            toast.error('Selecione data e horário para o agendamento');
            return false;
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
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const normalizedPhone = normalizePhone(customerPhone);

      console.log('[CheckoutDialog] Iniciando criação de pedido via Token:', {
        phone: normalizedPhone,
        storeId
      });

      // Usar customer-auth-v2 para resolver/criar cliente via telefone
      const { data: authData, error: authError } = await supabase.functions.invoke('customer-auth-v2', {
        body: {
          action: 'identify-by-phone',
          phone: normalizedPhone,
          store_id: storeId,
          name: customerName,
          email: customerEmail || undefined,
          // address não enviado - endereço de entrega é salvo apenas no pedido (orders.customer_address)
        },
      });

      if (authError || authData?.error) {
        console.error('[CheckoutDialog] Erro ao identificar cliente:', authError || authData?.error);
        toast.error('Erro ao identificar cliente. Tente novamente.');
        isSubmittingRef.current = false;
        setIsLoading(false);
        return;
      }

      const customerId = authData.customer.id;

      // Salvar token e perfil no localStorage
      const profile = {
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
      };
      localStorage.setItem(`customer_${storeId}`, JSON.stringify(profile));

      console.log('[CheckoutDialog] Customer ID final (via token):', customerId);

      // Prepare scheduled_for if scheduled (usar slot_at exatamente como veio da RPC)
      let scheduledFor = null;
      if (isScheduled && selectedSlotAt) {
        scheduledFor = selectedSlotAt;
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
        // Busca fresca imediatamente antes de finalizar: garante que ainda é válida
        const freshPromotion = (await fetchFreshPromotion(appliedPromotion.id)) ?? { ...appliedPromotion, status: 'expired' as const };
        const finalCheck = await calculatePromotionDiscount(freshPromotion, {
          items: promotionOrderItems,
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
      
      // Criar pedido via Edge Function (bypass RLS para guest checkout)
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
        delivery_fee: deliveryType === 'delivery' ? finalDeliveryFee : 0,
        total: subtotal + finalDeliveryFee - finalPromotionDiscount,
        notes: finalNotes || null,
        scheduled_for: scheduledFor,
        promotion_id: finalAppliedPromotion?.id || null,
        promotion_code: finalAppliedPromotion?.code || null,
        promotion_discount: finalPromotionDiscount > 0 ? finalPromotionDiscount : null,
        is_outside_delivery_zone: deliveryZoneInfo ? !deliveryZoneInfo.isInZone : false,
        requires_zone_approval: deliveryZoneInfo ? !deliveryZoneInfo.isInZone : false,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: (item as any).notes ?? null,
        })),
      };
      console.log('[CheckoutDialog] Criando pedido via Edge Function...');
      
      let order: any = null;
      
      // Fetch SEM retry para evitar pedidos duplicados
      const { data: orderResult, error: orderError, timedOut, status } = await resilientEdgeFetch(
        'create-guest-order-v2',
        orderPayload,
        {
          timeoutMs: 30000,
          maxRetries: 1,
        }
      );

      const ordersPageUrl = await buildStoreOrdersUrl({
        storeId,
        candidates: [slug, storeSlug],
      });

      if (!ordersPageUrl) {
        throw new Error('Não foi possível identificar a loja para abrir Meus Pedidos.');
      }

      if (orderError || !orderResult) {
        console.error('[CheckoutDialog] Erro na Edge Function:', orderError, 'timedOut:', timedOut);

        // Erros de validação do banco (P0001): mostrar mensagem pronta e voltar para Entrega se for de horário
        if ((status === 400 || status === 409) && orderError) {
          toast.error(orderError);
          if (status === 409 && /cupom|promo[çc][ãa]o/i.test(orderError)) {
            // Servidor recusou a promoção (ex.: não é o primeiro pedido): tirar e voltar ao Pagamento
            setAppliedPromotion(null);
            setPromotionDiscount(0);
            setPromotionTotalSavings(0);
            setPromotionCode("");
            setCurrentStep(2);
          } else if (status === 400 && /hor[áa]rio|data|agendamento|dispon[íi]vel/i.test(orderError)) {
            // Limpar horário escolhido e recarregar dias/horários do banco
            setSelectedTime("");
            setSelectedSlotAt(null);
            setScheduleRefreshKey((k) => k + 1);
            setCurrentStep(0);
          }
          isSubmittingRef.current = false;
          setIsLoading(false);
          return;
        }

        
        // FALLBACK: Verificar se o pedido foi criado mesmo com erro
        if (normalizedPhone) {
          console.log('[CheckoutDialog] Verificando se pedido foi criado silenciosamente...');
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
            console.log('[CheckoutDialog] Pedido encontrado via fallback:', existingOrder.id);
            toast.success('Pedido realizado com sucesso!', {
              description: `Número do pedido: ${existingOrder.order_number}`,
              duration: 2000
            });
            localStorage.removeItem(`cart_${storeId}`);
            clearCart();
            onOpenChange(false);
            window.location.replace(ordersPageUrl);
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
      
      console.log('[CheckoutDialog] Pedido criado com sucesso:', order.order_id);

      toast.success('Pedido realizado com sucesso!', {
        description: `Número do pedido: ${order.order_number}`,
        duration: 2000
      });

      localStorage.removeItem(`cart_${storeId}`);
      clearCart();
      onOpenChange(false);
      
      // Redirecionar para a página de pedidos
      window.location.replace(ordersPageUrl);
      
      return;
    } catch (error: any) {
      console.error('Error creating order:', error?.message, error?.stack, JSON.stringify(error));
      toast.error(`Erro ao realizar pedido: ${error?.message || 'Tente novamente.'}`);
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  // Verificar se o botão "Continuar" deve estar desabilitado no step atual
  const isNextDisabled = (() => {
    if (currentStep === 0 && deliveryType === 'delivery' && (!customerAddress || !latitude || !longitude)) {
      return true;
    }
    // Agendamento obrigatório ou escolhido: exigir data e horário
    if (currentStep === 0 && isScheduled && (!selectedDate || !selectedTime || !selectedSlotAt)) {
      return true;
    }
    // Pagamento: só continuar depois de escolher a forma
    if (currentStep === 2 && !paymentMethod) {
      return true;
    }
    return false;
  })();

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
              scheduledOrdersEnabled={scheduledConfig?.enabled ?? scheduledOrdersEnabled}
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
