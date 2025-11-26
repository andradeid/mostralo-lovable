import { useMemo } from 'react';
import { isStoreOpen, getNextOpeningTime, formatNextOpeningMessage } from '@/utils/storeStatus';

interface StoreStatusResult {
  isPaused: boolean;
  isClosed: boolean;
  isOpenForBusiness: boolean;
  scheduledOrdersEnabled: boolean;
  canAddToCart: boolean;
  shouldShowSchedulingRequired: boolean;
  showSchedulingInfo: boolean;
  nextOpeningMessage: string;
  nextOpeningInfo: ReturnType<typeof getNextOpeningTime>;
}

export function useStoreStatus(
  businessHours: any,
  deliveryConfig: any
): StoreStatusResult {
  return useMemo(() => {
    // 1. Verificar se está pausado manualmente
    const isPaused = businessHours?.service_paused === true || 
                     businessHours?.service_paused === 'true';
    
    // 2. Verificar se está fechado pelo horário
    const isClosed = !isStoreOpen(businessHours);
    
    // 3. Verificar se agendamentos estão habilitados (aceitar true, 'true', 1, '1')
    const enabledValue = deliveryConfig?.scheduled_orders?.enabled;
    const scheduledOrdersEnabled = 
      enabledValue === true || 
      enabledValue === 'true' || 
      enabledValue === 1 || 
      enabledValue === '1';
    
    // 4. Pode adicionar ao carrinho SE:
    // - NÃO pausado E NÃO fechado (normal) OU
    // - (Pausado OU Fechado) MAS agendamento habilitado
    const canAddToCart = (!isPaused && !isClosed) || scheduledOrdersEnabled;
    
    // 5. Deve mostrar aviso de agendamento obrigatório SE:
    // - (Pausado OU Fechado) E agendamento habilitado
    const shouldShowSchedulingRequired = (isPaused || isClosed) && scheduledOrdersEnabled;
    
    // 6. Mostrar info de agendamento SEMPRE que estiver habilitado
    const showSchedulingInfo = scheduledOrdersEnabled;
    
    // 7. Status geral para exibição
    const isOpenForBusiness = !isPaused && !isClosed;
    
    // 8. Calcular próxima abertura
    const nextOpeningInfo = (isClosed && !isPaused) 
      ? getNextOpeningTime(businessHours) 
      : null;
    
    const nextOpeningMessage = nextOpeningInfo 
      ? formatNextOpeningMessage(nextOpeningInfo) 
      : '';
    
    return {
      isPaused,
      isClosed,
      isOpenForBusiness,
      scheduledOrdersEnabled,
      canAddToCart,
      shouldShowSchedulingRequired,
      showSchedulingInfo,
      nextOpeningMessage,
      nextOpeningInfo
    };
  }, [businessHours, deliveryConfig]);
}
