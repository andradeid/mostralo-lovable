// Modo da tela do PDV: padrão da loja (stores.pdv_layout, dono/admin muda pela função
// set_store_pdv_layout) com troca só neste computador (localStorage, por loja).
// Sem a coluna no banco ou sem localStorage, cai no modo grade.
import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { canManageProducts } from '@/lib/barcode/scanRules';
import { deviceLayoutKey, isPdvLayout, PDV_LAYOUT_LABEL, resolvePdvLayout, type PDVLayout } from '@/lib/pdv/layout';

// pdv_layout e a função ainda não estão nos tipos gerados do Supabase
const db = supabase as any;

export const pdvLayoutKey = (storeId: string | null) => ['pdv-layout', storeId] as const;

function readDevice(storeId: string | null): PDVLayout | null {
  if (!storeId) return null;
  try {
    const v = window.localStorage.getItem(deviceLayoutKey(storeId));
    return isPdvLayout(v) ? v : null;
  } catch {
    return null;
  }
}

function writeDevice(storeId: string, layout: PDVLayout | null) {
  try {
    if (layout) window.localStorage.setItem(deviceLayoutKey(storeId), layout);
    else window.localStorage.removeItem(deviceLayoutKey(storeId));
  } catch {
    /* navegador sem localStorage: vale só até recarregar */
  }
}

export function usePDVLayout(storeId: string | null) {
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const canManageStoreLayout = canManageProducts(userRole);
  const [device, setDevice] = useState<PDVLayout | null>(() => readDevice(storeId));

  useEffect(() => setDevice(readDevice(storeId)), [storeId]);

  const storeQuery = useQuery({
    queryKey: pdvLayoutKey(storeId),
    enabled: !!storeId,
    staleTime: 60_000,
    retry: false,
    queryFn: async (): Promise<PDVLayout> => {
      const { data, error } = await db.from('stores').select('pdv_layout').eq('id', storeId).maybeSingle();
      if (error) throw error;
      return isPdvLayout(data?.pdv_layout) ? data.pdv_layout : 'grid';
    },
  });

  const storeLayout: PDVLayout = storeQuery.data ?? 'grid';
  const layout = resolvePdvLayout(storeLayout, device);

  /** Troca só neste computador (null = volta ao padrão da loja). */
  const setDeviceLayout = useCallback(
    (next: PDVLayout | null) => {
      if (!storeId) return;
      writeDevice(storeId, next);
      setDevice(next);
    },
    [storeId],
  );

  const setStoreLayout = useMutation({
    mutationFn: async (next: PDVLayout) => {
      if (!storeId) throw new Error('Loja não encontrada');
      const { data, error } = await db.rpc('set_store_pdv_layout', { p_store_id: storeId, p_layout: next });
      if (error) throw error;
      return (isPdvLayout(data) ? data : next) as PDVLayout;
    },
    onSuccess: (value) => {
      queryClient.setQueryData(pdvLayoutKey(storeId), value);
      toast.success(`Modo padrão da loja: ${PDV_LAYOUT_LABEL[value]}`);
    },
    onError: (error) => {
      const msg = (error as { message?: string })?.message;
      toast.error(msg?.trim() ? msg : 'Não foi possível salvar o modo do PDV');
      queryClient.invalidateQueries({ queryKey: pdvLayoutKey(storeId) });
    },
  });

  return {
    /** Modo em uso nesta tela. */
    layout,
    storeLayout,
    /** Modo escolhido só neste computador (null = segue a loja). */
    deviceLayout: device,
    setDeviceLayout,
    canManageStoreLayout,
    setStoreLayout,
  };
}

export type PDVLayoutController = ReturnType<typeof usePDVLayout>;
