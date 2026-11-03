// Atalhos de teclado do PDV: F2 quantidade do último item, F3 busca por nome, F4 pagamento,
// Delete remove o último item. Só enquanto a tela de venda do PDV está à vista (`enabled`),
// sem diálogo aberto e fora de campos de texto (F2–F4 valem também na busca do PDV).
// Regra pura em src/lib/pdv/hotkeys.ts. Não é global no app: o PDV liga e desliga.
import { useEffect, useRef } from 'react';
import { classifyFocus } from '@/lib/barcode/scanner';
import { pdvHotkeyAction, type PDVHotkeyAction } from '@/lib/pdv/hotkeys';
import { BARCODE_SEARCH_ATTR } from '@/hooks/barcode/useBarcodeScanner';

type Handlers = Record<PDVHotkeyAction, () => void>;

interface Options extends Handlers {
  enabled: boolean;
}

function hasOpenDialog(): boolean {
  return document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]') !== null;
}

export function usePDVHotkeys({ enabled, ...handlers }: Options) {
  const ref = useRef({ enabled, handlers });
  ref.current = { enabled, handlers };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!ref.current.enabled || e.defaultPrevented || e.isComposing) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      const kind = target
        ? classifyFocus({
            tagName: target.tagName,
            type: target.getAttribute('type'),
            role: target.getAttribute('role'),
            isContentEditable: target.isContentEditable,
            isProductSearch: target.closest(`[${BARCODE_SEARCH_ATTR}]`) !== null,
          })
        : 'other';
      const action = pdvHotkeyAction(e, {
        dialogOpen: hasOpenDialog(),
        editableFocused: kind !== 'other',
        searchFocused: kind === 'search',
      });
      if (!action) return;
      e.preventDefault(); // F3 não abre a busca do navegador, F2/F4 nada do navegador
      ref.current.handlers[action]();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

/** Foca o campo de busca de produto visível do PDV (F3). */
export function focusPdvSearch() {
  const inputs = document.querySelectorAll<HTMLInputElement>(`input[${BARCODE_SEARCH_ATTR}]`);
  for (const input of Array.from(inputs)) {
    if (input.offsetParent !== null) {
      input.focus();
      input.select();
      return;
    }
  }
}
