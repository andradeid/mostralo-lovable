import { useAnyModuleEnabled } from '@/hooks/useModuleEnabled';
import { SHOP_MODULE_KEYS } from '@/lib/shopModules';

/** true quando a loja ativa vende produtos (delivery/cardápio); false no plano só de Agenda. */
export function useSellsProducts(): boolean {
  return useAnyModuleEnabled(...SHOP_MODULE_KEYS);
}
