// Imprime um pedido na térmica do app (sem janela de impressão). Evita imprimir o mesmo pedido duas vezes seguidas.
import { supabase } from '@/integrations/supabase/client';
import { buildReceipt, type Order, type OrderAddon, type OrderItem } from './receipt';
import { isNativeApp } from './nativeBridge';
import { loadPrintSettings, sendToPrinter } from './nativePrinter';
import { forgetPrint, isDuplicatePrint } from './dedupe';
import { toast } from 'sonner';

export function hasNativePrinter(): boolean {
  return isNativeApp() && !!loadPrintSettings().printer;
}

export async function printOrderNative(orderId: string): Promise<'printed' | 'skipped'> {
  const s = loadPrintSettings();
  if (!s.printer) throw new Error('Escolha a impressora na aba Impressora do app');
  if (isDuplicatePrint(orderId)) return 'skipped';
  try {
    const { data: order, error } = await supabase.from('orders')
      .select('id, order_number, customer_name, customer_phone, customer_address, delivery_type, payment_method, payment_details, subtotal, delivery_fee, promotion_discount, total, notes, created_at, scheduled_for, source, store_id')
      .eq('id', orderId).single();
    if (error || !order) throw new Error('pedido não encontrado');
    const [{ data: items }, { data: store }] = await Promise.all([
      supabase.from('order_items').select('id, product_name, quantity, subtotal, notes').eq('order_id', orderId).order('created_at'),
      supabase.from('stores').select('name').eq('id', order.store_id).single(),
    ]);
    const ids = (items ?? []).map(i => i.id);
    const { data: addons } = ids.length
      ? await supabase.from('order_addons').select('order_item_id, addon_name, quantity, subtotal').in('order_item_id', ids)
      : { data: [] as OrderAddon[] };
    const bytes = buildReceipt(order as unknown as Order, (items ?? []) as OrderItem[], (addons ?? []) as OrderAddon[], {
      paper: s.paper, semAcentos: s.semAcentos, copies: s.copies, storeName: store?.name ?? 'Loja',
    });
    await sendToPrinter(s.printer, bytes);
    return 'printed';
  } catch (e) {
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
