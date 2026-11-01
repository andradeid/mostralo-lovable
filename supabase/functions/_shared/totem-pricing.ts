// Preço do carrinho do totem, calculado no servidor pelo catálogo (o navegador não manda preço).
// Mesma conta que o totem mostra na tela: preço do produto + adicionais escolhidos, vezes a quantidade.

export interface TotemCartInput {
  product_id: string;
  quantity: number;
  addon_ids?: string[];
  notes?: string | null;
}

export interface PricedLine {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;   // produto + adicionais
  subtotal: number;
  notes: string | null;
  addons: { id: string; name: string; price: number }[];
}

export type PricedCart =
  | { ok: true; lines: PricedLine[]; total: number }
  | { ok: false; error: string; code: string };

const round2 = (n: number) => Math.round(n * 100) / 100;

// deno-lint-ignore no-explicit-any
export function priceTotemCart(items: TotemCartInput[], storeId: string, products: any[], addons: any[]): PricedCart {
  const productById = new Map(products.map((p) => [p.id, p]));
  const addonById = new Map(addons.filter((a) => a.store_id === storeId).map((a) => [a.id, a]));
  const lines: PricedLine[] = [];
  for (const it of items) {
    const qty = Number(it?.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return { ok: false, error: "Quantidade inválida", code: "invalid_quantity" };
    const p = productById.get(it.product_id);
    if (!p || p.store_id !== storeId || p.is_available === false) {
      return { ok: false, error: "Um produto do carrinho não está mais disponível", code: "product_unavailable" };
    }
    const chosen: { id: string; name: string; price: number }[] = [];
    for (const id of it.addon_ids ?? []) {
      const a = addonById.get(id);
      if (!a) return { ok: false, error: "Um adicional do carrinho não está mais disponível", code: "addon_unavailable" };
      chosen.push({ id: a.id, name: a.name, price: round2(Number(a.price) || 0) });
    }
    const unit = round2((Number(p.price) || 0) + chosen.reduce((s, a) => s + a.price, 0));
    lines.push({
      product_id: p.id, product_name: p.name, quantity: qty, unit_price: unit, subtotal: round2(unit * qty),
      notes: (it.notes ?? "").toString().trim().slice(0, 300) || null, addons: chosen,
    });
  }
  const total = round2(lines.reduce((s, l) => s + l.subtotal, 0));
  if (total <= 0) return { ok: false, error: "Total inválido", code: "invalid_total" };
  return { ok: true, lines, total };
}
