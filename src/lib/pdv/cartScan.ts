// Leitura no PDV: ler de novo o mesmo produto soma 1 na linha que já está no carrinho
// (mesmo produto e preço, sem observação nem adicionais); senão entra uma linha nova.

export interface ScanCartLine {
  id: string;
  product_id?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  notes?: string;
  addons?: Record<string, unknown>;
}

const isPlain = (l: { notes?: string; addons?: Record<string, unknown> }) =>
  !l.notes && (!l.addons || Object.keys(l.addons).length === 0);

export function mergeScannedItem<T extends ScanCartLine>(
  cart: T[],
  item: Omit<T, 'id' | 'total_price'>,
  newId: () => string,
): T[] {
  const idx = cart.findIndex(
    (l) => !!item.product_id && l.product_id === item.product_id && l.unit_price === item.unit_price && isPlain(l) && isPlain(item),
  );
  if (idx === -1) {
    return [...cart, { ...item, id: newId(), total_price: item.unit_price * item.quantity } as T];
  }
  return cart.map((l, i) => {
    if (i !== idx) return l;
    const quantity = l.quantity + item.quantity;
    return { ...l, quantity, total_price: l.unit_price * quantity };
  });
}
