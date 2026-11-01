// Imprime um pedido na térmica do app (sem janela de impressão). Evita imprimir o mesmo pedido duas vezes seguidas.
import { supabase } from '@/integrations/supabase/client';
import { buildReceipt, type Order, type OrderAddon, type OrderItem, type StorePrintLayout, type Via } from './receipt';
import { DEFAULT_PRINT_CONFIG } from '@/lib/printDefaults';
import { isNativeApp } from './nativeBridge';
import { loadPrintSettings, printerLabel, remoteLog, sendToPrinter } from './nativePrinter';
import { forgetPrint, isDuplicatePrint } from './dedupe';
import { toast } from 'sonner';

export function hasNativePrinter(): boolean {
  return isNativeApp() && !!loadPrintSettings().printer;
}

export async function printOrderNative(orderId: string): Promise<'printed' | 'skipped'> {
  const log = (l: string) => remoteLog(l, 'pedido');
  const s = loadPrintSettings();
  log(`Imprimir pedido ${orderId} · impressora ${s.printer ? printerLabel(s.printer) : 'nenhuma'}`);
  if (!s.printer) throw new Error('Escolha a impressora na aba Impressora do app');
  if (isDuplicatePrint(orderId)) { log('Ignorado: mesmo pedido mandado há menos de 20 s'); return 'skipped'; }
  try {
    const { data: order, error } = await supabase.from('orders')
      .select('id, order_number, customer_name, customer_phone, customer_address, delivery_type, payment_method, payment_details, subtotal, delivery_fee, promotion_discount, total, notes, created_at, scheduled_for, source, store_id, payment_status')
      .eq('id', orderId).single();
    if (error || !order) { log(`Erro ao ler pedido: ${error?.message ?? 'não encontrado'}`); throw new Error(`pedido não encontrado${error ? ` (${error.message})` : ''}`); }
    log(`Pedido #${order.order_number} lido`);
    const [{ data: items }, { data: store }, { data: cfg }] = await Promise.all([
      supabase.from('order_items').select('id, product_name, quantity, subtotal, notes').eq('order_id', orderId).order('created_at'),
      supabase.from('stores').select('name').eq('id', order.store_id).single(),
      supabase.from('print_configurations').select('sections, custom_texts, print_copies').eq('store_id', order.store_id)
        .eq('document_type', 'complete').eq('is_active', true).maybeSingle(),
    ]);
    // Mesma configuração do Visualizar (sem configuração salva: layout padrão, só a via completa)
    const conf = (cfg ?? DEFAULT_PRINT_CONFIG) as { sections?: StorePrintLayout['sections']; custom_texts?: { headerText?: string; footerText?: string }; print_copies?: Record<string, boolean> };
    const vias = (['complete', 'kitchen', 'delivery'] as Via[]).filter(v => conf.print_copies?.[v]);
    const layout: StorePrintLayout = { sections: conf.sections, headerText: conf.custom_texts?.headerText, footerText: conf.custom_texts?.footerText, vias: vias.length ? vias : ['complete'] };
    log(`Vias: ${layout.vias!.join(', ')}`);
    const ids = (items ?? []).map(i => i.id);
    const { data: addons } = ids.length
      ? await supabase.from('order_addons').select('order_item_id, addon_name, quantity, subtotal').in('order_item_id', ids)
      : { data: [] as OrderAddon[] };
    const bytes = buildReceipt(order as unknown as Order, (items ?? []) as OrderItem[], (addons ?? []) as OrderAddon[], {
      paper: s.paper, codepage: s.codepage, semAcentos: s.semAcentos, copies: s.copies, storeName: store?.name ?? 'Loja', layout, cutter: s.cutter, kitchenSize: s.kitchenSize,
    });
    log(`Cupom montado: ${(items ?? []).length} item(ns), ${bytes.length} bytes`);
    await sendToPrinter(s.printer, bytes, log);
    log('Pedido impresso');
    return 'printed';
  } catch (e) {
    log(`Falhou: ${e instanceof Error ? e.message : JSON.stringify(e)}`);
    forgetPrint(orderId);
    throw e;
  }
}

const AUTO_KEY = 'mostralo-app-impressos-ao-aceitar';

/** Chamado depois de aceitar um pedido no app: imprime uma vez só por pedido. */
export async function autoPrintOnAccept(orderId: string): Promise<void> {
  if (!hasNativePrinter() || !loadPrintSettings().printOnAccept) return;
  let done: string[] = [];
  try { done = JSON.parse(localStorage.getItem(AUTO_KEY) || '[]'); } catch { /* */ }
  if (done.includes(orderId)) return;
  try {
    const r = await printOrderNative(orderId);
    if (r === 'printed') toast.success('Pedido impresso');
    try { localStorage.setItem(AUTO_KEY, JSON.stringify([...done, orderId].slice(-300))); } catch { /* */ }
  } catch (e) {
    toast.error(`Não imprimiu: ${(e as Error).message}`);
  }
}
