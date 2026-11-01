// Busca os dados da tela de Relatórios da loja para exportar (CSV/PDF).
// São as mesmas consultas dos componentes de src/components/admin/reports/, feitas uma vez só.
import { supabase } from '@/integrations/supabase/client';
import { paymentLabel } from '@/lib/scheduledOrders';
import type { DateRange } from '@/components/admin/reports/types';
import { previousPeriodStart, type RawStoreReport, type ReportComanda, type ReportCustomer, type ReportOrder } from './storeReport';

export interface LoadedStoreReport {
  raw: RawStoreReport;
  storeName: string;
  storeSlug: string | null;
}

export async function loadStoreReport(storeId: string, dateRange: DateRange, fallbackName?: string | null): Promise<LoadedStoreReport> {
  const fromIso = dateRange.from.toISOString();
  const toIso = dateRange.to.toISOString();
  const prevFromIso = previousPeriodStart(dateRange.from, dateRange.to).toISOString();

  const [store, orders, previousOrders, closedComandas, previousClosedComandas, comandasCreated, orderItems, comandaItems, customerLinks] =
    await Promise.all([
      supabase.from('stores').select('name, slug').eq('id', storeId).maybeSingle(),
      supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .order('created_at', { ascending: false }),
      supabase.from('orders').select('*').eq('store_id', storeId).gte('created_at', prevFromIso).lt('created_at', fromIso),
      supabase
        .from('comandas')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'closed')
        .gte('closed_at', fromIso)
        .lte('closed_at', toIso),
      supabase
        .from('comandas')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'closed')
        .gte('closed_at', prevFromIso)
        .lt('closed_at', fromIso),
      supabase
        .from('comandas')
        .select('*')
        .eq('store_id', storeId)
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .order('created_at', { ascending: false }),
      supabase
        .from('order_items')
        .select('product_name, product_id, quantity, subtotal, order:orders!inner(store_id, status, created_at)')
        .eq('order.store_id', storeId)
        .eq('order.status', 'concluido')
        .gte('order.created_at', fromIso)
        .lte('order.created_at', toIso),
      supabase
        .from('comanda_items')
        .select('product_name, product_id, quantity, total_price, comanda:comandas!inner(store_id, status, closed_at)')
        .eq('comanda.store_id', storeId)
        .eq('comanda.status', 'closed')
        .gte('comanda.closed_at', fromIso)
        .lte('comanda.closed_at', toIso),
      supabase.from('customer_stores').select('customer_id, customers(*)').eq('store_id', storeId),
    ]);

  const failed = [orders, previousOrders, closedComandas, previousClosedComandas, comandasCreated, orderItems, comandaItems, customerLinks].find(
    r => r.error,
  );
  if (failed?.error) throw failed.error;

  const toOrder = (o: any): ReportOrder => ({
    ...o,
    payment_label: o.payment_method ? paymentLabel(o.payment_method, o.payment_details) : null,
  });

  const raw: RawStoreReport = {
    from: dateRange.from,
    to: dateRange.to,
    orders: (orders.data || []).map(toOrder),
    previousOrders: (previousOrders.data || []).map(toOrder),
    closedComandas: (closedComandas.data || []) as ReportComanda[],
    previousClosedComandas: (previousClosedComandas.data || []) as ReportComanda[],
    comandasCreated: (comandasCreated.data || []) as ReportComanda[],
    orderItems: (orderItems.data || []).map((i: any) => ({ product_name: i.product_name, quantity: i.quantity, total: i.subtotal })),
    comandaItems: (comandaItems.data || []).map((i: any) => ({ product_name: i.product_name, quantity: i.quantity, total: i.total_price })),
    customers: (customerLinks.data || []).map((l: any) => l.customers).filter(Boolean) as ReportCustomer[],
  };

  return {
    raw,
    storeName: store.data?.name || fallbackName || 'Loja',
    storeSlug: store.data?.slug || null,
  };
}
