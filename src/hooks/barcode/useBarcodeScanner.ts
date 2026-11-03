// Detector global do leitor de código de barras (modo teclado). Escuta o teclado na janela,
// funciona sem campo focado e não mexe em campos de texto comuns. Regras em src/lib/barcode/scanner.ts.
//
// Marcações no HTML:
// - `data-barcode-search` no campo de busca de produto: a leitura feita nele é consumida
//   (a tela recebe `fromSearch` e limpa a busca).
// - `data-barcode-zone="<nome>"` no conteúdo de um diálogo onde o leitor deve funcionar
//   (passe o mesmo `zone` ao hook). Com outro diálogo aberto por cima, o leitor fica parado.
import { useEffect, useRef } from 'react';
import {
  EMPTY_BUFFER,
  classifyFocus,
  feedKey,
  isTerminatorKey,
  scanAllowed,
  type FocusKind,
  type ScanBuffer,
} from '@/lib/barcode/scanner';
import { looksLikeBarcode, normalizeBarcode } from '@/lib/pdv/barcode';

export const BARCODE_SEARCH_ATTR = 'data-barcode-search';
export const BARCODE_ZONE_ATTR = 'data-barcode-zone';

export interface ScanContext {
  /** A leitura (ou o Enter) veio do campo de busca de produto: limpe a busca. */
  fromSearch: boolean;
  /** Código digitado à mão na busca + Enter (não foi rajada do leitor). */
  typed: boolean;
}

interface Options {
  enabled?: boolean;
  /** Diálogo onde o leitor funciona (data-barcode-zone). Sem zona: só sem diálogo aberto. */
  zone?: string;
  /** Código digitado à mão na busca de produto + Enter também conta (ctx.typed = true). */
  typedSearchCodes?: boolean;
  onScan: (code: string, ctx: ScanContext) => void;
}

function focusKindOf(target: EventTarget | null): FocusKind {
  if (!(target instanceof HTMLElement)) return 'other';
  return classifyFocus({
    tagName: target.tagName,
    type: target.getAttribute('type'),
    role: target.getAttribute('role'),
    isContentEditable: target.isContentEditable,
    isProductSearch: target.closest(`[${BARCODE_SEARCH_ATTR}]`) !== null,
  });
}

function openDialogZones(): (string | null)[] {
  const open = document.querySelectorAll('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
  return Array.from(open, (el) => el.getAttribute(BARCODE_ZONE_ATTR));
}

/** Clique num aviso (toast) não fecha o diálogo de baixo: use no onPointerDownOutside/onInteractOutside. */
export function keepOpenOnToastClick(e: { target: EventTarget | null; preventDefault: () => void }) {
  if (e.target instanceof Element && e.target.closest('[data-sonner-toaster]')) e.preventDefault();
}

export function useBarcodeScanner({ enabled = true, zone, typedSearchCodes = false, onScan }: Options) {
  const optsRef = useRef({ enabled, zone, typedSearchCodes, onScan });
  optsRef.current = { enabled, zone, typedSearchCodes, onScan };
  const bufferRef = useRef<ScanBuffer>(EMPTY_BUFFER);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const o = optsRef.current;
      if (!o.enabled || e.isComposing) return;

      const kind = focusKindOf(e.target);
      // Campo de texto comum (valor, desconto, CPF, nome...): o texto vai para o campo
      if (kind === 'editable') {
        bufferRef.current = EMPTY_BUFFER;
        return;
      }

      const { buffer, code } = feedKey(bufferRef.current, {
        key: e.key,
        time: e.timeStamp || performance.now(),
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
      });
      bufferRef.current = buffer;
      if (!isTerminatorKey(e.key)) return;
      if (!scanAllowed(o.zone, openDialogZones())) return;

      const fromSearch = kind === 'search';
      if (code) {
        // Consome o Enter/Tab: não envia formulário, não "clica" no botão focado, não pula de campo
        e.preventDefault();
        e.stopPropagation();
        o.onScan(code, { fromSearch, typed: false });
        return;
      }
      if (fromSearch && o.typedSearchCodes && e.key === 'Enter' && e.target instanceof HTMLInputElement) {
        const typed = normalizeBarcode(e.target.value);
        if (looksLikeBarcode(typed)) o.onScan(typed, { fromSearch, typed: true });
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);
}
