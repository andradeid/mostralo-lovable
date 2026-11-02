// Dados fiscais do produto (product_fiscal) no formulário de produto. Só aparece com NFC-e ou NF-e
// ligada na loja; só dono/admin grava (igual ao custo). Campo vazio = padrão da configuração fiscal.
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useFiscalFlags } from './useFiscalSettings';
import {
  emptyProductFiscal, isProductFiscalEmpty, productFiscalFromRow, productFiscalToRow, sameProductFiscal,
  validateProductFiscal, type ProductFiscalForm, type ProductFiscalRow,
} from '@/lib/fiscal/productFiscal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useProductFiscal(productId?: string) {
  const { userRole } = useAuth();
  const { storeId } = useStoreAccess();
  const flags = useFiscalFlags(storeId);
  const canEdit = userRole === 'store_admin' || userRole === 'master_admin';
  const enabled = canEdit && (flags.nfce || flags.nfe);
  const [form, setForm] = useState<ProductFiscalForm>(emptyProductFiscal);
  const savedRef = useRef<ProductFiscalRow>(productFiscalToRow(emptyProductFiscal()));

  useEffect(() => {
    if (!enabled || !productId) return;
    let alive = true;
    db.from('product_fiscal')
      .select('ncm, cfop, cest, icms_origem, icms_situacao, pis_cst, cofins_cst, unidade')
      .eq('product_id', productId)
      .maybeSingle()
      .then(({ data, error }: { data: ProductFiscalRow | null; error: unknown }) => {
        if (!alive) return;
        if (error) {
          console.error('Erro ao buscar dados fiscais do produto:', error);
          return;
        }
        const f = productFiscalFromRow(data);
        savedRef.current = productFiscalToRow(f);
        setForm(f);
      });
    return () => {
      alive = false;
    };
  }, [productId, enabled]);

  const errors = useMemo(() => validateProductFiscal(form), [form]);
  const isValid = Object.keys(errors).length === 0;
  const update = (patch: Partial<ProductFiscalForm>) => setForm((f) => ({ ...f, ...patch }));

  /** Grava só quando mudou. Produto novo sem nada preenchido não cria linha. */
  const save = async (finalProductId: string) => {
    if (!enabled || !isValid) return;
    const row = productFiscalToRow(form);
    if (sameProductFiscal(row, savedRef.current)) return;
    if (!productId && isProductFiscalEmpty(row)) return;
    const { error } = await db.from('product_fiscal')
      .upsert({ product_id: finalProductId, store_id: storeId, ...row }, { onConflict: 'product_id' });
    if (error) throw error;
    savedRef.current = row;
  };

  return { enabled, form, update, errors, isValid, save };
}

export type ProductFiscalApi = ReturnType<typeof useProductFiscal>;
