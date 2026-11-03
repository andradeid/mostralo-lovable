// Leitura no PDV: ler de novo o mesmo produto soma 1 na linha que já está no carrinho
// (mesmo produto e preço, sem observação nem adicionais, e não pesado); senão entra uma linha nova.
// "Último item" = a linha mexida por último (carimbo `touched`), usada no modo Lista, F2 e Delete.

export interface ScanCartLine {
  id: string;
  product_id?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  notes?: string;
  addons?: Record<string, unknown>;
  /** Item pesado (produto vendido por quilo): nunca soma com outra leitura. */
  weight_kg?: number;
  /** Ordem do último toque (maior = mais recente). */
  touched?: number;
}

const isPlain = (l: { notes?: string; addons?: Record<string, unknown>; weight_kg?: number }) =>
  !l.notes && (!l.addons || Object.keys(l.addons).length === 0) && l.weight_kg == null;

export function mergeScannedItem<T extends ScanCartLine>(
  cart: T[],
  item: Omit<T, 'id' | 'total_price'>,
  newId: () => string,
  stamp?: number,
): T[] {
  const touched = stamp === undefined ? {} : { touched: stamp };
  const idx = cart.findIndex(
    (l) => !!item.product_id && l.product_id === item.product_id && l.unit_price === item.unit_price && isPlain(l) && isPlain(item),
  );
  if (idx === -1) {
    return [...cart, { ...item, ...touched, id: newId(), total_price: item.unit_price * item.quantity } as T];
  }
  return cart.map((l, i) => {
    if (i !== idx) return l;
    const quantity = l.quantity + item.quantity;
    return { ...l, ...touched, quantity, total_price: l.unit_price * quantity };
  });
}

/** Linha mexida por último (maior `touched`; empate ou sem carimbo: a que está mais embaixo). */
export function lastCartItem<T extends ScanCartLine>(cart: T[]): T | null {
  let best: T | null = null;
  let bestStamp = -Infinity;
  for (const line of cart) {
    const s = line.touched ?? -1;
    if (s >= bestStamp) {
      best = line;
      bestStamp = s;
    }
  }
  return best;
}
