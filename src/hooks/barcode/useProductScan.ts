// Leitura → produto da loja ativa. Junta o detector global, a busca pelo código exato, os
// avisos (toast + bip) e o cadastro rápido de código não cadastrado (só dono/admin).
// Cada tela só diz o que fazer com o produto (carrinho, comanda, pedido, entrada).
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { findStockProductByBarcode, type StockProduct } from '@/hooks/stock/stockQueries';
import { canManageProducts, checkScannedProduct, notFoundMessage } from '@/lib/barcode/scanRules';
import { playScanBeep } from '@/lib/barcode/beep';
import type { QuickProductDialogProps } from '@/components/admin/products/quick/QuickProductDialog';
import { useBarcodeScanner, type ScanContext } from './useBarcodeScanner';

export type ScannedProduct = StockProduct;

/** Um aviso de leitura por vez (leituras seguidas trocam o aviso em vez de empilhar). */
export const SCAN_TOAST_ID = 'barcode-scan';

const CACHE_MS = 60_000;

interface Options {
  storeId: string | null;
  enabled?: boolean;
  /** Diálogo onde o leitor funciona (data-barcode-zone no DialogContent). */
  zone?: string;
  /** Código digitado à mão na busca + Enter também adiciona (se existir). */
  typedSearchCodes?: boolean;
  /** false: aceita produto indisponível (entrada de mercadoria). */
  requireAvailable?: boolean;
  /** Mostra estoque inicial no cadastro rápido. */
  askInitialStock?: boolean;
  /** A leitura veio da busca de produto: limpe o campo. */
  onClearSearch?: () => void;
  onProduct: (product: ScannedProduct, ctx: ScanContext) => void | Promise<void>;
  /** Troca o aviso (toast) de código não cadastrado por um aviso da tela (ex.: dentro de diálogo). */
  onNotFound?: (code: string) => void;
}

export function useProductScan({
  storeId,
  enabled = true,
  zone,
  typedSearchCodes,
  requireAvailable = true,
  askInitialStock = true,
  onClearSearch,
  onProduct,
  onNotFound,
}: Options) {
  const { userRole } = useAuth();
  const canCreate = canManageProducts(userRole);
  const [quick, setQuick] = useState<{ open: boolean; code: string }>({ open: false, code: '' });
  const cacheRef = useRef(new Map<string, { product: ScannedProduct; at: number }>());
  const latest = useRef({ onProduct, onClearSearch, onNotFound, requireAvailable, canCreate });
  latest.current = { onProduct, onClearSearch, onNotFound, requireAvailable, canCreate };

  useEffect(() => cacheRef.current.clear(), [storeId]);

  const deliver = useCallback(async (product: ScannedProduct, ctx: ScanContext) => {
    const check = checkScannedProduct(product, { requireAvailable: latest.current.requireAvailable });
    if ('message' in check) {
      playScanBeep('error');
      toast.error(check.message, { id: SCAN_TOAST_ID });
      return;
    }
    playScanBeep('ok');
    if ('warning' in check && check.warning) toast.warning(check.warning, { id: `${SCAN_TOAST_ID}-warning` });
    try {
      await latest.current.onProduct(product, ctx);
    } catch (e) {
      console.error('[leitor] Erro ao usar o produto lido:', e);
    }
  }, []);

  const handleScan = useCallback(
    async (code: string, ctx: ScanContext) => {
      if (!storeId) return;
      // Leitura do leitor na busca: limpa já (o código digitado à mão só sai se achar o produto)
      if (ctx.fromSearch && !ctx.typed) latest.current.onClearSearch?.();

      let product: ScannedProduct | null = null;
      const cached = cacheRef.current.get(code);
      if (cached && Date.now() - cached.at < CACHE_MS) {
        product = cached.product;
      } else {
        try {
          product = await findStockProductByBarcode(storeId, code);
        } catch (e) {
          console.error('[leitor] Erro ao buscar código:', e);
          playScanBeep('error');
          toast.error('Não foi possível buscar o código. Tente de novo.', { id: SCAN_TOAST_ID });
          return;
        }
        if (product) cacheRef.current.set(code, { product, at: Date.now() });
      }

      if (!product) {
        if (ctx.typed) return; // código digitado sem produto: fica a busca por nome
        playScanBeep('error');
        if (latest.current.onNotFound) {
          latest.current.onNotFound(code);
          return;
        }
        const allowed = latest.current.canCreate;
        toast.error(notFoundMessage(code), {
          id: SCAN_TOAST_ID,
          duration: 8000,
          description: allowed ? undefined : 'Peça ao dono ou administrador da loja para cadastrar.',
          action: allowed ? { label: 'Cadastrar agora', onClick: () => setQuick({ open: true, code }) } : undefined,
        });
        return;
      }
      if (ctx.typed) latest.current.onClearSearch?.();
      await deliver(product, ctx);
    },
    [storeId, deliver],
  );

  useBarcodeScanner({ enabled: enabled && !!storeId, zone, typedSearchCodes, onScan: handleScan });

  const quickDialogProps: QuickProductDialogProps = {
    open: quick.open,
    onOpenChange: (open) => setQuick((q) => ({ ...q, open })),
    storeId,
    barcode: quick.code,
    askInitialStock,
    onCreated: (product) => {
      if (product.barcode) cacheRef.current.set(product.barcode, { product, at: Date.now() });
      void deliver(product, { fromSearch: false, typed: false });
    },
  };

  /** Mesmo fluxo da leitura para um código vindo de outro lugar (ex.: Enter na busca da tela). */
  const scanCode = useCallback((code: string) => handleScan(code, { fromSearch: false, typed: false }), [handleScan]);

  const openQuickCreate = useCallback((code: string) => setQuick({ open: true, code }), []);

  return { quickDialogProps, canCreate, scanCode, openQuickCreate };
}
