import { createClient } from '@supabase/supabase-js';
import type { Order, OrderAddon, OrderItem } from './receipt';

const URL = 'https://noshwvwpjtnvndokbfjx.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA';

export const supabase = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'mostralo-pedidos-auth' } });

export interface Store { id: string; name: string }

/** Lojas que o usuário pode ver (dono ou equipe). */
export async function myStores(userId: string): Promise<Store[]> {
  const [owned, roles] = await Promise.all([
    supabase.from('stores').select('id, name').eq('owner_id', userId),
    supabase.from('user_roles').select('store_id').eq('user_id', userId).not('store_id', 'is', null),
  ]);
  const ids = new Set((roles.data ?? []).map(r => r.store_id as string));
  const extra = [...ids].filter(id => !(owned.data ?? []).some(s => s.id === id));
  const more = extra.length ? (await supabase.from('stores').select('id, name').in('id', extra)).data ?? [] : [];
  return [...(owned.data ?? []), ...more].sort((a, b) => a.name.localeCompare(b.name));
}

const ORDER_COLS = 'id, order_number, customer_name, customer_phone, customer_address, delivery_type, payment_method, payment_details, subtotal, delivery_fee, promotion_discount, total, notes, created_at, scheduled_for, source, status, updated_at';

export type OrderRow = Order & { status: string; updated_at: string };

/** Pedidos da loja criados ou alterados depois de `since`. */
export async function ordersSince(storeId: string, since: string): Promise<OrderRow[]> {
  const { data, error } = await supabase.from('orders').select(ORDER_COLS)
    .eq('store_id', storeId).gte('updated_at', since).order('created_at', { ascending: true }).limit(100);
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

export async function todayOrders(storeId: string): Promise<OrderRow[]> {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase.from('orders').select(ORDER_COLS)
    .eq('store_id', storeId).gte('created_at', start.toISOString()).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

export async function orderDetails(orderId: string): Promise<{ items: OrderItem[]; addons: OrderAddon[] }> {
  const { data: items, error } = await supabase.from('order_items').select('id, product_name, quantity, subtotal, notes').eq('order_id', orderId).order('created_at');
  if (error) throw error;
  const ids = (items ?? []).map(i => i.id);
  const { data: addons } = ids.length
    ? await supabase.from('order_addons').select('order_item_id, addon_name, quantity, subtotal').in('order_item_id', ids)
    : { data: [] };
  return { items: (items ?? []) as OrderItem[], addons: (addons ?? []) as OrderAddon[] };
}
