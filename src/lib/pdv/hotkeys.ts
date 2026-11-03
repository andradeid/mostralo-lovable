// Atalhos de teclado do PDV (F2 quantidade, F3 buscar, F4 pagar, Delete remove o último).
// Regra pura (testada em hotkeys.test.ts); o hook src/hooks/pdv/usePDVHotkeys.ts liga na tela.
// O leitor de código de barras nunca manda F2–F4 nem Delete, então não há conflito com ele.

export type PDVHotkeyAction = 'quantity' | 'search' | 'pay' | 'removeLast';

export interface HotkeyKeyEvent {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
}

export interface HotkeyContext {
  /** Algum diálogo aberto (pagamento, quantidade, peso, cadastro rápido...). */
  dialogOpen: boolean;
  /** Foco num campo de texto. */
  editableFocused: boolean;
  /** O campo focado é a busca de produto do PDV (F2–F4 continuam valendo nele). */
  searchFocused: boolean;
}

const F_KEYS: Record<string, PDVHotkeyAction> = { F2: 'quantity', F3: 'search', F4: 'pay' };

export function pdvHotkeyAction(e: HotkeyKeyEvent, ctx: HotkeyContext): PDVHotkeyAction | null {
  if (ctx.dialogOpen || e.ctrlKey || e.metaKey || e.altKey) return null;
  const fAction = F_KEYS[e.key];
  if (fAction) {
    if (e.repeat) return null;
    // Em campo de texto comum (observação, valor...) nada; na busca do PDV, as teclas F valem.
    if (ctx.editableFocused && !ctx.searchFocused) return null;
    return fAction;
  }
  if (e.key === 'Delete' && !e.shiftKey && !e.repeat) {
    // Delete dentro de campo apaga texto, nunca o item
    return ctx.editableFocused ? null : 'removeLast';
  }
  return null;
}

/** Quantidade digitada no diálogo do F2: inteiro de 1 a 999. */
export function parseQuantity(input: string): { ok: true; quantity: number } | { ok: false; error: string } {
  const raw = String(input ?? '').trim();
  if (!/^\d+$/.test(raw)) return { ok: false, error: 'Informe um número inteiro' };
  const quantity = Number(raw);
  if (quantity < 1) return { ok: false, error: 'A quantidade mínima é 1' };
  if (quantity > 999) return { ok: false, error: 'A quantidade máxima é 999' };
  return { ok: true, quantity };
}
