// App Mostralo Pedidos: pedidos aceitos sozinhos (aceite automático da loja) não passam pelo botão "Aceitar",
// então o app confere a cada 10 s e imprime os que entraram aceitos depois que ele abriu.
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { isNativeApp } from '@/lib/thermal/nativeBridge';
import { autoPrintOnAccept, hasNativePrinter } from '@/lib/thermal/printOrderNative';
import { playNewOrderSound } from '@/utils/soundPlayer';

export function useAppAutoAcceptPrinter(storeId: string | null) {
  const since = useRef(new Date(Date.now() - 30_000).toISOString());
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!storeId || !isNativeApp()) return;
    let active = true;
    const tick = async () => {
      if (!hasNativePrinter()) return;
      const { data: store } = await supabase.from('stores').select('delivery_config').eq('id', storeId).maybeSingle();
      const auto = (store?.delivery_config as { auto_accept_orders?: boolean } | null)?.auto_accept_orders === true;
      if (!auto || !active) return;
      const { data } = await supabase.from('orders').select('id, order_number, status')
        .eq('store_id', storeId).in('status', ['em_preparo', 'confirmado'])
        .gte('created_at', since.current).order('created_at').limit(20);
      for (const o of data ?? []) {
        if (seen.current.has(o.id) || !active) continue;
        seen.current.add(o.id);
        void playNewOrderSound().catch(() => undefined);
        toast.info(`Pedido #${o.order_number} aceito automaticamente`);
        await autoPrintOnAccept(o.id);
      }
    };
    const id = setInterval(() => { void tick(); }, 10_000);
    void tick();
    return () => { active = false; clearInterval(id); };
  }, [storeId]);
}
