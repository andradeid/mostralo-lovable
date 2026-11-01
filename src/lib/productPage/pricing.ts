// Regras puras da página do produto: preço (variação, oferta, promoção, pizza de vários sabores),
// adicionais (limite por categoria, obrigatórios, total), nome e id do item no carrinho e a
// mensagem do pedido pelo WhatsApp. Sem React, para poder testar com node:test.
import { withFlavorsInId } from '../../../supabase/functions/_shared/pizza-flavors';
import type { AddonCategory, PizzaFlavorsPricing, Product, ProductVariant, SelectedAddons } from './types';

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
};

export const calculateAddonsPrice = (addonCategories: AddonCategory[], selectedAddons: SelectedAddons) => {
  return addonCategories.reduce((total, category) => {
    const selections = selectedAddons[category.id] || {};
    return total + Object.entries(selections).reduce((categoryTotal, [addonId, quantity]) => {
      const addon = category.addons.find(a => a.id === addonId);
      return categoryTotal + (addon?.price || 0) * quantity;
    }, 0);
  }, 0);
};

export const validateRequiredAddons = (addonCategories: AddonCategory[], selectedAddons: SelectedAddons) => {
  return addonCategories.every(category => {
    if (!category.is_required) return true;
    const selections = selectedAddons[category.id] || {};
    const totalSelected = Object.values(selections).reduce((sum, qty) => sum + qty, 0);
    const minSelections = category.min_selections || 0;
    return totalSelected >= minSelections;
  });
};

/**
 * Nova seleção de uma categoria ao somar/tirar um adicional.
 * `limitExceeded` = passaria do máximo da categoria (nada muda; `selections` vem null).
 */
export function nextAddonSelections(
  category: AddonCategory,
  currentSelections: Record<string, number>,
  addonId: string,
  delta: number,
): { selections: Record<string, number> | null; limitExceeded: number | null } {
  const currentQuantity = currentSelections[addonId] || 0;
  const newQuantity = Math.max(0, currentQuantity + delta);

  // Se a nova quantidade é 0, remove o addon
  if (newQuantity === 0) {
    const newSelections = { ...currentSelections };
    delete newSelections[addonId];
    return { selections: newSelections, limitExceeded: null };
  }

  // Verifica limites da categoria
  const maxSelections = category.max_selections;
  const totalItemsSelected = Object.values(currentSelections).reduce((sum, qty) => sum + qty, 0);

  // Se há limite máximo e seria ultrapassado
  if (maxSelections !== null && maxSelections !== undefined) {
    const totalAfterChange = totalItemsSelected - currentQuantity + newQuantity;
    if (totalAfterChange > maxSelections) {
      return { selections: null, limitExceeded: maxSelections };
    }
  }

  return {
    selections: {
      ...currentSelections,
      [addonId]: newQuantity
    },
    limitExceeded: null
  };
}

/** Preço unitário que vai para o carrinho (sem adicionais). */
export function cartUnitPrice(
  pf: PizzaFlavorsPricing,
  promotionFinalPrice: number | null | undefined,
  selectedVariant: ProductVariant | null,
  product: Product,
) {
  // Usar o preço com promoção aplicada, se houver (pizza de vários sabores: preço pelos sabores)
  return pf.active && pf.price !== null ? pf.price : (promotionFinalPrice || (selectedVariant
    ? selectedVariant.price
    : (product.is_on_offer && product.offer_price ? product.offer_price : product.price)));
}

/** Nome do item no carrinho: sabores, variação e os adicionais por grupo. */
export function cartItemName(
  pf: PizzaFlavorsPricing,
  product: Product,
  selectedVariant: ProductVariant | null,
  addonCategories: AddonCategory[],
  selectedAddons: SelectedAddons,
) {
  const variantName = selectedVariant ? ` - ${selectedVariant.name}` : '';

  // Keep group names in the persisted item name so every order view uses them.
  const addonNames = addonCategories.reduce((names, category) => {
    const selections = selectedAddons[category.id] || {};
    const selectedAddonNames = Object.entries(selections).map(([addonId, quantity]) => {
      const addon = category.addons.find(a => a.id === addonId);
      return addon && quantity > 0 ? `${quantity > 1 ? `${quantity}x ` : ''}${addon.name}` : null;
    }).filter(Boolean);
    return selectedAddonNames.length ? [...names, `${category.name}: ${selectedAddonNames.join(', ')}`] : names;
  }, [] as string[]);

  const baseName = pf.active ? pf.label : product.name;
  return baseName + variantName + (addonNames.length > 0 ? ` — ${addonNames.join(' · ')}` : '');
}

/** Id do item no carrinho: produto, variação, adicionais e os outros sabores da pizza. */
export function cartItemId(
  product: Product,
  selectedVariant: ProductVariant | null,
  selectedAddons: SelectedAddons,
  otherFlavorIds: string[],
) {
  return withFlavorsInId(`${product.id}_${selectedVariant?.id || 'default'}_${JSON.stringify(selectedAddons)}`, otherFlavorIds);
}

/** Preços mostrados na tela: unitário (com sabores/promoção) e com adicionais. */
export function displayPrices(
  pf: PizzaFlavorsPricing,
  promotionFinalPrice: number | null | undefined,
  selectedVariant: ProductVariant | null,
  product: Product,
  addonsPrice: number,
) {
  const singleFlavorPrice = promotionFinalPrice || (selectedVariant
    ? selectedVariant.price
    : (product.is_on_offer && product.offer_price ? product.offer_price : product.price));
  const currentFinalPrice = pf.active ? (pf.price ?? pf.mainPrice ?? singleFlavorPrice) : singleFlavorPrice;
  const totalPrice = currentFinalPrice + addonsPrice;
  return { singleFlavorPrice, currentFinalPrice, totalPrice };
}

/** Texto do pedido pelo WhatsApp. */
export function whatsAppOrderMessage(
  pf: PizzaFlavorsPricing,
  product: Product,
  selectedVariant: ProductVariant | null,
  addonCategories: AddonCategory[],
  selectedAddons: SelectedAddons,
  quantity: number,
  observations: string,
) {
  const currentPrice = pf.active && pf.price !== null ? pf.price : (selectedVariant
    ? selectedVariant.price
    : (product.is_on_offer && product.offer_price ? product.offer_price : product.price));
  const addonsPrice = calculateAddonsPrice(addonCategories, selectedAddons);
  const totalPrice = (currentPrice + addonsPrice) * quantity;

  const variantText = selectedVariant ? ` - ${selectedVariant.name}` : '';

  // Build addons text with quantities
  const addonsText = addonCategories.reduce((text, category) => {
    const selections = selectedAddons[category.id] || {};
    if (Object.keys(selections).length === 0) return text;

    const selectedAddonNames = Object.entries(selections).map(([addonId, quantity]) => {
      const addon = category.addons.find(a => a.id === addonId);
      return addon ? `${quantity}x ${addon.name} (+${formatPrice(addon.price * quantity)})` : '';
    }).filter(Boolean);

    return text + `\n${category.name}: ${selectedAddonNames.join(', ')}`;
  }, '');

  const obsText = observations ? `\nObservações: ${observations}` : '';

  const message = `Olá! Gostaria de fazer um pedido:

*${pf.active && pf.label ? pf.label : product.name}*${variantText}${addonsText}
Quantidade: ${quantity}
Preço: ${formatPrice(totalPrice)}${obsText}

Poderia me ajudar?`;
  return message;
}
