import { useAnyModuleEnabled, useModuleEnabled } from '@/hooks/useModuleEnabled';
import { SHOP_MODULE_KEYS } from '@/lib/shopModules';

/** false só para loja "só agenda" (tem agendamento e nenhum módulo de loja). */
export function useSellsProducts(): boolean {
  const hasShop = useAnyModuleEnabled(...SHOP_MODULE_KEYS);
  const hasBooking = useModuleEnabled('booking');
  return hasShop || !hasBooking;
}
