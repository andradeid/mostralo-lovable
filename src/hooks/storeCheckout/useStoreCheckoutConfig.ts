import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ScheduledOrdersSettings } from '@/utils/scheduledOrdersValidation';

export interface StorePaymentConfig {
  acceptsCash: boolean;
  acceptsPix: boolean;
  acceptsCard: boolean;
  onlinePaymentEnabled: boolean;
  /** true quando a busca terminou (sucesso ou falha) */
  loaded: boolean;
  /** true apenas quando a busca teve sucesso — libera pré-seleção automática */
  ok: boolean;
}

export interface AllowedDeliveryTypes {
  does_delivery: boolean;
  allows_pickup: boolean;
  allows_table: boolean;
}

const ALL_TYPES: AllowedDeliveryTypes = { does_delivery: true, allows_pickup: true, allows_table: true };

export const parseConfigBoolean = (value: unknown, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  return value === true || value === 'true' || value === 1 || value === '1';
};

interface Params {
  open: boolean;
  storeId: string;
  /** Configuração de entrega já carregada pela loja (evita nova consulta) */
  deliveryConfig?: Record<string, unknown> | null;
  businessHoursData?: Record<string, unknown> | null;
}

/**
 * Configuração da loja para o checkout: formas de pagamento, chave Pix manual,
 * tipos de entrega permitidos, tempos informados e agendamento.
 * Lê só as visões públicas (public_stores, public_store_config) e store_configurations.
 */
export function useStoreCheckoutConfig({ open, storeId, deliveryConfig = null, businessHoursData = null }: Params) {
  const [paymentConfig, setPaymentConfig] = useState<StorePaymentConfig>({
    acceptsCash: false, acceptsPix: false, acceptsCard: false, onlinePaymentEnabled: false, loaded: false, ok: false,
  });
  const [manualPixKey, setManualPixKey] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<Record<string, unknown> | null>(null);
  const [allowedDeliveryTypes, setAllowedDeliveryTypes] = useState<AllowedDeliveryTypes>(ALL_TYPES);
  const [scheduledConfig, setScheduledConfig] = useState<ScheduledOrdersSettings | null>(null);
  const [deliveryTimeText, setDeliveryTimeText] = useState<string | null>(null);
  const [pickupTimeText, setPickupTimeText] = useState<string | null>(null);

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

  // Formas de pagamento aceitas (sempre, ao abrir)
  useEffect(() => {
    if (!open || !storeId) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ data, error }, { data: storeConfig }] = await Promise.all([
          supabase.from('public_stores').select('accepts_cash, accepts_card, accepts_pix').eq('id', storeId).single(),
          // online_payment_enabled fica em store_configurations
          (supabase as any).from('store_configurations').select('online_payment_enabled').eq('store_id', storeId).maybeSingle(),
        ]);
        if (cancelled) return;
        if (error || !data) throw error ?? new Error('loja não encontrada');
        setPaymentConfig({
          acceptsCash: data.accepts_cash !== false,
          acceptsPix: data.accepts_pix === true,
          acceptsCard: data.accepts_card === true,
          onlinePaymentEnabled: storeConfig?.online_payment_enabled === true,
          loaded: true,
          ok: true,
        });
      } catch (e) {
        if (cancelled) return;
        console.error('[checkout] Erro ao buscar formas de pagamento:', e);
        // Falha: mostrar formas padrão, sem pré-selecionar nada
        setPaymentConfig({ acceptsCash: true, acceptsPix: true, acceptsCard: true, onlinePaymentEnabled: false, loaded: true, ok: false });
      }
    })();
    return () => { cancelled = true; };
  }, [open, storeId]);

  // Entrega, tempos e agendamento: da loja já carregada ou, sem ela, de public_stores
  useEffect(() => {
    if (!open || !storeId) return;
    const apply = (configData: Record<string, unknown> | null, hoursData: Record<string, unknown> | null) => {
      setBusinessHours(hoursData ?? null);
      const config = configData as Record<string, any> | null;
      const showTimes = config ? parseConfigBoolean(config.show_delivery_time, true) : false;
      const textOrNull = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
      setDeliveryTimeText(showTimes ? textOrNull(config?.delivery_time) : null);
      setPickupTimeText(showTimes ? textOrNull(config?.pickup_time) : null);
      if (!config) {
        setScheduledConfig(null);
        setAllowedDeliveryTypes(ALL_TYPES);
        return;
      }
      setAllowedDeliveryTypes({
        does_delivery: parseConfigBoolean(config.does_delivery, true),
        allows_pickup: parseConfigBoolean(config.allows_pickup, true),
        allows_table: parseConfigBoolean(config.allows_table, true),
      });
      const scheduled = config.scheduled_orders as Partial<ScheduledOrdersSettings> | undefined;
      setScheduledConfig(scheduled ? {
        ...scheduled,
        enabled: parseConfigBoolean(scheduled.enabled, false),
        hide_asap: parseConfigBoolean(scheduled.hide_asap, false),
      } as ScheduledOrdersSettings : null);
    };

    if (deliveryConfig || businessHoursData) {
      apply(deliveryConfig, businessHoursData);
      return;
    }
    let cancelled = false;
    supabase
      .from('public_stores')
      .select('business_hours, delivery_config')
      .eq('id', storeId)
      .single()
      .then(({ data: store }) => {
        if (cancelled || !store) return;
        apply((store.delivery_config as Record<string, unknown> | null) ?? null, (store.business_hours as Record<string, unknown> | null) ?? null);
      }, (error: unknown) => console.error('Erro ao buscar configurações:', error));
    return () => { cancelled = true; };
  }, [open, storeId, deliveryConfig, businessHoursData]);

  return { paymentConfig, manualPixKey, businessHours, allowedDeliveryTypes, scheduledConfig, deliveryTimeText, pickupTimeText };
}
