/**
 * Módulos que indicam que a loja vende produtos (cardápio/delivery/pedidos).
 * O plano Agenda (barbearias, salões) não tem nenhum deles: nesse caso o painel
 * esconde Pedidos, Produtos, Categorias, Adicionais e os textos de delivery.
 * ('catalog' fica por compatibilidade; nenhum plano atual usa essa chave.)
 */
export const SHOP_MODULE_KEYS = ['digital_menu', 'delivery', 'order_management', 'catalog'] as const;

export function hasShopModule(hasModule: (key: string) => boolean): boolean {
  return SHOP_MODULE_KEYS.some((key) => hasModule(key));
}
