// Leitor de código de barras no PDV: com o campo de busca focado, o leitor USB "digita" o
// código e aperta Enter. Se o código bate exatamente com um produto, ele vai direto ao
// carrinho (quantidade 1) e o campo é limpo para a próxima leitura.
// Funciona no campo de busca do próprio grid (celular) e no campo do topo do PDV (computador),
// que é reconhecido por ter o mesmo texto da busca recebida (externalSearchTerm).
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  findByBarcode,
  isScannerBurst,
  looksLikeBarcode,
  normalizeBarcode,
  pushKeyTime,
} from '@/lib/pdv/barcode';
import type { PDVProduct } from '@/hooks/usePDVProducts';

export interface ScannedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

interface Options {
  storeId: string | null;
  products: PDVProduct[];
  /** Campo de busca do próprio grid (celular). */
  ownInputRef: React.RefObject<HTMLInputElement>;
  /** Texto atual do campo de busca do topo do PDV (quando existe). */
  externalSearchTerm: string;
  clearOwnSearch: () => void;
  onScanned: (product: ScannedProduct) => void;
}

/** Limpa um input controlado pelo React de fora do componente dono (dispara o onChange dele). */
function clearControlledInput(input: HTMLInputElement) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, '');
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export function usePDVBarcodeScanner(opts: Options) {
  // Sempre a versão mais recente das opções dentro do ouvinte do teclado
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const keyTimesRef = useRef<number[]>([]);

  useEffect(() => {
    const isSearchInput = (el: HTMLInputElement) => {
      const o = optsRef.current;
      if (el === o.ownInputRef.current) return true;
      return o.externalSearchTerm !== '' && el.value === o.externalSearchTerm;
    };

    const handler = async (e: KeyboardEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        keyTimesRef.current = pushKeyTime(keyTimesRef.current, performance.now());
        return;
      }
      if (e.key !== 'Enter') return;

      const keyTimes = keyTimesRef.current;
      keyTimesRef.current = [];
      if (!isSearchInput(target)) return;

      const code = normalizeBarcode(target.value);
      if (!looksLikeBarcode(code)) return;
      e.preventDefault();

      const o = optsRef.current;
      const fromScanner = isScannerBurst(keyTimes);
      const clear = () => (target === o.ownInputRef.current ? o.clearOwnSearch() : clearControlledInput(target));

      let product: { id: string; name: string; price: number; image_url: string | null; is_available?: boolean } | null =
        findByBarcode(o.products, code);
      if (!product && o.storeId) {
        const { data, error } = await (supabase as any)
          .from('products')
          .select('id, name, price, image_url, is_available')
          .eq('store_id', o.storeId)
          .eq('barcode', code)
          .maybeSingle();
        if (error) console.error('[PDV] Erro ao buscar código de barras:', error);
        product = data ?? null;
      }

      if (!product) {
        if (fromScanner) {
          toast.error(`Nenhum produto com o código ${code}`);
          clear();
        }
        return;
      }
      if (product.is_available === false) {
        toast.error(`${product.name} está indisponível`);
        clear();
        return;
      }
      o.onScanned({ id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url });
      toast.success(`${product.name} adicionado`);
      clear();
    };

    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, []);
}
