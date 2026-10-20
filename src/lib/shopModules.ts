/**
 * Módulos que indicam que a loja vende produtos (cardápio/delivery/pedidos).
 * O plano Agenda (barbearias, salões) não tem nenhum deles: nesse caso o painel
 * esconde Pedidos, Produtos, Categorias, Adicionais e os textos de delivery.
 * ('catalog' fica por compatibilidade; nenhum plano atual usa essa chave.)
 */
export const SHOP_MODULE_KEYS = ['digital_menu', 'delivery', 'order_management', 'catalog'] as const;

/**
 * Loja "só agenda" = tem o módulo de agendamento e nenhum módulo de loja.
 * Lojas sem agenda continuam vendo tudo (ex.: plano sem módulos cadastrados).
 */
export function isBookingOnly(hasModule: (key: string) => boolean): boolean {
  return hasModule('booking') && !SHOP_MODULE_KEYS.some((key) => hasModule(key));
}

export function hasShopModule(hasModule: (key: string) => boolean): boolean {
  return !isBookingOnly(hasModule);
}
