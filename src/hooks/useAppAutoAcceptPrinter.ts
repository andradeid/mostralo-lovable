// App Mostralo Pedidos: confere a cada 10 s (também com a tela desligada, pelo serviço de segundo plano).
// - Pedido novo esperando aceite: notificação com som (como o GloriaFood).
// - Pedido aceito sozinho (aceite automático da loja): imprime e avisa.
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { isNativeApp, nativePlugin } from '@/lib/thermal/nativeBridge';
import { autoPrintOnAccept, hasNativePrinter } from '@/lib/thermal/printOrderNative';
import { remoteLog } from '@/lib/thermal/nativePrinter';
import { playNewOrderSound } from '@/utils/soundPlayer';

export function useAppAutoAcceptPrinter(storeId: string | null) {
  const since = useRef(new Date(Date.now() - 30_000).toISOString());
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!storeId || !isNativeApp()) return;
    let active = true;
    const notify = (id: string, title: string, text: string) =>
      Promise.resolve().then(() => nativePlugin('PedidosService').notifyOrder({ id, title, text })).catch(() => undefined);
    let lastTick = Date.now();
    let lastHeartbeat = 0;
    const tick = async () => {
      // Registro do intervalo real com a tela apagada (o Android pode atrasar os relógios)
      const now = Date.now();
      if (document.hidden && now - lastHeartbeat > 5 * 60_000) { lastHeartbeat = now; remoteLog(`Segundo plano: conferindo (intervalo ${Math.round((now - lastTick) / 1000)} s)`, 'automatico'); }
      lastTick = now;
      const { data: store } = await supabase.from('stores').select('delivery_config').eq('id', storeId).maybeSingle();
      const auto = (store?.delivery_config as { auto_accept_orders?: boolean } | null)?.auto_accept_orders === true;
      if (!active) return;
      const { data } = await supabase.from('orders').select('id, order_number, status, customer_name, total')
        .eq('store_id', storeId).in('status', ['entrada', 'em_preparo', 'confirmado'])
        .gte('created_at', since.current).order('created_at').limit(20);
      for (const o of data ?? []) {
        if (!active) break;
        const total = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(o.total) || 0);
        if (o.status === 'entrada') {
          // Esperando aceite manual: avisa uma vez
          const key = `novo:${o.id}`;
          if (seen.current.has(key)) continue;
          seen.current.add(key);
          remoteLog(`Pedido novo #${o.order_number} esperando aceite${document.hidden ? ' (tela apagada)' : ''}`, 'automatico');
          void notify(o.id, `Pedido novo #${o.order_number}`, `${o.customer_name ?? 'Cliente'} · ${total} · toque para aceitar`);
          void playNewOrderSound().catch(() => undefined);
          continue;
        }
        if (!auto || seen.current.has(o.id)) continue;
        seen.current.add(o.id);
        remoteLog(`Aceite automático: pedido #${o.order_number} (${o.status}) chegou, imprimindo${document.hidden ? ' (tela apagada)' : ''}`, 'automatico');
        void notify(o.id, `Pedido #${o.order_number} aceito`, `${o.customer_name ?? 'Cliente'} · ${total}${hasNativePrinter() ? ' · imprimindo' : ''}`);
        void playNewOrderSound().catch(() => undefined);
        toast.info(`Pedido #${o.order_number} aceito automaticamente`);
        if (hasNativePrinter()) await autoPrintOnAccept(o.id);
      }
    };
    const id = setInterval(() => { void tick(); }, 10_000);
    void tick();
    return () => { active = false; clearInterval(id); };
  }, [storeId]);
}
