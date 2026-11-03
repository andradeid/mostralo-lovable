// Produto vendido por quilo no PDV. Funções puras (testadas em weight.test.ts).
// A quantidade dos itens no banco é inteira: o item pesado entra como 1 unidade com
// unit_price = peso × preço do kg (arredondado em centavos) e o peso no nome do item.

export const MIN_WEIGHT_KG = 0.001;
export const MAX_WEIGHT_KG = 50;

export type WeightParse = { ok: true; kg: number } | { ok: false; error: string };

/**
 * Lê o peso digitado em kg: "0,450", "0.450", "1", ",5", "2,5 kg". Até 3 casas (gramas).
 * Vírgula ou ponto valem como separador decimal (um só). Peso 0 ou fora de 0,001–50 kg é inválido.
 */
export function parseWeightKg(input: string | null | undefined): WeightParse {
  const raw = String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s*kg$/, '')
    .trim();
  if (!raw) return { ok: false, error: 'Informe o peso' };
  if (!/^\d*([.,]\d*)?$/.test(raw) || raw === '.' || raw === ',') return { ok: false, error: 'Peso inválido' };
  const [intPart, decPart = ''] = raw.split(/[.,]/);
  if (decPart.length > 3) return { ok: false, error: 'Use no máximo 3 casas (gramas)' };
  const grams = Number(intPart || '0') * 1000 + Number(decPart.padEnd(3, '0') || '0');
  const kg = grams / 1000;
  if (!Number.isFinite(kg) || grams <= 0) return { ok: false, error: 'O peso precisa ser maior que zero' };
  if (kg < MIN_WEIGHT_KG) return { ok: false, error: 'Peso mínimo: 0,001 kg' };
  if (kg > MAX_WEIGHT_KG) return { ok: false, error: `Peso máximo: ${MAX_WEIGHT_KG} kg` };
  return { ok: true, kg };
}

/** Valor do item pesado em reais: round(peso × preço do kg, 2), calculado em gramas × centavos. */
export function weightPrice(kg: number, pricePerKg: number): number {
  const grams = Math.round(kg * 1000);
  const cents = Math.round(pricePerKg * 100);
  if (grams <= 0 || cents <= 0) return 0;
  return Math.round((grams * cents) / 1000) / 100;
}

/** "0,450" (sempre 3 casas, vírgula). */
export function formatKg(kg: number): string {
  return (Math.round(kg * 1000) / 1000).toFixed(3).replace('.', ',');
}

/** Nome gravado no item: "Pão francês (0,450 kg)". */
export function weightedItemName(name: string, kg: number): string {
  return `${name} (${formatKg(kg)} kg)`;
}

/** Tira o "(0,450 kg)" do fim do nome do item (para pesar de novo). */
export function stripWeightSuffix(itemName: string): string {
  return itemName.replace(/\s\(\d+,\d{3} kg\)$/, '');
}

export interface WeighableProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
}

export interface WeightedCartInput {
  product_id: string;
  product_name: string;
  image_url?: string;
  unit_price: number;
  quantity: 1;
  weight_kg: number;
  price_per_kg: number;
}

/** Item do carrinho para o produto pesado (1 unidade com o valor do peso). */
export function buildWeightedItem(product: WeighableProduct, kg: number): WeightedCartInput {
  const pricePerKg = Number(product.price) || 0;
  return {
    product_id: product.id,
    product_name: weightedItemName(product.name, kg),
    image_url: product.image_url || undefined,
    unit_price: weightPrice(kg, pricePerKg),
    quantity: 1,
    weight_kg: Math.round(kg * 1000) / 1000,
    price_per_kg: pricePerKg,
  };
}

/** Campos do PDV gravados com o produto. Vendido por quilo não controla estoque (a quantidade é inteira). */
export function productPdvFields(data: { sold_by_weight?: boolean; pdv_shortcut?: boolean }) {
  const soldByWeight = !!data.sold_by_weight;
  return {
    sold_by_weight: soldByWeight,
    pdv_shortcut: !!data.pdv_shortcut,
    ...(soldByWeight ? { track_stock: false, stock_quantity: null } : {}),
  };
}
