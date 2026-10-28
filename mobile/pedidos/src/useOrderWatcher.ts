// Fica olhando os pedidos da loja a cada 8 s; pedido novo toca alarme e, se ligado, imprime sozinho.
import { useCallback, useEffect, useRef, useState } from 'react';
import { beep, notify } from './lib/alarm';
import { buildReceipt } from './lib/receipt';
import { sendToPrinter } from './lib/printers';
import { rememberPrinted, shouldPrint } from './lib/printRules';
import { loadPrinted, savePrinted, type Settings } from './lib/settings';
import { orderDetails, ordersSince, todayOrders, type OrderRow } from './lib/supabase';

export interface LogLine { at: string; text: string; ok: boolean }

export function useOrderWatcher(settings: Settings) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [log, setLog] = useState<LogLine[]>([]);
  const [online, setOnline] = useState(true);
  const printed = useRef(new Set(loadPrinted()));
  const known = useRef(new Set<string>());
  const since = useRef(new Date(Date.now() - 60_000).toISOString());
  const busy = useRef(false);
  const inFlight = useRef(new Set<string>());
  const cfg = useRef(settings);
  cfg.current = settings;

  const addLog = (text: string, ok = true) => setLog(l => [{ at: new Date().toLocaleTimeString('pt-BR'), text, ok }, ...l].slice(0, 40));

  const printOrder = useCallback(async (o: OrderRow, manual = false) => {
    const s = cfg.current;
    if (!s.printer) { addLog(`#${o.order_number}: escolha a impressora na aba Impressora`, false); return false; }
    if (inFlight.current.has(o.id)) return false;
    inFlight.current.add(o.id);
    try {
      const { items, addons } = await orderDetails(o.id);
      const bytes = buildReceipt(o, items, addons, { paper: s.paper, semAcentos: s.semAcentos, storeName: s.storeName, copies: s.copies });
      await sendToPrinter(s.printer, bytes);
      printed.current.add(o.id);
      savePrinted(rememberPrinted(loadPrinted(), o.id));
      addLog(`#${o.order_number} impresso${manual ? ' (manual)' : ''}`);
      return true;
    } catch (e) {
      addLog(`#${o.order_number}: falhou ao imprimir (${(e as Error).message}). Tento de novo em instantes.`, false);
      return false;
    } finally {
      inFlight.current.delete(o.id);
    }
  }, []);

  // Carga inicial: pedidos de hoje aparecem, mas os que já existiam não são impressos.
  useEffect(() => {
    if (!settings.storeId) return;
    known.current = new Set();
    todayOrders(settings.storeId).then(list => {
      setOrders(list);
      list.forEach(o => { known.current.add(o.id); printed.current.add(o.id); });
      addLog(`Conectado. ${list.length} pedido(s) hoje. Aguardando pedidos novos…`);
    }).catch(e => addLog(`Erro ao carregar pedidos: ${e.message}`, false));
    since.current = new Date(Date.now() - 60_000).toISOString();
  }, [settings.storeId]);

  useEffect(() => {
    if (!settings.storeId) return;
    const tick = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const started = new Date(Date.now() - 15_000).toISOString();
        const changed = await ordersSince(cfg.current.storeId!, since.current);
        since.current = started;
        setOnline(true);
        if (changed.length) {
          setOrders(prev => {
            const map = new Map(prev.map(o => [o.id, o]));
            changed.forEach(o => map.set(o.id, o));
            return [...map.values()].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 80);
          });
        }
        for (const o of changed) {
          const isNew = !known.current.has(o.id);
          known.current.add(o.id);
          if (isNew && o.status !== 'aguardando_pagamento') {
            beep(); notify(`Novo pedido #${o.order_number}`, `${o.customer_name ?? 'Cliente'} · ${o.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}`);
            addLog(`Novo pedido #${o.order_number}`);
          }
          if (cfg.current.autoPrint && shouldPrint(o, cfg.current.when, printed.current)) await printOrder(o);
        }
        // pedidos que falharam antes: tenta de novo
        if (cfg.current.autoPrint) {
          setOrders(prev => {
            prev.filter(o => known.current.has(o.id) && shouldPrint(o, cfg.current.when, printed.current) && Date.now() - Date.parse(o.created_at) < 6 * 3600_000)
              .slice(0, 2).forEach(o => { void printOrder(o); });
            return prev;
          });
        }
      } catch {
        setOnline(false);
      } finally {
        busy.current = false;
      }
    };
    const id = setInterval(tick, 8000);
    void tick();
    return () => clearInterval(id);
  }, [settings.storeId, printOrder]);

  return { orders, log, online, printOrder, addLog };
}
