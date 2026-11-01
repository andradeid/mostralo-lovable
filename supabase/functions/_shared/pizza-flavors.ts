// Pizza com mais de um sabor (meio a meio): regras únicas para a loja (navegador) e para o
// servidor do pedido. O navegador mostra o preço; o servidor refaz a mesma conta.

export type FlavorPricing = 'average' | 'highest';

export interface FlavorCategoryConfig {
  multi_flavor_enabled?: boolean | null;
  multi_flavor_pricing?: string | null;
  /** Máximo de sabores por tamanho: { "Grande": 3, "Broto": 1 }. "*" vale para tamanho único/sem regra. */
  multi_flavor_max?: Record<string, number> | null;
}

export interface FlavorProduct {
  id: string;
  name: string;
  store_id?: string;
  category_id?: string | null;
  price: number | string;
  offer_price?: number | string | null;
  is_on_offer?: boolean | null;
  is_available?: boolean | null;
}

export interface FlavorVariant {
  id?: string;
  product_id: string;
  name: string;
  price: number | string;
  is_available?: boolean | null;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
export const sizeKey = (name: string | null | undefined) => (name ?? '').trim().toLowerCase();

export function pricingOf(cfg: FlavorCategoryConfig | null | undefined): FlavorPricing {
  return cfg?.multi_flavor_pricing === 'highest' ? 'highest' : 'average';
}

/** Até quantos sabores neste tamanho (1 = não deixa misturar). */
export function maxFlavors(cfg: FlavorCategoryConfig | null | undefined, sizeName: string | null | undefined): number {
  if (!cfg?.multi_flavor_enabled) return 1;
  const map = cfg.multi_flavor_max ?? {};
  const wanted = sizeKey(sizeName);
  let found: number | undefined;
  for (const [k, v] of Object.entries(map)) {
    if (sizeKey(k) === wanted) found = num(v);
  }
  if (found === undefined) found = map['*'] !== undefined ? num(map['*']) : 2;
  return Math.max(1, Math.min(4, Math.floor(found)));
}

/**
 * Preço de um sabor no tamanho escolhido. Sem tamanho (produto sem variações): preço do produto
 * (ou o de oferta). Com tamanho: a variação de mesmo nome; sem ela, o sabor não serve (null).
 */
export function flavorPrice(product: FlavorProduct, variantsOfProduct: FlavorVariant[], sizeName: string | null | undefined): number | null {
  if (product.is_available === false) return null;
  if (sizeName) {
    const v = variantsOfProduct.find((x) => x.product_id === product.id && sizeKey(x.name) === sizeKey(sizeName) && x.is_available !== false);
    return v ? round2(num(v.price)) : null;
  }
  const base = num(product.price);
  const offer = product.is_on_offer && num(product.offer_price) > 0 ? num(product.offer_price) : base;
  return round2(Math.min(base, offer));
}

/** Preço da pizza (sem adicionais) pela regra da categoria. */
export function combinePrices(prices: number[], pricing: FlavorPricing): number {
  if (!prices.length) return 0;
  if (pricing === 'highest') return round2(Math.max(...prices));
  return round2(prices.reduce((s, p) => s + p, 0) / prices.length);
}

/** Fração como texto: 2 sabores → "1/2", 3 → "1/3". */
export const fractionLabel = (count: number) => (count <= 1 ? '' : `1/${count}`);

/** "1/2 Calabresa + 1/2 Frango" */
export function flavorsLabel(names: string[]): string {
  const f = fractionLabel(names.length);
  return names.map((n) => `${f} ${n}`.trim()).join(' + ');
}

// ---- Id do item no carrinho ----
// Formato antigo: "<produto>_<variação|default>_<JSON dos adicionais>".
// Com sabores, acrescenta "~f:<id>,<id>" no fim (os outros sabores, sem o 1º).
const FLAVOR_MARK = '~f:';

export function withFlavorsInId(baseId: string, otherFlavorIds: string[]): string {
  return otherFlavorIds.length ? `${baseId}${FLAVOR_MARK}${otherFlavorIds.join(',')}` : baseId;
}

export function splitFlavorsFromId(id: string): { baseId: string; otherFlavorIds: string[] } {
  const s = String(id ?? '');
  const i = s.lastIndexOf(FLAVOR_MARK);
  if (i < 0) return { baseId: s, otherFlavorIds: [] };
  const ids = s.slice(i + FLAVOR_MARK.length).split(',').map((x) => x.trim()).filter(Boolean);
  return { baseId: s.slice(0, i), otherFlavorIds: ids };
}

export interface FlavorCheckInput {
  main: FlavorProduct;
  others: FlavorProduct[];
  sizeName: string | null;
  variants: FlavorVariant[];
  config: FlavorCategoryConfig | null | undefined;
  storeId: string;
}

export type FlavorCheck =
  | { ok: true; price: number; flavors: { product_id: string; name: string; fraction: number }[]; label: string }
  | { ok: false; code: string };

/** Confere a pizza montada e devolve o preço (sem adicionais) e a lista de sabores. */
export function checkFlavors(input: FlavorCheckInput): FlavorCheck {
  const { main, others, sizeName, variants, config, storeId } = input;
  const all = [main, ...others];
  if (!config?.multi_flavor_enabled) return { ok: false, code: 'flavors_disabled' };
  if (all.length > maxFlavors(config, sizeName)) return { ok: false, code: 'too_many_flavors' };
  const prices: number[] = [];
  for (const p of all) {
    if (!p || (p.store_id && p.store_id !== storeId)) return { ok: false, code: 'flavor_unavailable' };
    if ((p.category_id ?? null) !== (main.category_id ?? null)) return { ok: false, code: 'flavor_other_category' };
    const price = flavorPrice(p, variants, sizeName);
    if (price === null) return { ok: false, code: 'flavor_unavailable' };
    prices.push(price);
  }
  const fraction = round2(1 / all.length);
  return {
    ok: true,
    price: combinePrices(prices, pricingOf(config)),
    flavors: all.map((p) => ({ product_id: p.id, name: p.name, fraction })),
    label: flavorsLabel(all.map((p) => p.name)),
  };
}
