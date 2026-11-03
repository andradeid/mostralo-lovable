// Consultas do PDV para os modos Lista e Misto: busca por nome (poucos resultados, para
// escolher pelo teclado) e os atalhos (products.pdv_shortcut). Colunas fora dos tipos gerados.
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { nameOrBarcodeFilter } from '@/lib/pdv/barcode';

const db = supabase as any;

export interface PDVCatalogProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  barcode: string | null;
  sold_by_weight: boolean | null;
  pdv_shortcut?: boolean | null;
  pdv_shortcut_order?: number | null;
}

const COLUMNS = 'id, name, price, image_url, barcode, sold_by_weight, pdv_shortcut, pdv_shortcut_order';

function normalize(rows: any[] | null): PDVCatalogProduct[] {
  return (rows ?? []).map((r) => ({ ...r, price: Number(r.price) || 0 }));
}

/** Busca por nome (ou código exato) com espera de 250 ms entre teclas. */
export function usePDVProductSearch(storeId: string | null, term: string, limit = 8) {
  const [debounced, setDebounced] = useState(term);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(t);
  }, [term]);

  const q = debounced.trim();
  const query = useQuery({
    queryKey: ['pdv-name-search', storeId, q, limit],
    enabled: !!storeId && q.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const filter = nameOrBarcodeFilter(q);
      let req = db.from('products').select(COLUMNS).eq('store_id', storeId).eq('is_available', true);
      req = filter ? req.or(filter) : req.ilike('name', `%${q}%`);
      const { data, error } = await req.order('name').limit(limit);
      if (error) throw error;
      return normalize(data);
    },
  });

  return {
    results: q ? query.data ?? [] : [],
    /** Os resultados ainda não são do texto atual (não escolher com Enter). */
    pending: debounced !== term || query.isFetching,
  };
}

export const pdvShortcutsKey = (storeId: string | null) => ['pdv-shortcuts', storeId] as const;

/** Atalhos do modo Misto: disponíveis, pela ordem e depois pelo nome. */
export function usePDVShortcuts(storeId: string | null, enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: pdvShortcutsKey(storeId),
    enabled: !!storeId && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await db
        .from('products')
        .select(COLUMNS)
        .eq('store_id', storeId)
        .eq('pdv_shortcut', true)
        .eq('is_available', true)
        .order('pdv_shortcut_order', { ascending: true, nullsFirst: false })
        .order('name')
        .limit(60);
      if (error) throw error;
      return normalize(data);
    },
  });

  /** Marca/desmarca um produto como atalho (dono/admin; mesma gravação do cadastro de produto). */
  const toggleShortcut = useMutation({
    mutationFn: async ({ productId, on }: { productId: string; on: boolean }) => {
      const { data, error } = await db
        .from('products')
        .update({ pdv_shortcut: on })
        .eq('id', productId)
        .eq('store_id', storeId)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Sem permissão para mudar este produto');
    },
    onSuccess: (_d, { on }) => {
      toast.success(on ? 'Atalho adicionado' : 'Atalho removido');
      queryClient.invalidateQueries({ queryKey: pdvShortcutsKey(storeId) });
    },
    onError: (error) => {
      const msg = (error as { message?: string })?.message;
      toast.error(msg?.trim() ? msg : 'Não foi possível salvar o atalho');
    },
  });

  return { shortcuts: query.data ?? [], isLoading: query.isLoading, toggleShortcut };
}
